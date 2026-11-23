import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MercadoPagoProvider } from "@/lib/payments";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Reservas online ainda não estão configuradas. Fale com a gente pelo WhatsApp." }, { status: 503 });
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Dados de reserva inválidos." }, { status: 400 }); }
  const { accommodationSlug, checkIn, checkOut, guestName, guestEmail, guestPhone } = input;
  const guests = Number(input.guests);
  if (typeof accommodationSlug !== "string" || typeof checkIn !== "string" || typeof checkOut !== "string" ||
      typeof guestName !== "string" || typeof guestEmail !== "string" || typeof guestPhone !== "string" ||
      !Number.isInteger(guests) || guests < 1 || !guestName.trim() || guestName.length > 200 ||
      guestEmail.length > 320 || guestPhone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return NextResponse.json({ error: "Preencha os dados da reserva corretamente." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    return NextResponse.json({ error: "Selecione datas válidas para sua estadia." }, { status: 400 });
  }
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start < new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) {
    return NextResponse.json({ error: "Selecione datas futuras e válidas para sua estadia." }, { status: 400 });
  }
  const { data: stay, error: stayError } = await supabase.from("accommodations").select("id, name, max_guests, base_price").eq("slug", accommodationSlug).eq("active", true).maybeSingle();
  if (stayError) {
    console.error("Erro ao consultar acomodação:", stayError.message);
    return NextResponse.json({ error: "Não foi possível consultar a acomodação." }, { status: 500 });
  }
  if (!stay) return NextResponse.json({ error: "Acomodação indisponível." }, { status: 404 });
  if (guests > stay.max_guests) return NextResponse.json({ error: `Esta acomodação recebe até ${stay.max_guests} hóspedes.` }, { status: 400 });

  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const { data: bookingId, error: bookingError } = await supabase.rpc("create_pending_booking", {
    p_accommodation_id: stay.id,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_guests: guests,
    p_guest_name: guestName.trim(),
    p_guest_email: guestEmail.trim().toLowerCase(),
    p_guest_phone: guestPhone.trim()
  });
  if (bookingError) {
    if (bookingError.message.includes("unavailable")) return NextResponse.json({ error: "Essas datas não estão disponíveis. Escolha outras datas e tente novamente." }, { status: 409 });
    console.error("Erro ao criar reserva:", bookingError.message);
    return NextResponse.json({ error: "Não foi possível criar a reserva." }, { status: 500 });
  }
  if (typeof bookingId !== "string") return NextResponse.json({ error: "Não foi possível confirmar os dados da reserva." }, { status: 500 });
  const { data: booking, error: totalError } = await supabase.from("bookings").select("total_price").eq("id", bookingId).single();
  if (totalError || !booking) {
    console.error("Não foi possível confirmar o total da reserva:", totalError?.message);
    return NextResponse.json({ error: "Não foi possível confirmar o valor da reserva." }, { status: 500 });
  }
  try {
    const checkout = await new MercadoPagoProvider().createCheckout({
      bookingId, amount: Number(booking.total_price), description: `${stay.name} · ${nights} ${nights === 1 ? "noite" : "noites"}`,
      payer: { name: guestName.trim(), email: guestEmail.trim().toLowerCase() }
    });
    const { error: updateError } = await supabase.from("bookings").update({ payment_id: checkout.paymentId }).eq("id", bookingId);
    if (updateError) throw new Error(`Não foi possível vincular o pagamento: ${updateError.message}`);
    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    const { error: cancelError } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (cancelError) console.error("Não foi possível cancelar reserva sem checkout:", cancelError.message);
    console.error("Erro ao iniciar checkout:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento." }, { status: 502 });
  }
}
