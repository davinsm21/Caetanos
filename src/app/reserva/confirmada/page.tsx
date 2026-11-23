import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retorno da reserva",
  description: "Informações sobre o retorno do pagamento da sua reserva na Casa Pé n’Areia.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/reserva/confirmada" }
};

export default function BookingReturnPage() {
  return <section className="booking-return"><p className="section-kicker">RETORNO DO PAGAMENTO</p><h1>Obrigado por escolher Caetanos.</h1><p>Recebemos o retorno do checkout. A confirmação da reserva depende da validação do pagamento; se precisar, nossa equipe falará com você pelos dados informados.</p><Link className="button" href="/">Voltar ao início</Link></section>;
}
