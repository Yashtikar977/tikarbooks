import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { booksQuery, categoriesQuery } from "@/lib/queries";
import { inr } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type Book, type OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Tikar Books Emporium" },
      { name: "description", content: "Manage books, orders, customers and reviews for Tikar Books Emporium." },
      { property: "og:title", content: "Admin | Tikar Books Emporium" },
      { property: "og:description", content: "Store management dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Dashboard", "Books", "Categories", "Orders", "Reviews"] as const;
type Tab = (typeof TABS)[number];

const EMPTY_BOOK = {
  title: "",
  slug: "",
  author: "",
  publisher: "",
  isbn: "",
  description: "",
  category_id: "",
  price: "0",
  discount_percent: "0",
  stock: "0",
  cover_url: "",
  cover_color: "#6b3f2b",
  is_featured: false,
  is_bestseller: false,
  is_new_arrival: false,
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Dashboard");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">Loading…</main>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-display text-2xl">Restricted area</h1>
        <p className="mt-2 text-muted-foreground">This dashboard is only for store administrators.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-display text-3xl">Store Admin</h1>
      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "Dashboard" && <Dashboard />}
        {tab === "Books" && <BooksAdmin />}
        {tab === "Categories" && <CategoriesAdmin />}
        {tab === "Orders" && <OrdersAdmin />}
        {tab === "Reviews" && <ReviewsAdmin />}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-display mt-1 text-2xl">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { data: books = [] } = useQuery(booksQuery);
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = orders.data ?? [];
  const sales = list
    .filter((o: any) => o.status !== "cancelled")
    .reduce((s: number, o: any) => s + Number(o.total), 0);
  const lowStock = books.filter((b) => b.stock <= 3);
  const best = [...books].sort((a, b) => b.sold_count - a.sold_count).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total sales" value={inr(sales)} />
        <Stat label="Orders" value={list.length} />
        <Stat label="Books" value={books.length} />
        <Stat label="Low stock" value={lowStock.length} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-display text-lg">Recent orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {list.slice(0, 6).map((o: any) => (
              <li key={o.id} className="flex justify-between">
                <span>{o.order_number} · {o.customer_name}</span>
                <span>{inr(Number(o.total))}</span>
              </li>
            ))}
            {list.length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
          </ul>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-display text-lg">Best sellers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {best.map((b) => (
              <li key={b.id} className="flex justify-between">
                <span>{b.title}</span>
                <span className="text-muted-foreground">{b.sold_count} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {lowStock.length > 0 && (
        <section className="surface-card p-5">
          <h2 className="text-display text-lg">Low stock alerts</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {lowStock.map((b) => (
              <li key={b.id} className="flex justify-between">
                <span>{b.title}</span>
                <span className="text-destructive">{b.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BooksAdmin() {
  const qc = useQueryClient();
  const { data: books = [] } = useQuery(booksQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [form, setForm] = useState({ ...EMPTY_BOOK });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadCover(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("book-covers")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setForm((f) => ({ ...f, cover_url: `/api/public/book-cover/${path}` }));
    toast.success("Cover uploaded");
  }

  const set = (k: keyof typeof EMPTY_BOOK, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  function edit(b: Book) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      slug: b.slug,
      author: b.author,
      publisher: b.publisher ?? "",
      isbn: b.isbn ?? "",
      description: b.description ?? "",
      category_id: b.category_id ?? "",
      price: String(b.price),
      discount_percent: String(b.discount_percent),
      stock: String(b.stock),
      cover_url: b.cover_url ?? "",
      cover_color: b.cover_color,
      is_featured: b.is_featured,
      is_bestseller: b.is_bestseller,
      is_new_arrival: b.is_new_arrival,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      author: form.author,
      publisher: form.publisher || null,
      isbn: form.isbn || null,
      description: form.description || null,
      category_id: form.category_id || null,
      price: Number(form.price),
      discount_percent: Number(form.discount_percent),
      stock: Number(form.stock),
      cover_url: form.cover_url || null,
      cover_color: form.cover_color,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_new_arrival: form.is_new_arrival,
    };
    const { error } = editingId
      ? await supabase.from("books").update(payload).eq("id", editingId)
      : await supabase.from("books").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Book updated" : "Book added");
    setEditingId(null);
    setForm({ ...EMPTY_BOOK });
    void qc.invalidateQueries({ queryKey: ["books"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Book deleted");
    void qc.invalidateQueries({ queryKey: ["books"] });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form className="surface-card h-fit space-y-3 p-5" onSubmit={save}>
        <h2 className="text-display text-lg">{editingId ? "Edit book" : "Add book"}</h2>
        <Input placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        <Input placeholder="Slug (auto)" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        <Input placeholder="Author" value={form.author} onChange={(e) => set("author", e.target.value)} required />
        <Input placeholder="Publisher" value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />
        <Input placeholder="ISBN" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} />
        <textarea
          className="w-full rounded-md border bg-background p-2 text-sm"
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <select
          className="w-full rounded-md border bg-background p-2 text-sm"
          value={form.category_id}
          onChange={(e) => set("category_id", e.target.value)}
          aria-label="Category"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="Price" value={form.price} onChange={(e) => set("price", e.target.value)} />
          <Input type="number" placeholder="Disc %" value={form.discount_percent} onChange={(e) => set("discount_percent", e.target.value)} />
          <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <label className="text-sm font-medium" htmlFor="cover-file">
            Cover photo
          </label>
          <div className="flex items-start gap-3">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded border bg-muted">
              {form.cover_url ? (
                <img src={form.cover_url} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  No image
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                id="cover-file"
                type="file"
                accept="image/*"
                className="block w-full text-sm"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void uploadCover(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Uploading cover…" : "Choose a JPG or PNG up to 10 MB."}
              </p>
              {form.cover_url && (
                <Button type="button" size="sm" variant="ghost" onClick={() => set("cover_url", "")}>
                  Remove cover
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm" htmlFor="cc">Spine colour</label>
          <input id="cc" type="color" value={form.cover_color} onChange={(e) => set("cover_color", e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={form.is_bestseller} onChange={(e) => set("is_bestseller", e.target.checked)} /> Bestseller
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => set("is_new_arrival", e.target.checked)} /> New
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">{editingId ? "Update" : "Add book"}</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ ...EMPTY_BOOK }); }}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="surface-card overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2">Title</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="py-2">
                  <span className="font-medium">{b.title}</span>
                  <span className="block text-xs text-muted-foreground">{b.author}</span>
                </td>
                <td className="py-2">{inr(Number(b.price))}</td>
                <td className="py-2">{b.stock}</td>
                <td className="py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => edit(b)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [name, setName] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("categories").insert({ name, slug });
    if (error) { toast.error(error.message); return; }
    setName("");
    toast.success("Category added");
    void qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function rename(id: string, current: string) {
    const next = window.prompt("New category name", current);
    if (!next) return;
    const { error } = await supabase.from("categories").update({ name: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="surface-card max-w-xl p-5">
      <form className="flex gap-2" onSubmit={add}>
        <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button type="submit">Add</Button>
      </form>
      <ul className="mt-4 divide-y">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span>{c.name}</span>
            <span>
              <Button size="sm" variant="ghost" onClick={() => rename(c.id, c.name)}>Rename</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>Delete</Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order updated");
    void qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <ul className="space-y-4">
      {(orders.data ?? []).map((o: any) => (
        <li key={o.id} className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-display">{o.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {o.customer_name} · {o.phone} · {o.fulfilment === "pickup" ? "Store pickup" : `${o.address_line}, ${o.city} ${o.pincode}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{inr(Number(o.total))}</span>
              <select
                className="rounded-md border bg-background p-2 text-sm"
                value={o.status}
                aria-label="Order status"
                onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <ul className="mt-3 text-sm text-muted-foreground">
            {(o.order_items ?? []).map((it: any) => (
              <li key={it.id}>{it.title} × {it.quantity}</li>
            ))}
          </ul>
        </li>
      ))}
      {(orders.data ?? []).length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
    </ul>
  );
}

function ReviewsAdmin() {
  const qc = useQueryClient();
  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, books(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function approve(id: string, is_approved: boolean) {
    const { error } = await supabase.from("reviews").update({ is_approved }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <ul className="space-y-3">
      {(reviews.data ?? []).map((r: any) => (
        <li key={r.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{r.books?.title ?? "Book"} · {r.rating}★</p>
            <p className="text-sm text-muted-foreground">{r.author_name ?? "Customer"}: {r.comment}</p>
          </div>
          <div>
            <Button size="sm" variant="ghost" onClick={() => approve(r.id, !r.is_approved)}>
              {r.is_approved ? "Unapprove" : "Approve"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>Delete</Button>
          </div>
        </li>
      ))}
      {(reviews.data ?? []).length === 0 && <li className="text-muted-foreground">No reviews yet.</li>}
    </ul>
  );
}
