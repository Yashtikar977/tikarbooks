import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { finalPrice } from "@/lib/format";
import type { Book, CartLine } from "@/lib/types";

const CART_KEY = "tbe.cart.v1";
const WISH_KEY = "tbe.wishlist.v1";

type StoreValue = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (book: Book, quantity?: number) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  toggleWishlist: (bookId: string) => void;
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
};

const StoreContext = createContext<StoreValue | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  // Merge local state into the account, then load the account state back.
  useEffect(() => {
    if (!user || !hydrated) return;
    let cancelled = false;
    (async () => {
      const local = read<CartLine[]>(CART_KEY, []);
      const localWish = read<string[]>(WISH_KEY, []);
      if (local.length) {
        await supabase.from("cart_items").upsert(
          local.map((l) => ({ user_id: user.id, book_id: l.book_id, quantity: l.quantity })),
          { onConflict: "user_id,book_id" },
        );
      }
      if (localWish.length) {
        await supabase
          .from("wishlist_items")
          .upsert(
            localWish.map((id) => ({ user_id: user.id, book_id: id })),
            { onConflict: "user_id,book_id" },
          );
      }
      const [{ data: cartRows }, { data: wishRows }] = await Promise.all([
        supabase.from("cart_items").select("quantity, books(*)").eq("user_id", user.id),
        supabase.from("wishlist_items").select("book_id").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      if (cartRows) {
        setCart(
          cartRows
            .filter((r) => r.books)
            .map((r) => {
              const b = r.books as unknown as Book;
              return {
                book_id: b.id,
                slug: b.slug,
                title: b.title,
                author: b.author,
                price: Number(b.price),
                discount_percent: b.discount_percent,
                cover_color: b.cover_color,
                cover_url: b.cover_url,
                stock: b.stock,
                quantity: r.quantity as number,
              };
            }),
        );
      }
      if (wishRows) setWishlist(wishRows.map((r) => r.book_id as string));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, hydrated]);

  const syncCart = useCallback(
    async (bookId: string, quantity: number | null) => {
      if (!user) return;
      if (quantity === null) {
        await supabase.from("cart_items").delete().eq("user_id", user.id).eq("book_id", bookId);
      } else {
        await supabase
          .from("cart_items")
          .upsert({ user_id: user.id, book_id: bookId, quantity }, { onConflict: "user_id,book_id" });
      }
    },
    [user],
  );

  const addToCart = useCallback(
    (book: Book, quantity = 1) => {
      if (book.stock <= 0) {
        toast.error("This book is currently out of stock.");
        return;
      }
      setCart((prev) => {
        const existing = prev.find((l) => l.book_id === book.id);
        const nextQty = Math.min(book.stock, (existing?.quantity ?? 0) + quantity);
        void syncCart(book.id, nextQty);
        if (existing) {
          return prev.map((l) => (l.book_id === book.id ? { ...l, quantity: nextQty } : l));
        }
        return [
          ...prev,
          {
            book_id: book.id,
            slug: book.slug,
            title: book.title,
            author: book.author,
            price: Number(book.price),
            discount_percent: book.discount_percent,
            cover_color: book.cover_color,
            cover_url: book.cover_url,
            stock: book.stock,
            quantity: nextQty,
          },
        ];
      });
      toast.success(`${book.title} added to cart`);
    },
    [syncCart],
  );

  const setQuantity = useCallback(
    (bookId: string, quantity: number) => {
      setCart((prev) =>
        prev.flatMap((l) => {
          if (l.book_id !== bookId) return [l];
          const q = Math.max(0, Math.min(l.stock || 99, quantity));
          if (q === 0) {
            void syncCart(bookId, null);
            return [];
          }
          void syncCart(bookId, q);
          return [{ ...l, quantity: q }];
        }),
      );
    },
    [syncCart],
  );

  const removeFromCart = useCallback(
    (bookId: string) => {
      setCart((prev) => prev.filter((l) => l.book_id !== bookId));
      void syncCart(bookId, null);
    },
    [syncCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    if (user) void supabase.from("cart_items").delete().eq("user_id", user.id);
  }, [user]);

  const toggleWishlist = useCallback(
    (bookId: string) => {
      setWishlist((prev) => {
        const has = prev.includes(bookId);
        if (user) {
          if (has) {
            void supabase
              .from("wishlist_items")
              .delete()
              .eq("user_id", user.id)
              .eq("book_id", bookId);
          } else {
            void supabase
              .from("wishlist_items")
              .upsert({ user_id: user.id, book_id: bookId }, { onConflict: "user_id,book_id" });
          }
        }
        toast.success(has ? "Removed from wishlist" : "Saved to wishlist");
        return has ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      });
    },
    [user],
  );

  const value = useMemo<StoreValue>(() => {
    const listPrice = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const payable = cart.reduce(
      (sum, l) => sum + finalPrice(l.price, l.discount_percent) * l.quantity,
      0,
    );
    const deliveryFee = payable === 0 || payable >= 499 ? 0 : 49;
    return {
      cart,
      wishlist,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      subtotal: listPrice,
      discountTotal: listPrice - payable,
      deliveryFee,
      total: payable + deliveryFee,
      itemCount: cart.reduce((sum, l) => sum + l.quantity, 0),
    };
  }, [cart, wishlist, addToCart, setQuantity, removeFromCart, clearCart, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
