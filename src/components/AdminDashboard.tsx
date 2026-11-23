"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Props = {
  stays: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  content: Record<string, unknown>[];
  blockedDates: Record<string, unknown>[];
  email: string;
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return createBrowserClient(url, key);
}

export function AdminDashboard({ stays, bookings, content, blockedDates, email }: Props) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveContent(form: FormData) {
    const section = String(form.get("section"));
    const contentKey = String(form.get("key"));
    const text = String(form.get("text") || "");
    const imageUrl = String(form.get("image_url") || "").trim();
    const { error } = await getClient().from("home_content").upsert(
      { section, key: contentKey, value: { text, ...(imageUrl ? { image_url: imageUrl } : {}) }, updated_at: new Date().toISOString() },
      { onConflict: "section,key" }
    );
    if (error) throw new Error(error.message);
  }

  async function uploadContentImage(form: FormData) {
    const file = form.get("file");
    const section = String(form.get("section"));
    const contentKey = String(form.get("key"));
    const text = String(form.get("text") || "");
    if (!(file instanceof File) || !file.size) throw new Error("Escolha uma imagem antes de enviar.");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Envie uma imagem JPEG, PNG, WebP ou AVIF.");
    if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.");
    const path = `${section}/${contentKey}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const client = getClient();
    const { error: uploadError } = await client.storage.from("home-assets").upload(path, file, { upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = client.storage.from("home-assets").getPublicUrl(path);
    const { error } = await client.from("home_content").upsert(
      { section, key: contentKey, value: { text, image_url: data.publicUrl }, updated_at: new Date().toISOString() },
      { onConflict: "section,key" }
    );
    if (error) throw new Error(error.message);
  }

  async function saveStay(form: FormData) {
    const id = String(form.get("id") || "");
    const payload = {
      slug: String(form.get("slug")).trim(),
      name: String(form.get("name")).trim(),
      short_description: String(form.get("short_description")).trim(),
      description: String(form.get("description")).trim(),
      max_guests: Number(form.get("max_guests")),
      bedrooms: Number(form.get("bedrooms")),
      bathrooms: Number(form.get("bathrooms")),
      base_price: Number(form.get("base_price")),
      amenities: String(form.get("amenities")).split(",").map((item) => item.trim()).filter(Boolean),
      images: String(form.get("images")).split(",").map((item) => item.trim()).filter(Boolean),
      active: String(form.get("active")) === "true"
    };
    if (!payload.slug || !payload.name || !Number.isInteger(payload.max_guests) || payload.max_guests < 1 ||
        !Number.isInteger(payload.bedrooms) || !Number.isInteger(payload.bathrooms) || !Number.isFinite(payload.base_price) || payload.base_price < 0) {
      throw new Error("Confira slug, nome, capacidade, quartos, banheiros e preço.");
    }
    const query = getClient().from("accommodations");
    const { error } = id ? await query.update(payload).eq("id", id) : await query.insert(payload);
    if (error) throw new Error(error.message);
  }

  async function deleteStay(form: FormData) {
    if (!window.confirm("Excluir esta acomodação? Reservas relacionadas podem impedir a exclusão.")) return;
    const { error } = await getClient().from("accommodations").delete().eq("id", String(form.get("id")));
    if (error) throw new Error(error.message);
  }

  async function addBlockedDate(form: FormData) {
    const { error } = await getClient().from("blocked_dates").insert({
      accommodation_id: String(form.get("accommodation_id")),
      date: String(form.get("date")),
      reason: String(form.get("reason") || "")
    });
    if (error) throw new Error(error.message);
  }

  async function removeBlockedDate(form: FormData) {
    const { error } = await getClient().from("blocked_dates").delete().eq("id", String(form.get("id")));
    if (error) throw new Error(error.message);
  }

  async function perform(action: (form: FormData) => Promise<void>, form: FormData) {
    setBusy(true);
    setNotice("");
    try {
      await action(form);
      setNotice("Alterações salvas.");
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await getClient().auth.signOut();
    window.location.assign("/admin/login");
  }

  const formAction = (action: (form: FormData) => Promise<void>) =>
    (form: FormData) => perform(action, form);

  return <section className="admin-page">
    <div className="admin-heading"><div><p className="section-kicker">PAINEL CASA PÉ N’AREIA</p><h1>Bem-vindo à administração.</h1><p>{email}</p></div><button className="button button-ghost" onClick={logout}>Sair</button></div>
    {notice && <p role="status" className="form-message">{notice}</p>}

    <div className="admin-section"><h2>Acomodações</h2>
      {stays.map((stay) => <form key={String(stay.id)} className="admin-stay-form" action={formAction(saveStay)}>
        <input type="hidden" name="id" value={String(stay.id)} />
        <label>Nome<input name="name" defaultValue={String(stay.name)} required /></label>
        <label>Slug<input name="slug" defaultValue={String(stay.slug)} required /></label>
        <label>Resumo<input name="short_description" defaultValue={String(stay.short_description)} /></label>
        <label>Descrição<textarea name="description" defaultValue={String(stay.description)} /></label>
        <div className="admin-fields">
          <label>Hóspedes<input name="max_guests" type="number" min="1" defaultValue={String(stay.max_guests)} required /></label>
          <label>Quartos<input name="bedrooms" type="number" min="0" defaultValue={String(stay.bedrooms)} required /></label>
          <label>Banheiros<input name="bathrooms" type="number" min="0" defaultValue={String(stay.bathrooms)} required /></label>
          <label>Preço por noite<input name="base_price" type="number" min="0" step="0.01" defaultValue={String(stay.base_price)} required /></label>
          <label>Ativa<select name="active" defaultValue={String(stay.active)}><option value="true">Sim</option><option value="false">Não</option></select></label>
        </div>
        <label>Comodidades (separadas por vírgula)<input name="amenities" defaultValue={Array.isArray(stay.amenities) ? stay.amenities.join(", ") : ""} /></label>
        <label>URLs das imagens (separadas por vírgula)<input name="images" defaultValue={Array.isArray(stay.images) ? stay.images.join(", ") : ""} /></label>
        <div className="admin-actions"><button className="button button-small" disabled={busy}>Salvar acomodação</button><button formAction={formAction(deleteStay)} className="admin-delete" disabled={busy}>Excluir</button></div>
      </form>)}
      <details className="admin-create"><summary>Adicionar acomodação</summary><form className="admin-stay-form" action={formAction(saveStay)}>
        <label>Nome<input name="name" required /></label><label>Slug<input name="slug" required /></label><label>Resumo<input name="short_description" /></label><label>Descrição<textarea name="description" /></label>
        <div className="admin-fields"><label>Hóspedes<input name="max_guests" type="number" min="1" defaultValue="2" required /></label><label>Quartos<input name="bedrooms" type="number" min="0" defaultValue="1" required /></label><label>Banheiros<input name="bathrooms" type="number" min="0" defaultValue="1" required /></label><label>Preço por noite<input name="base_price" type="number" min="0" step="0.01" required /></label><label>Ativa<select name="active" defaultValue="true"><option value="true">Sim</option><option value="false">Não</option></select></label></div>
        <label>Comodidades<input name="amenities" /></label><label>URLs das imagens<input name="images" /></label><button className="button button-small" disabled={busy}>Criar acomodação</button>
      </form></details>
    </div>

    <div className="admin-section"><h2>Conteúdo e imagens da home</h2>
      {content.map((item) => {
        const value = item.value as { text?: string; image_url?: string };
        return <div key={`${item.section}-${item.key}`} className="admin-content-row">
          <form className="admin-content-form" action={formAction(saveContent)}>
            <input type="hidden" name="section" value={String(item.section)} /><input type="hidden" name="key" value={String(item.key)} />
            <label>{String(item.section)} · {String(item.key)}<textarea name="text" defaultValue={value?.text || ""} /></label>
            <label>URL da imagem<input name="image_url" defaultValue={value?.image_url || ""} /></label><button className="button button-small" disabled={busy}>Salvar conteúdo</button>
          </form>
          <form className="admin-upload-form" action={formAction(uploadContentImage)}>
            <input type="hidden" name="section" value={String(item.section)} /><input type="hidden" name="key" value={String(item.key)} />
            <input type="hidden" name="text" value={value?.text || ""} />
            <label>Enviar imagem ao Storage<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></label><button className="button button-small" disabled={busy}>Enviar imagem</button>
          </form>
        </div>;
      })}
      {!content.length && <p>Execute o seed de conteúdo no schema para habilitar a edição de textos e imagens da home.</p>}
    </div>

    <div className="admin-section"><h2>Bloquear datas</h2>
      <form className="admin-block-form" action={formAction(addBlockedDate)}>
        <label>Acomodação<select name="accommodation_id" required>{stays.map((stay) => <option key={String(stay.id)} value={String(stay.id)}>{String(stay.name)}</option>)}</select></label>
        <label>Data<input name="date" type="date" required /></label><label>Motivo<input name="reason" /></label><button className="button button-small" disabled={busy}>Bloquear data</button>
      </form>
      {blockedDates.map((item) => <form key={String(item.id)} className="admin-row" action={formAction(removeBlockedDate)}><input type="hidden" name="id" value={String(item.id)} /><strong>{String((item.accommodations as { name?: string })?.name || "Acomodação")}</strong><span>{String(item.date)}</span><span>{String(item.reason || "")}</span><button className="admin-delete" disabled={busy}>Remover bloqueio</button></form>)}
    </div>

    <div className="admin-section"><h2>Reservas recentes</h2>{bookings.length ? <div className="admin-table"><div className="admin-table-head"><span>Hóspede</span><span>Acomodação</span><span>Datas</span><span>Status</span></div>{bookings.map((item) => <div className="admin-table-row" key={String(item.id)}><span>{String(item.guest_name)}<small>{String(item.guest_email)}</small></span><span>{String((item.accommodations as { name?: string })?.name || "—")}</span><span>{String(item.check_in)} → {String(item.check_out)}</span><span>{String(item.status)}</span></div>)}</div> : <p>Nenhuma reserva registrada.</p>}</div>
  </section>;
}
