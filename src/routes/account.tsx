import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Tikar Books Emporium" },
      { name: "description", content: "Manage your profile, addresses and book orders at Tikar Books Emporium." },
      { property: "og:title", content: "My Account | Tikar Books Emporium" },
      { property: "og:description", content: "Your profile and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setPhone(profile.data.phone ?? "");
    }
  }, [profile.data]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user!.id, full_name: fullName, phone });
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  if (!user) return <main className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">Loading…</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-3xl">My Account</h1>
        <Button variant="outline" onClick={() => void signOut().then(() => navigate({ to: "/" }))}>
          Sign out
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <form className="surface-card h-fit space-y-4 p-5" onSubmit={saveProfile}>
          <h2 className="text-display text-xl">Profile</h2>
          <div>
            <label className="text-sm" htmlFor="fn">Full name</label>
            <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm" htmlFor="ph">Phone</label>
            <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <Button type="submit" className="w-full">Save profile</Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/wishlist">My wishlist</Link>
          </Button>
        </form>

        <section>
          <h2 className="text-display text-xl">Order history</h2>
          {orders.isLoading ? (
            <p className="mt-3 text-muted-foreground">Loading orders…</p>
          ) : (orders.data ?? []).length === 0 ? (
            <div className="surface-card mt-3 p-8 text-center">
              <p className="text-muted-foreground">You have not placed any orders yet.</p>
              <Button asChild className="mt-4">
                <Link to="/books">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {(orders.data ?? []).map((o: any) => (
                <li key={o.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-display">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                        {o.fulfilment === "pickup" ? "Store pickup" : "Home delivery"}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                      {ORDER_STATUS_LABEL[o.status as OrderStatus]}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {(o.order_items ?? []).map((it: any) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.title} × {it.quantity}</span>
                        <span>{inr(Number(it.unit_price) * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-semibold">Total {inr(Number(o.total))}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
