import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { booksQuery } from "@/lib/queries";
import { STORE, finalPrice, inr } from "@/lib/format";
import { BookCover } from "./BookCover";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/books", label: "Books" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { itemCount, wishlist } = useStore();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { data: books = [] } = useQuery(booksQuery);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = term.trim().toLowerCase();
  const suggestions = q
    ? books
        .filter((b) =>
          [b.title, b.author, b.publisher, b.isbn, b.categories?.name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        )
        .slice(0, 6)
    : [];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggest(false);
    setOpen(false);
    navigate({ to: "/books", search: { q: term.trim() || undefined } });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="grid size-9 place-items-center rounded-md text-display text-lg text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
            aria-hidden
          >
            T
          </span>
          <span className="leading-tight">
            <span className="text-display block text-base sm:text-lg">{STORE.name}</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              {STORE.city}, Maharashtra
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <form onSubmit={submitSearch}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder="Search title, author, publisher, ISBN…"
              aria-label="Search books"
              className="pl-9"
            />
          </form>
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              {suggestions.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/books/$slug"
                    params={{ slug: b.slug }}
                    onClick={() => {
                      setShowSuggest(false);
                      setTerm("");
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-secondary"
                  >
                    <div className="w-8">
                      <BookCover title={b.title} color={b.cover_color} coverUrl={b.cover_url} compact />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.author}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {inr(finalPrice(Number(b.price), b.discount_percent))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/wishlist" className="relative">
              <Heart className="size-5" />
              {wishlist.length > 0 && <Badge>{wishlist.length}</Badge>}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Cart">
            <Link to="/cart" className="relative">
              <ShoppingCart className="size-5" />
              {itemCount > 0 && <Badge>{itemCount}</Badge>}
            </Link>
          </Button>
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="icon" aria-label="Admin dashboard">
                  <Link to="/admin">
                    <LayoutDashboard className="size-5" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" aria-label="My account">
                <Link to="/account">
                  <User className="size-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search books…"
              aria-label="Search books"
            />
          </form>
          <nav className="grid gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/account" : "/auth"}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium hover:bg-secondary"
            >
              {user ? "My account" : "Sign in / Register"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground">
      {children}
    </span>
  );
}
