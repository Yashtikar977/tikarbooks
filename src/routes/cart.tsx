import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/site/BookCover";
import { useStore } from "@/hooks/useStore";
import { finalPrice, inr } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | Tikar Books Emporium" },
      { name: "description", content: "Review the books in your cart before checkout at Tikar Books Emporium, Buldhana." },
      { property: "og:title", content: "Your Cart | Tikar Books Emporium" },
      { property: "og:description", content: "Review your selected books and continue to checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, setQuantity, removeFromCart, subtotal, discountTotal, deliveryFee, total } =
    useStore();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-display text-3xl">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="surface-card mt-8 p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/books">Browse books</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {cart.map((l) => (
              <li key={l.book_id} className="surface-card flex gap-4 p-4">
                <Link to="/books/$slug" params={{ slug: l.slug }} className="w-20 shrink-0">
                  <BookCover title={l.title} color={l.cover_color} coverUrl={l.cover_url} />
                </Link>
                <div className="flex-1">
                  <Link to="/books/$slug" params={{ slug: l.slug }} className="text-display hover:text-primary">
                    {l.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{l.author}</p>
                  <p className="mt-1 text-display text-primary">
                    {inr(finalPrice(l.price, l.discount_percent))}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-md border">
                      <Button variant="ghost" size="sm" aria-label="Decrease" onClick={() => setQuantity(l.book_id, l.quantity - 1)}>
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-9 text-center text-sm">{l.quantity}</span>
                      <Button variant="ghost" size="sm" aria-label="Increase" onClick={() => setQuantity(l.book_id, l.quantity + 1)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(l.book_id)}>
                      <Trash2 className="size-4" /> Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="surface-card h-fit p-5">
            <h2 className="text-display text-xl">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>-{inr(discountTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{deliveryFee === 0 ? "Free" : inr(deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{inr(total)}</dd>
              </div>
            </dl>
            <Button asChild className="mt-5 w-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/books">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </main>
  );
}
