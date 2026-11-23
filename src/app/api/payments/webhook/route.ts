import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const parts = Object.fromEntries((signature || "").split(",").map((part) => part.trim().split("=") as [string, string]));
  const ts = parts.ts;
  const received = parts.v1;
  if (!paymentId || !ts || !received || !requestId) return NextResponse.json({ error: "Assinatura ou identificadores ausentes." }, { status: 400 });
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const supabase = getSupabaseAdmin();
  if (!token || !supabase) return NextResponse.json({ error: "Integração de pagamento não configurada." }, { status: 503 });
  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
  });
  if (!paymentResponse.ok) {
    console.error("Mercado Pago recusou consulta de pagamento:", paymentResponse.status);
    return NextResponse.json({ error: "Não foi possível verificar o pagamento." }, { status: 502 });
  }
  const payment = await paymentResponse.json() as { external_reference?: string; status?: string };
  if (!payment.external_reference) return NextResponse.json({ error: "Pagamento sem referência de reserva." }, { status: 400 });
  const status = payment.status === "approved" ? "confirmed" : payment.status === "rejected" || payment.status === "cancelled" ? "cancelled" : "pending";
  const { error } = await supabase.from("bookings").update({ status, payment_id: paymentId }).eq("id", payment.external_reference);
  if (error) {
    console.error("Não foi possível atualizar reserva via webhook:", error.message);
    return NextResponse.json({ error: "Não foi possível atualizar a reserva." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
