import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import { BookCard } from "@/components/site/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { booksQuery, categoriesQuery } from "@/lib/queries";
import { finalPrice } from "@/lib/format";

type Search = { q?: string | undefined; category?: string | undefined };

export const Route = createFileRoute("/books/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" && search["q"] ? (search["q"] as string) : undefined,
    category:
      typeof search["category"] === "string" && search["category"]
        ? (search["category"] as string)
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Buy Books Online in Buldhana | Tikar Books Emporium" },
      {
        name: "description",
        content:
          "Browse school, college, engineering, competitive exam, fiction and children's books at Tikar Books Emporium, Buldhana. Search by author, publisher and price.",
      },
      { property: "og:title", content: "Book Catalogue | Tikar Books Emporium" },
      {
        property: "og:description",
        content: "Search and filter thousands of titles from Buldhana's trusted bookstore.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: books = [], isLoading } = useQuery(booksQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const q = search.q ?? "";
  const category = search.category ?? "";

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    let list = books.filter((b) => {
      if (needle) {
        const hay = `${b.title} ${b.author} ${b.publisher ?? ""} ${b.isbn ?? ""} ${
          b.categories?.name ?? ""
        }`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (category && b.categories?.slug !== category) return false;
      if (author && !b.author.toLowerCase().includes(author.toLowerCase())) return false;
      if (publisher && !(b.publisher ?? "").toLowerCase().includes(publisher.toLowerCase()))
        return false;
      if (maxPrice > 0 && finalPrice(Number(b.price), b.discount_percent) > maxPrice) return false;
      if (inStockOnly && b.stock <= 0) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price_asc")
        return finalPrice(Number(a.price), a.discount_percent) - finalPrice(Number(b.price), b.discount_percent);
      if (sort === "price_desc")
        return finalPrice(Number(b.price), b.discount_percent) - finalPrice(Number(a.price), a.discount_percent);
      if (sort === "popular") return b.sold_count - a.sold_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [books, q, category, author, publisher, maxPrice, inStockOnly, sort]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-display text-3xl sm:text-4xl">Book Catalogue</h1>
        <p className="mt-2 text-muted-foreground">
          {isLoading ? "Loading books…" : `${filtered.length} titles available`}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="surface-card h-fit space-y-5 p-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" htmlFor="q">
              Search
            </label>
            <Input
              id="q"
              value={q}
              placeholder="Title, author, ISBN…"
              onChange={(e) =>
                navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" htmlFor="cat">
              Category
            </label>
            <select
              id="cat"
              className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
              value={category}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({ ...prev, category: e.target.value || undefined }),
                })
              }
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" htmlFor="author">
              Author
            </label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" htmlFor="pub">
              Publisher
            </label>
            <Input id="pub" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" htmlFor="price">
              Max price (₹{maxPrice || "any"})
            </label>
            <input
              id="price"
              type="range"
              min={0}
              max={3000}
              step={50}
              value={maxPrice}
              className="w-full"
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In stock only
          </label>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAuthor("");
              setPublisher("");
              setMaxPrice(0);
              setInStockOnly(false);
              navigate({ search: {} });
            }}
          >
            Reset filters
          </Button>
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <select
              className="rounded-md border bg-background p-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort books"
            >
              <option value="newest">Newest first</option>
              <option value="popular">Most popular</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={view === "grid" ? "default" : "outline"}
                aria-label="Grid view"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "outline"}
                aria-label="List view"
                onClick={() => setView("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>

          {filtered.length === 0 && !isLoading ? (
            <p className="surface-card p-10 text-center text-muted-foreground">
              No books match these filters yet.
            </p>
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-4"
              }
            >
              {filtered.map((b) => (
                <BookCard key={b.id} book={b} view={view} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
