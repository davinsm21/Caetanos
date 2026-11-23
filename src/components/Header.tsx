import Link from "next/link";

export function Header() {
  return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">P</span><span>CASA PÉ N’AREIA<small>CAETANOS · CEARÁ</small></span></Link><nav aria-label="Navegação principal"><Link href="/acomodacoes">Acomodações</Link><Link href="/#experiencia">A experiência</Link><Link href="/#galeria">Galeria</Link></nav><Link className="header-cta" href="/acomodacoes">Reservar <span aria-hidden="true">↗</span></Link></header>;
}
