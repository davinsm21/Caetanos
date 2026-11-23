"use client";

import { useState } from "react";

export function BookingForm({ slug, maxGuests }: { slug: string; maxGuests: number }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível iniciar a reserva.");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar a reserva.");
    } finally { setBusy(false); }
  }
  return <form className="booking-form" onSubmit={submit}>
    <input type="hidden" name="accommodationSlug" value={slug} />
    <label>Check-in<input name="checkIn" type="date" required /></label><label>Check-out<input name="checkOut" type="date" required /></label>
    <label>Hóspedes<select name="guests" required>{Array.from({ length: maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
    <label>Seu nome<input name="guestName" autoComplete="name" required /></label><label>E-mail<input name="guestEmail" type="email" autoComplete="email" required /></label><label>Telefone<input name="guestPhone" type="tel" autoComplete="tel" required /></label>
    <button className="button" disabled={busy}>{busy ? "Preparando reserva…" : "Continuar para pagamento"}</button>
    {message && <p className="form-message" role="alert">{message}</p>}
  </form>;
}
