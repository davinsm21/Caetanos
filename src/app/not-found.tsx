import Link from "next/link";

export default function NotFound() {
  return <section className="not-found"><span className="not-found-sun" aria-hidden="true" /><p className="section-kicker">VOCÊ SAIU DA ROTA</p><h1>Até o sol se esconde no mar.</h1><p>Não encontramos essa página. Mas o caminho de volta continua por aqui.</p><Link className="button" href="/">Voltar para o início</Link></section>;
}
