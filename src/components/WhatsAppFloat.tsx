import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import Link from "next/link";

export function WhatsAppFloat() {
  return <>
    <a className="whatsapp-float" href={whatsappLink("Olá! Gostaria de consultar disponibilidade na Casa Pé n'Areia.")} target="_blank" rel="noreferrer" aria-label="Consultar disponibilidade pelo WhatsApp"><MessageCircle /></a>
    <div className="mobile-booking"><Link href="/acomodacoes">Reservar</Link><a href={whatsappLink("Olá! Quero conversar sobre uma reserva na Casa Pé n'Areia.")} target="_blank" rel="noreferrer">WhatsApp</a></div>
  </>;
}
