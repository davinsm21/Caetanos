import { MessageCircle } from "lucide-react";
import { TestimonialCarousel } from "./TestimonialCarousel";

export function Testimonials({ items = [] }: { items?: { quote: string; guest_name: string; origin?: string }[] }) {
  if (!items.length) return <div className="testimonial-empty"><MessageCircle size={22} /><p>Em breve, compartilharemos aqui as experiências reais de quem já ficou na Casa Pé n’Areia.</p></div>;
  return <TestimonialCarousel items={items} />;
}
