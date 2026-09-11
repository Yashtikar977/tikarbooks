import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCover } from "./BookCover";
import { finalPrice, inr } from "@/lib/format";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/types";

export function BookCard({ book, view = "grid" }: { book: Book; view?: "grid" | "list" }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const saved = wishlist.includes(book.id);
  const price = finalPrice(Number(book.price), book.discount_percent);

  return (
    <article
      className={cn(
        "surface-card group flex overflow-hidden transition-transform duration-300 hover:-translate-y-1",
        view === "grid" ? "flex-col" : "flex-row gap-4 p-3",
      )}
      style={{ boxShadow: "var(--shadow-book)" }}
    >
      <Link
        to="/books/$slug"
        params={{ slug: book.slug }}
        className={cn("block", view === "grid" ? "p-4 pb-0" : "w-24 shrink-0")}
      >
        <BookCover
          title={book.title}
          author={book.author}
          color={book.cover_color}
          coverUrl={book.cover_url}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className={cn("flex flex-1 flex-col", view === "grid" ? "p-4" : "py-1 pr-1")}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {book.categories?.name ?? "Books"}
        </p>
        <Link to="/books/$slug" params={{ slug: book.slug }} className="mt-1">
          <h3 className="text-display text-base leading-snug hover:text-primary">{book.title}</h3>
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">{book.author}</p>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-accent text-accent" aria-hidden />
          <span className="font-medium text-foreground">{Number(book.rating).toFixed(1)}</span>
          <span>({book.rating_count})</span>
          <span className="mx-1">·</span>
          <span className={book.stock > 0 ? "text-success" : "text-destructive"}>
            {book.stock > 0 ? `In stock (${book.stock})` : "Out of stock"}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-display text-lg text-primary">{inr(price)}</span>
          {book.discount_percent > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {inr(Number(book.price))}
              </span>
              <span className="rounded bg-accent px-1.5 py-0.5 text-[0.65rem] font-semibold text-accent-foreground">
                {book.discount_percent}% off
              </span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={book.stock <= 0}
            onClick={() => addToCart(book)}
          >
            <ShoppingCart className="size-4" /> Add to cart
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            onClick={() => toggleWishlist(book.id)}
          >
            <Heart className={cn("size-4", saved && "fill-primary text-primary")} />
          </Button>
        </div>
      </div>
    </article>
  );
}
