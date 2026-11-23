import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, BedDouble, Bath, Check } from "lucide-react";
import { accommodations, formatPrice, getAccommodationImage } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { SplitHeading } from "@/components/SplitHeading";
import { Reveal } from "@/components/Reveal";
import { BookingForm } from "@/components/BookingForm";

async function findStay(slug: string) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("accommodations").select("*").eq("slug", slug).eq("active", true).maybeSingle();
    if (error) {
      console.error("Não foi possível carregar a acomodação:", error.message);
      return accommodations.find((item) => item.slug === slug);
    }
    return data || undefined;
  }
  return accommodations.find((item) => item.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stay = await findStay(slug);
  if (!stay) return { title: "Acomodação não encontrada" };
  return {
    title: stay.name,
    description: `${stay.short_description} Hospedagem em Caetanos, Amontada, Ceará.`,
    alternates: { canonical: `/acomodacoes/${stay.slug}` },
    openGraph: { title: `${stay.name} | Casa Pé n’Areia`, description: stay.short_description, url: `/acomodacoes/${stay.slug}` }
  };
}

export default async function AccommodationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stay = await findStay(slug);
  if (!stay) notFound();
  const amenities: string[] = Array.isArray(stay.amenities) ? stay.amenities : [];
  return <div className="detail-page"><Link href="/acomodacoes" className="back-link"><ArrowLeft size={16} /> Todas as acomodações</Link><section className="detail-hero"><ImagePlaceholder src={getAccommodationImage(stay.slug, stay.images)} alt={`Acomodação ${stay.name}`} /><div className="detail-title"><p className="section-kicker">CAETANOS · AMONTADA · CEARÁ</p><SplitHeading as="h1">{stay.name}</SplitHeading><p>{stay.short_description}</p><strong>A partir de {formatPrice(stay.base_price)} <small>/ noite</small></strong></div></section><div className="detail-columns"><article className="detail-description"><div className="detail-facts"><span><Users /> Até {stay.max_guests} hóspedes</span><span><BedDouble /> {stay.bedrooms} {stay.bedrooms === 1 ? "quarto" : "quartos"}</span><span><Bath /> {stay.bathrooms} {stay.bathrooms === 1 ? "banheiro" : "banheiros"}</span></div><h2>Um lugar para chamar de seu.</h2><p>{stay.description}</p><h2>Comodidades</h2><ul className="amenities-list">{amenities.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul><Reveal><p className="detail-note">Aproximadamente 25 metros da praia. Consulte datas e detalhes com a nossa equipe.</p></Reveal></article><aside className="booking-panel" id="reservar"><p className="section-kicker">CONSULTE SUA ESTADIA</p><h2>Vamos planejar seus dias?</h2><BookingForm slug={stay.slug} maxGuests={stay.max_guests} /></aside></div></div>;
}
