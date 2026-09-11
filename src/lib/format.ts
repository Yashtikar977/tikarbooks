export const STORE = {
  name: "Tikar Books Emporium",
  city: "Buldhana",
  address: "Main Road, Buldhana, Maharashtra 443001, India",
  phone: "+91 90000 00000",
  whatsapp: "919000000000",
  email: "hello@tikarbooks.in",
  hours: [
    { days: "Monday – Saturday", time: "9:30 AM – 9:00 PM" },
    { days: "Sunday", time: "10:00 AM – 2:00 PM" },
  ],
};

export function inr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function finalPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - (discountPercent || 0) / 100));
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
}
