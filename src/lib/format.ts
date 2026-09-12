export const STORE = {
  name: "Tikar Books Emporium",
  city: "Buldhana",
  address: "Club Layout, Behind SBI Bank, Buldhana, Maharashtra 443001, India",
  phone: "+91 96894 80032",
  whatsapp: "919689480032",
  email: "hello@tikarbooks.in",
  hours: [{ days: "Monday – Sunday", time: "10:00 AM – 8:00 PM" }],
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
