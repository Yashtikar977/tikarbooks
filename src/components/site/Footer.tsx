import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { STORE } from "@/lib/format";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-display text-lg">{STORE.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A family-run bookstore in {STORE.city} serving students, readers and professionals with
            school, college, exam and general reading titles.
          </p>
        </div>
        <nav aria-label="Shop">
          <h3 className="text-sm font-semibold uppercase tracking-widest">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/books" className="hover:text-primary">
                All books
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-primary">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-primary">
                Wishlist
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <h3 className="text-sm font-semibold uppercase tracking-widest">Store</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-primary">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-primary">
                My orders
              </Link>
            </li>
          </ul>
        </nav>
        <address className="not-italic">
          <h3 className="text-sm font-semibold uppercase tracking-widest">Visit us</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {STORE.address}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="hover:text-primary">
                {STORE.phone}
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`mailto:${STORE.email}`} className="hover:text-primary">
                {STORE.email}
              </a>
            </li>
            {STORE.hours.map((h) => (
              <li key={h.days} className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden /> {h.days}: {h.time}
              </li>
            ))}
          </ul>
        </address>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {STORE.name}, {STORE.city}, Maharashtra. Owned by {STORE.owner}. All rights reserved.
      </div>
    </footer>
  );
}
