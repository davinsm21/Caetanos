"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = { quote: string; guest_name: string; origin?: string };

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  return <div className="testimonial-card"><p className="quote">“{item.quote}”</p><p className="guest">{item.guest_name}{item.origin ? ` · ${item.origin}` : ""}</p><div className="carousel-controls"><button onClick={() => setIndex((index + items.length - 1) % items.length)} aria-label="Depoimento anterior"><ChevronLeft /></button><span>{index + 1} / {items.length}</span><button onClick={() => setIndex((index + 1) % items.length)} aria-label="Próximo depoimento"><ChevronRight /></button></div></div>;
}
