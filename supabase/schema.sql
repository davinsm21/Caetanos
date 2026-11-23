create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  max_guests integer not null check (max_guests > 0),
  bedrooms integer not null default 1 check (bedrooms >= 0),
  bathrooms integer not null default 1 check (bathrooms >= 0),
  base_price numeric(10,2) not null check (base_price >= 0),
  amenities jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id),
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests > 0),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  total_price numeric(10,2) not null check (total_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_id text,
  created_at timestamptz not null default now(),
  constraint bookings_dates_valid check (check_out > check_in)
);

alter table public.bookings drop constraint if exists bookings_no_overlapping_active;
alter table public.bookings add constraint bookings_no_overlapping_active
  exclude using gist (
    accommodation_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status = 'confirmed');

create index if not exists bookings_accommodation_dates_idx on public.bookings (accommodation_id, check_in, check_out);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  date date not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (accommodation_id, date)
);

create table if not exists public.home_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (section, key)
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  guest_name text not null,
  origin text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.accommodations enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.home_content enable row level security;
alter table public.testimonials enable row level security;

drop policy if exists "Public can read active accommodations" on public.accommodations;
create policy "Public can read active accommodations" on public.accommodations
  for select using (active = true);
drop policy if exists "Authenticated admins manage accommodations" on public.accommodations;
create policy "Authenticated admins manage accommodations" on public.accommodations
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read home content" on public.home_content;
create policy "Public can read home content" on public.home_content
  for select using (true);
drop policy if exists "Authenticated admins manage home content" on public.home_content;
create policy "Authenticated admins manage home content" on public.home_content
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read active testimonials" on public.testimonials;
create policy "Public can read active testimonials" on public.testimonials
  for select using (active = true);
drop policy if exists "Authenticated admins manage testimonials" on public.testimonials;
create policy "Authenticated admins manage testimonials" on public.testimonials
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Authenticated admins manage blocked dates" on public.blocked_dates;
create policy "Authenticated admins manage blocked dates" on public.blocked_dates
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Bookings intentionally have no anon/authenticated policies; server service-role calls only.

