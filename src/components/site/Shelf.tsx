import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookCover } from "./BookCover";
import { finalPrice, inr } from "@/lib/format";
import type { Book, Category } from "@/lib/types";

/**
 * CSS-3D bookshelf: books stand on a wooden plank with perspective, depth,
 * shadows and per-book tilt. Pure CSS transforms keep it fast on mobile.
 */
export function Shelf({ category, books }: { category: Category; books: Book[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (!books.length) return null;

  return (
    <section className="fade-up">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-display text-xl sm:text-2xl">
            <span aria-hidden className="mr-2">
              {category.icon}
            </span>
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
        <Link
          to="/books"
          search={{ category: category.slug }}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="shelf-stage relative">
        <div
          className="rounded-xl px-3 pt-8 sm:px-6"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.32 0.04 46), oklch(0.26 0.035 44) 70%, oklch(0.22 0.03 42))",
            boxShadow: "var(--shadow-shelf)",
          }}
        >
          <div className="flex snap-x snap-mandatory items-end gap-3 overflow-x-auto pb-1 sm:gap-5 [scrollbar-width:thin]">
            {books.map((book, i) => {
              const isActive = active === book.id;
              const tilt = ((i % 5) - 2) * 1.6;
              const price = finalPrice(Number(book.price), book.discount_percent);
              return (
                <Link
                  key={book.id}
                  to="/books/$slug"
                  params={{ slug: book.slug }}
                  onMouseEnter={() => setActive(book.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(book.id)}
                  onBlur={() => setActive(null)}
                  className="book-3d group relative w-[92px] shrink-0 snap-start outline-none sm:w-[112px]"
                  style={{
                    transform: isActive
                      ? "translateZ(46px) translateY(-14px) rotateY(-8deg) rotateZ(0deg)"
                      : `rotateZ(${tilt}deg) rotateY(6deg)`,
                    filter: isActive ? "brightness(1.08)" : "brightness(0.92)",
                  }}
                  aria-label={`${book.title} by ${book.author}`}
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    color={book.cover_color}
                    coverUrl={book.cover_url}
                    compact
                  />
                  <div
                    className="pointer-events-none absolute -bottom-2 left-1/2 h-3 w-[86%] -translate-x-1/2 rounded-[50%] blur-[3px] transition-opacity"
                    style={{
                      background: "oklch(0.15 0.02 40 / 0.55)",
                      opacity: isActive ? 0.85 : 0.5,
                    }}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 -top-14 z-10 mx-auto w-[150px] rounded-md border border-border bg-popover p-2 text-center text-xs shadow-lg transition-all duration-300"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(6px)",
                    }}
                  >
                    <p className="text-display line-clamp-2 leading-tight">{book.title}</p>
                    <p className="mt-1 font-semibold text-primary">{inr(price)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="shelf-plank -mx-3 mt-1 h-4 rounded-b-xl sm:-mx-6" aria-hidden />
        </div>
      </div>
    </section>
  );
}
