import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Wind, Wifi, Waves, House, Utensils, Users, ShieldCheck, CreditCard, MessageCircle } from "lucide-react";
import { SplitHeading } from "@/components/SplitHeading";
import { Reveal } from "@/components/Reveal";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { AvailabilitySearch } from "@/components/AvailabilitySearch";
import { Gallery } from "@/components/Gallery";
import { Testimonials } from "@/components/Testimonials";
import { accommodations, formatPrice, getAccommodationImage } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";
import { whatsappLink } from "@/lib/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "https://www.casapenareia.com/" }
};

const differences = [
  { icon: Waves, title: "A poucos passos da praia", text: "Aproximadamente 25 metros entre você e o mar." },
  { icon: House, title: "Chalés e casa completa", text: "Escolha a estadia que combina com a sua viagem." },
  { icon: Wifi, title: "Conforto essencial", text: "Wi-Fi, TV e ar-condicionado para descansar bem." },
  { icon: Utensils, title: "Cozinha equipada", text: "Liberdade para preparar refeições no seu tempo." },
  { icon: Wind, title: "Vista para o mar", text: "Varandas, redes e a brisa de Caetanos por perto." },
  { icon: Users, title: "Para diferentes viagens", text: "Um cantinho para casais, famílias e grupos." }
];
const experiences = [
  { title: "Praia de Caetanos", eyebrow: "O mar logo ali", image: "/images/galeria-praia.jpg" },
  { title: "Lençóis Cearenses", eyebrow: "Dunas e piscinas naturais", image: "/images/galeria-passeios.jpg" },
  { title: "Buggy e quadriciclo", eyebrow: "Aventura pela região", image: "/images/experiencia-quadriciclo.jpg" },
  { title: "Rota do downwind", eyebrow: "Uma parada para kitesurfistas", image: "/images/publico-kitesurfistas.jpg" }
];
const audiences = [
  { title: "Casais", image: "/images/publico-casais.jpg" },
  { title: "Famílias", image: "/images/publico-familias.jpg" },
  { title: "Grupos de amigos", image: "/images/publico-amigos.jpg" },
  { title: "Turmas grandes", image: "/images/publico-grupos.jpg" },
  { title: "Kitesurfistas", image: "/images/publico-kitesurfistas.jpg" },
  { title: "Exploradores da região", image: "/images/publico-exploradores.jpg" }
];

type Testimonial = { quote: string; guest_name: string; origin?: string };
type HomeCopy = { section: string; key: string; value: { text?: string; image_url?: string } };

async function getHomeContent() {
  const supabase = getSupabase();
  if (!supabase) return { testimonials: [] as Testimonial[], copy: [] as HomeCopy[], stays: accommodations };
  const [testimonialResult, copyResult, stayResult] = await Promise.all([
    supabase.from("testimonials").select("quote, guest_name, origin").eq("active", true).order("created_at", { ascending: false }),
    supabase.from("home_content").select("section, key, value"),
    supabase.from("accommodations").select("id, slug, name, short_description, description, max_guests, bedrooms, bathrooms, base_price, amenities, images").eq("active", true).order("base_price")
  ]);
  if (testimonialResult.error) console.error("Não foi possível carregar depoimentos:", testimonialResult.error.message);
  if (copyResult.error) console.error("Não foi possível carregar conteúdo da home:", copyResult.error.message);
  if (stayResult.error) console.error("Não foi possível carregar acomodações da home:", stayResult.error.message);
  return {
    testimonials: (testimonialResult.data || []) as Testimonial[],
    copy: (copyResult.data || []) as HomeCopy[],
    stays: stayResult.error ? accommodations : stayResult.data || []
  };
}

function copyText(copy: HomeCopy[], key: string, fallback: string) {
  const item = copy.find((entry) => entry.key === key);
  return typeof item?.value?.text === "string" ? item.value.text : fallback;
}

function copyImage(copy: HomeCopy[], key: string) {
  const item = copy.find((entry) => entry.key === key);
  return typeof item?.value?.image_url === "string" && item.value.image_url ? item.value.image_url : undefined;
}

