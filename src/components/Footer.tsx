import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer() {
  return <footer className="site-footer"><div className="footer-main"><div><Link href="/" className="brand"><span className="brand-mark">P</span><span>CASA PÉ N’AREIA<small>CAETANOS · CEARÁ</small></span></Link><p>O mar por perto.<br />O tempo no seu ritmo.</p></div><div><h3>Fale com a gente</h3><a href={whatsappLink("Olá! Gostaria de falar sobre uma reserva na Casa Pé n'Areia.")} target="_blank" rel="noreferrer">(85) 99964-7588</a><a href="mailto:falecom@casapenareia.com">falecom@casapenareia.com</a></div><div><h3>Informações</h3><Link href="/politica-de-privacidade">Privacidade</Link><Link href="/termos-de-reserva">Termos de reserva</Link><Link href="/politica-de-cancelamento">Cancelamento</Link></div></div><div className="footer-bottom"><span>© 2026 Casa Pé n’Areia</span><span>Caetanos · Amontada · Ceará</span></div></footer>;
}
