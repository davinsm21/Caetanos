import type { MetadataRoute } from "next";
import { accommodations } from "@/lib/data";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.casapenareia.com";
  const staticPages = ["", "/acomodacoes", "/politica-de-privacidade", "/termos-de-reserva", "/politica-de-cancelamento"];
  return [
    ...staticPages.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: path ? 0.7 : 1 })),
    ...accommodations.map((stay) => ({ url: `${base}/acomodacoes/${stay.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 }))
  ];
}
