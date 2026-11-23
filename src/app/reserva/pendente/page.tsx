import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pagamento em processamento",
  description: "O pagamento da reserva ainda está em processamento.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/reserva/pendente" }
};

export default function BookingPendingPage() {
  return <section className="booking-return"><p className="section-kicker">PAGAMENTO EM PROCESSAMENTO</p><h1>Mais um instante.</h1><p>O pagamento ainda não foi confirmado. A disponibilidade pode mudar até a confirmação. Para conferir sua reserva, fale com nossa equipe.</p><Link className="button" href="/">Voltar ao início</Link></section>;
}
