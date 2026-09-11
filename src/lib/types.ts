export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  publisher: string | null;
  isbn: string | null;
  description: string | null;
  category_id: string | null;
  price: number;
  discount_percent: number;
  stock: number;
  cover_url: string | null;
  cover_color: string;
  rating: number;
  rating_count: number;
  sold_count: number;
  language: string | null;
  pages: number | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  created_at: string;
  categories?: { name: string; slug: string } | null;
};

export type CartLine = {
  book_id: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  discount_percent: number;
  cover_color: string;
  cover_url: string | null;
  stock: number;
  quantity: number;
};

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "ready_or_shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_or_shipped: "Ready for Pickup / Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
