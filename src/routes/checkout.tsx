import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { finalPrice, inr } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Tikar Books Emporium" },
      { name: "description", content: "Place your book order for home delivery or store pickup in Buldhana." },
      { property: "og:title", content: "Checkout | Tikar Books Emporium" },
      { property: "og:description", content: "Home delivery or store pickup in Buldhana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, discountTotal, deliveryFee, total, clearCart } = useStore();
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address_line: "",
    city: "Buldhana",
    state: "Maharashtra",
    pincode: "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const fee = fulfilment === "pickup" ? 0 : deliveryFee;
  const payable = subtotal - discountTotal + fee;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setBusy(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: form.customer_name,
          phone: form.phone,
          email: form.email || null,
          fulfilment,
          address_line: fulfilment === "delivery" ? form.address_line : null,
          city: fulfilment === "delivery" ? form.city : null,
          state: fulfilment === "delivery" ? form.state : null,
          pincode: fulfilment === "delivery" ? form.pincode : null,
          subtotal,
          discount_total: discountTotal,
          delivery_fee: fee,
          total: payable,
          notes: form.notes || null,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((l) => ({
          order_id: order.id,
          book_id: l.book_id,
          title: l.title,
          author: l.author,
          cover_color: l.cover_color,
          unit_price: finalPrice(l.price, l.discount_percent),
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      clearCart();
      toast.success(`Order ${order.order_number} placed successfully!`);
      void navigate({ to: user ? "/account" : "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place the order");
    } finally {
      setBusy(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-display text-2xl">Your cart is empty</h1>
        <Button asChild className="mt-4">
          <Link to="/books">Browse books</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-display text-3xl">Checkout</h1>

      <form className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]" onSubmit={placeOrder}>
        <div className="surface-card space-y-4 p-6">
          <div className="flex gap-2">
            {(["delivery", "pickup"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                variant={fulfilment === f ? "default" : "outline"}
                onClick={() => setFulfilment(f)}
              >
                {f === "delivery" ? "Home Delivery" : "Store Pickup"}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm" htmlFor="cn">Full name</label>
              <Input id="cn" value={form.customer_name} onChange={set("customer_name")} required />
            </div>
            <div>
              <label className="text-sm" htmlFor="ph">Mobile number</label>
              <Input id="ph" value={form.phone} onChange={set("phone")} pattern="[0-9+ ]{10,15}" required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm" htmlFor="em">Email (optional)</label>
              <Input id="em" type="email" value={form.email} onChange={set("email")} />
            </div>
          </div>

          {fulfilment === "delivery" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm" htmlFor="ad">Delivery address</label>
                <Input id="ad" value={form.address_line} onChange={set("address_line")} required />
              </div>
              <div>
                <label className="text-sm" htmlFor="ci">City</label>
                <Input id="ci" value={form.city} onChange={set("city")} required />
              </div>
              <div>
                <label className="text-sm" htmlFor="st">State</label>
                <Input id="st" value={form.state} onChange={set("state")} required />
              </div>
              <div>
                <label className="text-sm" htmlFor="pc">PIN code</label>
                <Input id="pc" value={form.pincode} onChange={set("pincode")} pattern="[0-9]{6}" required />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm" htmlFor="no">Notes (optional)</label>
            <textarea
              id="no"
              className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>

        <aside className="surface-card h-fit p-5">
          <h2 className="text-display text-xl">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map((l) => (
              <li key={l.book_id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {l.title} × {l.quantity}
                </span>
                <span>{inr(finalPrice(l.price, l.discount_percent) * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-success">
              <dt>Discount</dt>
              <dd>-{inr(discountTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{fulfilment === "pickup" ? "Pickup" : "Delivery"}</dt>
              <dd>{fee === 0 ? "Free" : inr(fee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Payable</dt>
              <dd>{inr(payable)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Pay on delivery or at the store. Online payment coming soon.
          </p>
          <Button type="submit" className="mt-4 w-full" disabled={busy}>
            {busy ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
    </main>
  );
}
