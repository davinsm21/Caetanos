import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SplitHeading } from "@/components/SplitHeading";
import { Reveal } from "@/components/Reveal";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { accommodations, formatPrice, getAccommodationImage } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Acomodações em Caetanos",
  description: "Conheça os chalés e a casa de praia da Casa Pé n’Areia em Caetanos, Amontada, Ceará.",
  alternates: { canonical: "/acomodacoes" },
  openGraph: { title: "Acomodações em Caetanos | Casa Pé n’Areia", description: "Chalés e casa de praia a poucos passos do mar.", url: "/acomodacoes" }
};

type SearchParams = Record<string, string | string[] | undefined>;
type StayResult = { stays: typeof accommodations; notice: string };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadStays(searchParams: SearchParams): Promise<StayResult> {
  const supabase = getSupabase();
  const checkIn = firstParam(searchParams.checkin);
  const checkOut = firstParam(searchParams.checkout);
  const guests = Number(firstParam(searchParams.guests) || 0);
  const requestedDates = Boolean(checkIn || checkOut);
  const validDates = Boolean(
    checkIn && checkOut &&
    /^\d{4}-\d{2}-\d{2}$/.test(checkIn) &&
    /^\d{4}-\d{2}-\d{2}$/.test(checkOut) &&
    new Date(`${checkOut}T00:00:00Z`) > new Date(`${checkIn}T00:00:00Z`)
  );
  const fallbackStays = guests > 0 ? accommodations.filter((stay) => stay.max_guests >= guests) : accommodations;
  if (!supabase) return {
    stays: fallbackStays,
    notice: requestedDates ? "Configure o Supabase para consultar a disponibilidade atualizada. Você também pode confirmar as datas pelo WhatsApp." : ""
  };
  const { data, error } = await supabase.from("accommodations").select("id, slug, name, short_description, description, max_guests, bedrooms, bathrooms, base_price, amenities, images").eq("active", true).order("base_price");
  if (error) {
    console.error("Não foi possível carregar acomodações:", error.message);
    return { stays: accommodations, notice: "Não foi possível atualizar as acomodações. Consulte as datas pelo WhatsApp." };
  }
  let stays = data || [];
  if (requestedDates && !validDates) return { stays, notice: "Confira as datas de check-in e check-out selecionadas." };
  if (guests > 0) stays = stays.filter((stay) => stay.max_guests >= guests);
  if (!validDates || !data?.length) {
    return { stays, notice: requestedDates ? "A disponibilidade online ainda não está configurada para essas datas. Fale com a gente para confirmar." : "" };
  }
  const checks = await Promise.all(stays.map(async (stay) => {
    if (!stay.id) return { stay, available: true };
    const { data: available, error: availabilityError } = await supabase.rpc("is_accommodation_available", {
      p_accommodation_id: stay.id, p_check_in: checkIn, p_check_out: checkOut, p_guests: Math.max(guests, 1)
    });
    if (availabilityError) {
      console.error("Não foi possível verificar disponibilidade:", availabilityError.message);
      return { stay, error: true };
    }
    return { stay, available: available === true };
  }));
  const availabilityFailed = checks.some((item) => "error" in item);
  return {
    stays: availabilityFailed ? stays : checks.filter((item) => item.available).map((item) => item.stay),
    notice: availabilityFailed ? "Não foi possível verificar a disponibilidade agora. Confirme suas datas pelo WhatsApp." :
      checks.some((item) => !item.available) ? "As acomodações disponíveis para as datas selecionadas estão abaixo." : "Acomodações disponíveis para as datas selecionadas."
  };
}

export default async function AccommodationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const { stays, notice } = await loadStays(resolvedParams);
  return <div className="listing-page"><section className="listing-intro"><p className="section-kicker">HOSPEDAGEM EM CAETANOS</p><SplitHeading as="h1">Seu canto perto do mar.</SplitHeading><Reveal><p>Chalés em Caetanos e casa de praia em Amontada para você aproveitar o litoral no seu ritmo.</p>{notice && <p className="availability-notice" role="status">{notice}</p>}</Reveal></section>{stays.length ? <div className="listing-grid">{stays.map((stay) => <Reveal key={stay.slug} className="listing-card"><Link className="listing-image" href={`/acomodacoes/${stay.slug}`}><ImagePlaceholder src={getAccommodationImage(stay.slug, stay.images)} alt={stay.name} /><span className="stay-open"><ArrowUpRight size={19} /></span></Link><div className="listing-info"><div><p className="section-kicker">{stay.max_guests} HÓSPEDES · {stay.bedrooms} QUARTO{stay.bedrooms > 1 ? "S" : ""} · {stay.bathrooms} BANHEIRO{stay.bathrooms > 1 ? "S" : ""}</p><h2><Link href={`/acomodacoes/${stay.slug}`}>{stay.name}</Link></h2><p>{stay.short_description}</p></div><div className="listing-bottom"><strong>{formatPrice(stay.base_price)} <small>/ noite</small></strong><Link href={`/acomodacoes/${stay.slug}`} className="text-link">Conhecer <ArrowUpRight size={16} /></Link></div></div></Reveal>)}</div> : <p className="no-results">Nenhuma acomodação disponível nessas datas. Experimente outros dias ou fale com a gente pelo WhatsApp.</p>}</div>;
}