export default async function HomePage() {
  const { testimonials, copy, stays } = await getHomeContent();
  const heroTitle = copyText(copy, "title", "Chalés e casa de praia a poucos passos do mar");
  const heroSubtitle = copyText(copy, "subtitle", "A brisa do litoral, o tempo mais leve e o mar por perto.");
  const experienceTitle = copyText(copy, "experience_title", "Viva Caetanos de pertinho.");
  const experienceText = copyText(copy, "experience_text", "Uma vila de pescadores onde o vento sopra manso, os dias pedem calma e o mar sempre encontra um jeito de fazer parte dos planos. Daqui, você também fica perto de Icaraizinho de Amontada e Moitas.");
  const searchTitle = copyText(copy, "availability_title", "Encontre seus dias de mar.");
  const differencesTitle = copyText(copy, "differences_title", "Um lugar para respirar.");
  const staysTitle = copyText(copy, "stays_title", "Estadias com o mar por perto.");
  const chaletsTitle = copyText(copy, "chalets_title", "Varanda, rede e horizonte.");
  const chaletsText = copyText(copy, "chalets_text", "Nos chalés, uma varanda exclusiva com mesa, redes e vista para o mar faz parte dos dias sem pressa.");
  const regionTitle = copyText(copy, "region_title", "Deixe o vento escolher o caminho.");
  const regionText = copyText(copy, "region_text", "Praia, aventura e paisagens que fazem parte de uma estadia em Caetanos.");
  const galleryTitle = copyText(copy, "gallery_title", "Entre marés e momentos.");
  const galleryText = copyText(copy, "gallery_text", "Conheça a casa, a praia de Caetanos e as paisagens dos arredores.");
  const audienceTitle = copyText(copy, "audience_title", "Seu tempo. Sua companhia.");
  const audienceText = copyText(copy, "audience_text", "Uma casa de temporada em Amontada para diferentes formas de viver o litoral.");
  const testimonialsTitle = copyText(copy, "testimonials_title", "O mar também fica na memória.");
  const bookingTitle = copyText(copy, "booking_title", "Pronto para viver Caetanos de perto?");
  const heroImage = copyImage(copy, "background") || "/images/hero-caetanos.jpg";
  const galleryImages = [
    "/images/galeria-praia.jpg",
    "/images/galeria-acomodacoes.jpg",
    "/images/galeria-convivencia.jpg",
    "/images/galeria-passeios.jpg",
    "/images/galeria-gastronomia.jpg"
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LodgingBusiness", name: "Casa Pé n’Areia",
        description: "Casa de praia e chalés em Caetanos, Amontada, Ceará.",
        address: { "@type": "PostalAddress", addressLocality: "Amontada", addressRegion: "CE", addressCountry: "BR" },
        telephone: "+55 85 99964-7588", email: "falecom@casapenareia.com",
        url: "https://www.casapenareia.com"
      },
      ...stays.map((room) => ({
        "@type": "VacationRental", name: room.name, description: room.short_description,
        url: `https://www.casapenareia.com/acomodacoes/${room.slug}`,
        occupancy: { "@type": "QuantitativeValue", value: room.max_guests },
        address: { "@type": "PostalAddress", addressLocality: "Amontada", addressRegion: "CE", addressCountry: "BR" }
      }))
    ]
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-backdrop" aria-hidden="true">{heroImage && <ImagePlaceholder src={heroImage} alt="" priority className="hero-actual-image" />}<div className="hero-sky" /><div className="hero-water" /><div className="hero-horizon" /></div>
      <div className="hero-copy">
        <Reveal><p className="eyebrow"><span /> CAETANOS · AMONTADA · CEARÁ</p></Reveal>
        <SplitHeading as="h1" id="hero-title" className="hero-title">{heroTitle}</SplitHeading>
        <Reveal><p className="hero-subtitle">{heroSubtitle}</p></Reveal>
        <Reveal><div className="hero-actions"><Link href="/acomodacoes" className="button">Ver disponibilidade <ArrowUpRight size={17} /></Link><a className="button button-ghost" href={whatsappLink("Olá! Gostaria de consultar disponibilidade na Casa Pé n'Areia.")} target="_blank" rel="noreferrer">Falar no WhatsApp <ArrowUpRight size={16} /></a></div></Reveal>
      </div>
      <div className="hero-caption"><span className="distance-seal"><span>25m</span> aproximadamente<br />da praia</span><a href="#disponibilidade" className="scroll-cue">DESLIZE PARA EXPLORAR <ArrowDown size={14} /></a></div>
    </section>

    <section className="availability section-wrap" id="disponibilidade"><Reveal><div className="section-kicker">SUA ESTADIA COMEÇA AQUI</div><h2 className="search-title">{searchTitle}</h2><AvailabilitySearch /></Reveal></section>

    <section className="section-wrap differences-section"><div className="section-heading"><div><p className="section-kicker">O ESSENCIAL, COM CALMA</p><SplitHeading>{differencesTitle}</SplitHeading></div><Reveal><p>O aconchego de uma hospedagem em Caetanos, pertinho da praia e do ritmo tranquilo da vila.</p></Reveal></div>
      <div className="difference-grid">{differences.map(({ icon: Icon, title, text }, i) => <Reveal key={title} className="difference-card"><span className="difference-number">0{i + 1}</span><Icon size={22} strokeWidth={1.4} /><h3>{title}</h3><p>{text}</p></Reveal>)}</div>
    </section>

    <section className="experience-section" id="experiencia"><div className="experience-image"><ImagePlaceholder src={copyImage(copy, "experience_image") || "/images/galeria-praia.jpg"} alt="Vista aérea da praia de Caetanos" /></div><div className="experience-copy"><p className="section-kicker">UM OUTRO RITMO DE LITORAL</p><SplitHeading>{experienceTitle}</SplitHeading><Reveal><p>{experienceText}</p><a className="text-link" href={whatsappLink("Olá! Quero consultar minhas datas na Casa Pé n'Areia.")} target="_blank" rel="noreferrer">Quero consultar minha data <ArrowRight size={17} /></a></Reveal></div></section>

    <section className="section-wrap stays-section" id="acomodacoes"><div className="section-heading"><div><p className="section-kicker">ENCONTRE SEU CANTINHO</p><SplitHeading>{staysTitle}</SplitHeading></div><Reveal><Link className="text-link" href="/acomodacoes">Ver todas as acomodações <ArrowRight size={17} /></Link></Reveal></div>
      <div className="stay-grid">{stays.map((stay, index) => <Reveal key={stay.slug} className={`stay-card stay-card-${index + 1}`}><Link href={`/acomodacoes/${stay.slug}`} className="stay-image"><ImagePlaceholder src={getAccommodationImage(stay.slug, stay.images)} alt={stay.name} /><span className="image-index">0{index + 1} / 03</span><span className="stay-open"><ArrowUpRight size={19} /></span></Link><div className="stay-info"><div><p className="section-kicker">{stay.max_guests} HÓSPEDES · {stay.bedrooms} {stay.bedrooms === 1 ? "QUARTO" : "QUARTOS"}</p><h3><Link href={`/acomodacoes/${stay.slug}`}>{stay.name}</Link></h3><p>{stay.short_description}</p></div><div className="stay-price"><span>A partir de</span><strong>{formatPrice(stay.base_price)}<small> / noite</small></strong></div></div></Reveal>)}</div>
    </section>

    <section className="chalets-band"><ImagePlaceholder src={copyImage(copy, "chalets_image") || "/images/chale-plus.jpg"} alt="Área externa de um chalé em Caetanos" /><div className="chalets-band-copy"><p className="section-kicker">UM CONVITE A DESACELERAR</p><SplitHeading>{chaletsTitle}</SplitHeading><Reveal><p>{chaletsText}</p><Link className="text-link" href="/acomodacoes/chale-plus">Descubra os chalés <ArrowRight size={17} /></Link></Reveal></div></section>

    <section className="section-wrap region-section"><div className="section-heading"><div><p className="section-kicker">O CEARÁ LÁ FORA</p><SplitHeading>{regionTitle}</SplitHeading></div><Reveal><p>{regionText}</p></Reveal></div><div className="region-grid">{experiences.map((item, index) => <Reveal key={item.title} className="region-card"><ImagePlaceholder src={copyImage(copy, `region_${index + 1}`) || item.image} alt={item.title} /><div className="region-overlay"><span>0{index + 1} · {item.eyebrow}</span><h3>{item.title}</h3></div></Reveal>)}</div></section>

    <section className="section-wrap gallery-section" id="galeria"><div className="section-heading"><div><p className="section-kicker">UM POUCO DO QUE ESPERA POR VOCÊ</p><SplitHeading>{galleryTitle}</SplitHeading></div><Reveal><p>{galleryText}</p></Reveal></div><Gallery images={galleryImages.map((image, index) => copyImage(copy, `gallery_${index + 1}`) || image)} /></section>

    <section className="audience-section"><div className="audience-copy"><p className="section-kicker">DO SEU JEITO</p><SplitHeading>{audienceTitle}</SplitHeading><Reveal><p>{audienceText}</p></Reveal></div><div className="audience-grid">{audiences.map((item, index) => <Reveal key={item.title} className="audience-card"><ImagePlaceholder src={item.image} alt={`Foto de ${item.title.toLowerCase()} em Caetanos`} /><div className="audience-card-label"><span>0{index + 1}</span><h3>{item.title}</h3><ArrowUpRight size={16} /></div></Reveal>)}</div></section>

    <section className="testimonials-section section-wrap"><div><p className="section-kicker">HISTÓRIAS DE QUEM PASSOU POR AQUI</p><SplitHeading>{testimonialsTitle}</SplitHeading></div><Testimonials items={testimonials} /></section>

    <section className="booking-cta"><div className="booking-cta-inner"><p className="section-kicker">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</p><SplitHeading>{bookingTitle}</SplitHeading><Reveal><div className="trust-row"><span><ShieldCheck /> Reserva segura</span><span><CreditCard /> Pagamento online protegido</span><span><MessageCircle /> Atendimento pelo WhatsApp</span></div><div className="hero-actions"><Link href="/acomodacoes" className="button">Consultar disponibilidade <ArrowUpRight size={17} /></Link><a href={whatsappLink("Olá! Gostaria de falar sobre uma reserva na Casa Pé n'Areia.")} className="button button-ghost" target="_blank" rel="noreferrer">Falar com a gente</a></div></Reveal></div></section>
  </>;
}