create or replace function public.create_pending_booking(
  p_accommodation_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking_id uuid;
  v_price numeric(10,2);
  v_max_guests integer;
begin
  if p_check_out <= p_check_in or p_check_in < current_date or p_guests < 1 then
    raise exception 'invalid booking dates or guest count';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_accommodation_id::text));
  select base_price, max_guests into v_price, v_max_guests
    from public.accommodations
    where id = p_accommodation_id and active = true
    for update;
  if not found or p_guests > v_max_guests then
    raise exception 'accommodation unavailable';
  end if;
  if exists (
    select 1 from public.blocked_dates
    where accommodation_id = p_accommodation_id
      and date >= p_check_in and date < p_check_out
  ) or exists (
    select 1 from public.bookings
    where accommodation_id = p_accommodation_id
      and (
        status = 'confirmed'
        or (status = 'pending' and created_at > now() - interval '30 minutes')
      )
      and daterange(check_in, check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
  ) then
    raise exception 'accommodation unavailable';
  end if;

  insert into public.bookings (
    accommodation_id, check_in, check_out, guests, guest_name, guest_email,
    guest_phone, total_price, status
  ) values (
    p_accommodation_id, p_check_in, p_check_out, p_guests, p_guest_name,
    p_guest_email, p_guest_phone, v_price * (p_check_out - p_check_in), 'pending'
  ) returning id into v_booking_id;
  return v_booking_id;
end;
$$;
revoke all on function public.create_pending_booking(uuid, date, date, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.create_pending_booking(uuid, date, date, integer, text, text, text) to service_role;

create or replace function public.is_accommodation_available(
  p_accommodation_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_check_out > p_check_in
    and p_check_in >= current_date
    and exists (
      select 1 from public.accommodations a
      where a.id = p_accommodation_id and a.active and p_guests <= a.max_guests
    )
    and not exists (
      select 1 from public.blocked_dates d
      where d.accommodation_id = p_accommodation_id
        and d.date >= p_check_in and d.date < p_check_out
    )
    and not exists (
      select 1 from public.bookings b
      where b.accommodation_id = p_accommodation_id
        and (
          b.status = 'confirmed'
          or (b.status = 'pending' and b.created_at > now() - interval '30 minutes')
        )
        and daterange(b.check_in, b.check_out, '[)') && daterange(p_check_in, p_check_out, '[)')
    );
$$;
revoke all on function public.is_accommodation_available(uuid, date, date, integer) from public;
grant execute on function public.is_accommodation_available(uuid, date, date, integer) to anon, authenticated, service_role;

insert into storage.buckets (id, name, public)
values ('home-assets', 'home-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read home assets" on storage.objects;
create policy "Public read home assets" on storage.objects
  for select using (bucket_id = 'home-assets');
drop policy if exists "Authenticated admins upload home assets" on storage.objects;
create policy "Authenticated admins upload home assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'home-assets' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Authenticated admins update home assets" on storage.objects;
create policy "Authenticated admins update home assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'home-assets' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'home-assets' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Authenticated admins delete home assets" on storage.objects;
create policy "Authenticated admins delete home assets" on storage.objects
  for delete to authenticated using (bucket_id = 'home-assets' and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.accommodations
  (slug, name, short_description, description, max_guests, bedrooms, bathrooms, base_price, amenities, images, active)
values
  ('casa-penareia', 'Casa Penareia',
   'A casa completa para reunir quem você ama, pertinho do mar.',
   'Casa com 3 quartos com ar-condicionado (2 suítes), sala ampla com sofá-cama e espaço para rede, cozinha completa e alpendre com mesa para 12 lugares a aproximadamente 20 m da praia.',
   12, 3, 3, 700,
   '["3 quartos", "2 suítes", "Ar-condicionado", "Cozinha completa", "Alpendre", "Espaço para redes"]'::jsonb, '[]'::jsonb, true),
  ('chale-plus', 'Chalé Plus',
   'A opção mais ampla e completa dos chalés.',
   'Um chalé confortável para até 5 hóspedes, com varanda exclusiva, mesa, redes e vista para o mar.',
   5, 1, 1, 230,
   '["Varanda privativa", "Rede", "Vista para o mar", "Cozinha equipada"]'::jsonb, '[]'::jsonb, true),
  ('chale-single', 'Chalé Single',
   'Ideal para casal ou pequena família.',
   'Um chalé acolhedor para até 4 hóspedes, com varanda exclusiva, mesa, redes e vista para o mar.',
   4, 1, 1, 190,
   '["Varanda privativa", "Rede", "Vista para o mar", "Ar-condicionado"]'::jsonb, '[]'::jsonb, true)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  max_guests = excluded.max_guests,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  base_price = excluded.base_price,
  amenities = excluded.amenities,
  active = true;

insert into public.home_content (section, key, value)
values
  ('hero', 'title', '{"text":"Chalés e casa de praia a poucos passos do mar"}'::jsonb),
  ('hero', 'subtitle', '{"text":"A brisa do litoral, o tempo mais leve e o mar por perto."}'::jsonb),
  ('hero', 'background', '{"image_url":""}'::jsonb),
  ('search', 'availability_title', '{"text":"Encontre seus dias de mar."}'::jsonb),
  ('differences', 'differences_title', '{"text":"Um lugar para respirar."}'::jsonb),
  ('experience', 'experience_title', '{"text":"Viva Caetanos de pertinho."}'::jsonb),
  ('experience', 'experience_text', '{"text":"Uma vila de pescadores onde o vento sopra manso, os dias pedem calma e o mar sempre encontra um jeito de fazer parte dos planos. Daqui, você também fica perto de Icaraizinho de Amontada e Moitas."}'::jsonb),
  ('experience', 'experience_image', '{"image_url":""}'::jsonb),
  ('experience', 'chalets_image', '{"image_url":""}'::jsonb),
  ('stays', 'stays_title', '{"text":"Estadias com o mar por perto."}'::jsonb),
  ('chalets', 'chalets_title', '{"text":"Varanda, rede e horizonte."}'::jsonb),
  ('chalets', 'chalets_text', '{"text":"Nos chalés, uma varanda exclusiva com mesa, redes e vista para o mar faz parte dos dias sem pressa."}'::jsonb),
  ('region', 'region_title', '{"text":"Deixe o vento escolher o caminho."}'::jsonb),
  ('region', 'region_text', '{"text":"Praia, aventura e paisagens que fazem parte de uma estadia em Caetanos."}'::jsonb),
  ('region', 'region_1', '{"image_url":""}'::jsonb),
  ('region', 'region_2', '{"image_url":""}'::jsonb),
  ('region', 'region_3', '{"image_url":""}'::jsonb),
  ('region', 'region_4', '{"image_url":""}'::jsonb),
  ('gallery', 'gallery_title', '{"text":"Entre marés e momentos."}'::jsonb),
  ('gallery', 'gallery_text', '{"text":"Fotografias reais da casa, da praia e dos arredores serão adicionadas aqui."}'::jsonb),
  ('gallery', 'gallery_1', '{"image_url":""}'::jsonb),
  ('gallery', 'gallery_2', '{"image_url":""}'::jsonb),
  ('gallery', 'gallery_3', '{"image_url":""}'::jsonb),
  ('gallery', 'gallery_4', '{"image_url":""}'::jsonb),
  ('gallery', 'gallery_5', '{"image_url":""}'::jsonb),
  ('audience', 'audience_title', '{"text":"Seu tempo. Sua companhia."}'::jsonb),
  ('audience', 'audience_text', '{"text":"Uma casa de temporada em Amontada para diferentes formas de viver o litoral."}'::jsonb),
  ('testimonials', 'testimonials_title', '{"text":"O mar também fica na memória."}'::jsonb),
  ('booking', 'booking_title', '{"text":"Pronto para viver Caetanos de perto?"}'::jsonb)
on conflict (section, key) do nothing;
