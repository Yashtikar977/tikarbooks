import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { booksQuery } from "@/lib/queries";
import { finalPrice, inr } from "@/lib/format";
import type { Book } from "@/lib/types";

const STOP = new Set([
  "i", "a", "an", "the", "for", "need", "want", "book", "books", "me", "some",
  "please", "looking", "of", "on", "in", "to", "my", "is", "are", "best", "good",
]);

function score(book: Book, terms: string[]): number {
  const haystack = [
    book.title,
    book.author,
    book.publisher ?? "",
    book.description ?? "",
    book.categories?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!haystack.includes(t)) continue;
    s += book.title.toLowerCase().includes(t) ? 3 : 1;
    if ((book.categories?.name ?? "").toLowerCase().includes(t)) s += 2;
  }
  return s;
}

/**
 * Bookstore assistant. Recommends only from the store's real catalogue —
 * it never invents titles.
 */
export function AiAssistant() {
  const { data: books = [] } = useQuery(booksQuery);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");

  const results = useMemo(() => {
    const terms = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t));
    if (!terms.length) return [];
    return books
      .map((b) => ({ b, s: score(b, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || b.b.rating - a.b.rating)
      .slice(0, 4)
      .map((r) => r.b);
  }, [books, question]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <div className="surface-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-display text-xl">Ask our book assistant</h2>
            <p className="text-sm text-muted-foreground">
              Tell us what you need — we suggest titles available in the store.
            </p>
          </div>
        </div>

        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuestion(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I need a beginner Python book"
            aria-label="Ask the book assistant"
          />
          <Button type="submit">
            <Send className="size-4" /> Ask
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {["Beginner Python book", "Class 10 science", "Competitive exam books", "Story books for kids"].map(
            (s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                onClick={() => {
                  setInput(s);
                  setQuestion(s);
                }}
              >
                {s}
              </button>
            ),
          )}
        </div>

        {question && (
          <div className="mt-6">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matching titles in stock right now. Try another topic, or{" "}
                <Link to="/contact" className="text-primary underline">
                  ask us directly
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {results.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <Link
                        to="/books/$slug"
                        params={{ slug: b.slug }}
                        className="text-display text-base hover:text-primary"
                      >
                        {b.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {b.author} · {b.categories?.name ?? "Books"}
                      </p>
                    </div>
                    <span className="text-display text-primary">
                      {inr(finalPrice(Number(b.price), b.discount_percent))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
