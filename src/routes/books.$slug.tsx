import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { BookCover } from "@/components/site/BookCover";
import { BookCard } from "@/components/site/BookCard";
import { Button } from "@/components/ui/button";
import { bookQuery, booksQuery, reviewsQuery } from "@/lib/queries";
import { finalPrice, inr } from "@/lib/format";
import { useStore } from "@/hooks/useStore";

export const Route = createFileRoute("/books/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} | Tikar Books Emporium, Buldhana` },
        {
          name: "description",
          content: `Buy ${name} at Tikar Books Emporium, Buldhana. Price, availability, description and customer reviews.`,
        },
        { property: "og:title", content: `${name} | Tikar Books Emporium` },
        { property: "og:description", content: `Buy ${name} from Buldhana's trusted bookstore.` },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BookDetail,
});

function BookDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: book, isLoading } = useQuery(bookQuery(slug));
  const { data: allBooks = [] } = useQuery(booksQuery);
  const { data: reviews = [] } = useQuery(reviewsQuery(book?.id));
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return <main className="mx-auto max-w-5xl px-4 py-20 text-muted-foreground">Loading book…</main>;
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-display text-2xl">Book not found</h1>
        <Link to="/books" className="mt-4 inline-block text-primary underline">
          Back to catalogue
        </Link>
      </main>
    );
  }

  const price = finalPrice(Number(book.price), book.discount_percent);
  const saved = wishlist.includes(book.id);
  const related = allBooks
    .filter((b) => b.id !== book.id && b.category_id === book.category_id)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-[320px_1fr]">
        <div>
          <BookCover
            title={book.title}
            author={book.author}
            color={book.cover_color}
            coverUrl={book.cover_url}
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {book.categories?.name ?? "Books"}
          </p>
          <h1 className="text-display mt-1 text-3xl sm:text-4xl">{book.title}</h1>
          <p className="mt-1 text-muted-foreground">
            by {book.author}
            {book.publisher ? ` · ${book.publisher}` : ""}
          </p>

          <div className="mt-3 flex items-center gap-1 text-sm">
            <Star className="size-4 fill-accent text-accent" aria-hidden />
            <span className="font-medium">{Number(book.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">({book.rating_count} ratings)</span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-display text-3xl text-primary">{inr(price)}</span>
            {book.discount_percent > 0 && (
              <>
                <span className="text-muted-foreground line-through">{inr(Number(book.price))}</span>
                <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  {book.discount_percent}% off
                </span>
              </>
            )}
          </div>

          <p className={`mt-2 text-sm ${book.stock > 0 ? "text-success" : "text-destructive"}`}>
            {book.stock > 0 ? `In stock — ${book.stock} copies available` : "Currently out of stock"}
          </p>

          {book.description && (
            <p className="mt-5 leading-relaxed text-muted-foreground">{book.description}</p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {book.isbn && (
              <div>
                <dt className="text-muted-foreground">ISBN</dt>
                <dd>{book.isbn}</dd>
              </div>
            )}
            {book.language && (
              <div>
                <dt className="text-muted-foreground">Language</dt>
                <dd>{book.language}</dd>
              </div>
            )}
            {book.pages && (
              <div>
                <dt className="text-muted-foreground">Pages</dt>
                <dd>{book.pages}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Button variant="ghost" size="sm" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(book.stock || 1, q + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Button disabled={book.stock <= 0} onClick={() => addToCart(book, qty)}>
              Add to cart
            </Button>
            <Button
              variant="secondary"
              disabled={book.stock <= 0}
              onClick={() => {
                addToCart(book, qty);
                void navigate({ to: "/checkout" });
              }}
            >
              Buy now
            </Button>
            <Button variant="outline" onClick={() => toggleWishlist(book.id)}>
              <Heart className={saved ? "size-4 fill-primary text-primary" : "size-4"} />
              {saved ? "Saved" : "Wishlist"}
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-display text-2xl">Customer reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No reviews yet for this title.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r: any) => (
              <li key={r.id} className="surface-card p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.author_name ?? "Customer"}</span>
                  <span className="flex items-center gap-0.5 text-accent">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-accent" />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-display text-2xl">You may also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
