export function whatsappLink(message: string) {
  const number = process.env.WHATSAPP_NUMBER || "5585999647588";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
