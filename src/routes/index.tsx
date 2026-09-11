import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, MessageCircle, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shelf } from "@/components/site/Shelf";
import { BookCard } from "@/components/site/BookCard";
import { AiAssistant } from "@/components/site/AiAssistant";
import { booksQuery, categoriesQuery } from "@/lib/queries";
import { STORE, whatsappLink } from "@/lib/format";
import type { Book } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tikar Books Emporium — Book Shop in Buldhana, Maharashtra" },
      {
        name: "description",
        content:
          "Discover school, college, engineering, competitive exam, fiction and children's books at Tikar Books Emporium, Buldhana. Home delivery and store pickup available.",
      },
      { property: "og:title", content: "Tikar Books Emporium — Book Shop in Buldhana" },
      {
        property: "og:description",
        content:
          "Browse an immersive 3D bookshelf of school, exam, technology and fiction titles from Buldhana's trusted bookstore.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BookStore",
          name: STORE.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Main Road",
            addressLocality: "Buldhana",
            addressRegion: "Maharashtra",
            postalCode: "443001",
            addressCountry: "IN",
          },
          telephone: STORE.phone,
          email: STORE.email,
          openingHours: ["Mo-Sa 09:30-21:00", "Su 10:00-14:00"],
        }),
      },
    ],
  }),
  component: Home,
});

function Rail({ title, subtitle, books }: { title: string; subtitle: string; books: Book[] }) {
  if (!books.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-display text-2xl sm:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link to="/books" className="text-sm font-medium text-primary hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {books.slice(0, 4).map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data: books = [], isLoading } = useQuery(booksQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const featured = books.filter((b) => b.is_featured);
  const bestsellers = [...books].filter((b) => b.is_bestseller).sort((a, b) => b.sold_count - a.sold_count);
  const arrivals = books.filter((b) => b.is_new_arrival);
  const offers = [...books].filter((b) => b.discount_percent >= 12).sort((a, b) => b.discount_percent - a.discount_percent);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 75% 20%, oklch(0.74 0.115 74 / 0.35), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="fade-up text-[oklch(0.97_0.014_85)]">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[oklch(0.97_0.014_85_/_0.25)] px-3 py-1 text-xs uppercase tracking-[0.2em]">
              <BookOpen className="size-3.5" aria-hidden /> {STORE.city}, Maharashtra
            </p>
            <h1 className="text-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Discover Your Next Great Book
            </h1>
            <p className="mt-4 max-w-lg text-base text-[oklch(0.97_0.014_85_/_0.8)] sm:text-lg">
              Explore books for learning, growth, imagination and every stage of life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/books">
                  Explore Books <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-[oklch(0.97_0.014_85)]">
                <Link to="/categories">Browse Categories</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-[oklch(0.97_0.014_85_/_0.85)]">
              <div>
                <dt className="text-xs uppercase tracking-widest">Titles</dt>
                <dd className="text-display text-2xl">{books.length}+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest">Categories</dt>
                <dd className="text-display text-2xl">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest">Delivery</dt>
                <dd className="text-display text-2xl">Free ₹499+</dd>
              </div>
            </dl>
          </div>

          {/* Hero shelf visual */}
          <div className="shelf-stage relative hidden lg:block">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "oklch(0.2 0.03 42 / 0.5)" }}
              aria-hidden
            />
            <div className="relative flex h-full items-end justify-center gap-2 p-8">
              {books.slice(0, 9).map((b, i) => (
                <div
                  key={b.id}
                  className="book-3d w-9 rounded-sm"
                  style={{
                    height: `${140 + ((i * 37) % 90)}px`,
                    backgroundColor: b.cover_color,
                    transform: `rotateY(${18 - i * 2}deg) rotateZ(${((i % 4) - 1.5) * 2}deg)`,
                    boxShadow: "var(--shadow-lift)",
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Delivery & pickup", text: "Home delivery across Buldhana or collect in store." },
            { icon: Sparkles, title: "Curated for students", text: "Board, university and exam titles kept in stock." },
            { icon: MessageCircle, title: "Ask on WhatsApp", text: "Can't find a title? Message us and we'll source it." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <f.icon className="mt-0.5 size-5 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3D SHELVES */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <header className="mb-8 max-w-2xl">
          <h2 className="text-display text-3xl sm:text-4xl">Walk our shelves</h2>
          <p className="mt-2 text-muted-foreground">
            Hover a book to bring it forward, then click to open its page — just like browsing the
            aisles of our shop in {STORE.city}.
          </p>
        </header>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-secondary" />
        ) : (
          <div className="space-y-14">
            {categories.map((cat) => (
              <Shelf key={cat.id} category={cat} books={books.filter((b) => b.category_id === cat.id)} />
            ))}
          </div>
        )}
      </section>

      <Rail title="Featured Books" subtitle="Hand-picked by our team" books={featured} />
      <Rail title="Best Sellers" subtitle="Most loved by readers in Buldhana" books={bestsellers} />
      <Rail title="New Arrivals" subtitle="Freshly added to our shelves" books={arrivals} />
      <Rail title="Special Offers" subtitle="Biggest discounts running right now" books={offers} />

      {/* ABOUT / CONTACT STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="surface-card grid gap-8 p-8 md:grid-cols-2">
          <div>
            <h2 className="text-display text-2xl">A local bookstore, now online</h2>
            <p className="mt-3 text-muted-foreground">
              {STORE.name} has served students, teachers, readers and professionals in {STORE.city}{" "}
              with textbooks, exam guides, novels and stationery. Order online for home delivery or
              reserve a title and collect it at the counter.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/about">About us</Link>
              </Button>
              <Button asChild>
                <a
                  href={whatsappLink("Hello Tikar Books Emporium, I would like to enquire about a book.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" /> WhatsApp enquiry
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-6">
            <h3 className="text-display text-lg">Store details</h3>
            <p className="mt-2 text-sm text-muted-foreground">{STORE.address}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {STORE.hours.map((h) => (
                <li key={h.days}>
                  <span className="font-medium">{h.days}:</span> {h.time}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <a className="text-primary hover:underline" href={`tel:${STORE.phone.replace(/\s/g, "")}`}>
                {STORE.phone}
              </a>
            </p>
          </div>
        </div>
      </section>

      <AiAssistant />
    </>
  );
}
