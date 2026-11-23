export type Accommodation = {
  id?: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  base_price: number;
  amenities: string[];
  images: string[];
};

export const accommodations: Accommodation[] = [
  {
    slug: "casa-penareia",
    name: "Casa Penareia",
    short_description: "A casa completa para reunir quem você ama, pertinho do mar.",
    description:
      "Casa com 3 quartos com ar-condicionado (2 suítes), sala ampla com sofá-cama e espaço para rede, cozinha completa e alpendre com mesa para 12 lugares. A aproximadamente 20 m da praia.",
    max_guests: 12,
    bedrooms: 3,
    bathrooms: 3,
    base_price: 700,
    amenities: ["3 quartos", "2 suítes", "Ar-condicionado", "Cozinha completa", "Alpendre", "Espaço para redes"],
    images: ["/images/casa-penareia.jpg"]
  },
  {
    slug: "chale-plus",
    name: "Chalé Plus",
    short_description: "A opção mais ampla e completa dos chalés.",
    description: "Um chalé confortável para aproveitar Caetanos com mais espaço e tranquilidade.",
    max_guests: 5,
    bedrooms: 1,
    bathrooms: 1,
    base_price: 230,
    amenities: ["Varanda privativa", "Rede", "Vista para o mar", "Cozinha equipada"],
    images: ["/images/chale-plus.jpg"]
  },
  {
    slug: "chale-single",
    name: "Chalé Single",
    short_description: "Uma estadia acolhedora para casal ou pequena família.",
    description: "Ideal para até quatro pessoas, com varanda exclusiva, mesa, redes e vista para o mar.",
    max_guests: 4,
    bedrooms: 1,
    bathrooms: 1,
    base_price: 190,
    amenities: ["Varanda privativa", "Rede", "Vista para o mar", "Ar-condicionado"],
    images: ["/images/chale-single.jpg"]
  }
];

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

export function getAccommodationImage(slug: string, images?: string[]) {
  return images?.[0] || accommodations.find((stay) => stay.slug === slug)?.images[0];
}
