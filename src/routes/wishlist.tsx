import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookCard } from "@/components/site/BookCard";
import { Button } from "@/components/ui/button";
import { booksQuery } from "@/lib/queries";
import { useStore } from "@/hooks/useStore";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist | Tikar Books Emporium" },
      { name: "description", content: "Books you have saved at Tikar Books Emporium, Buldhana." },
      { property: "og:title", content: "Your Wishlist | Tikar Books Emporium" },
      { property: "og:description", content: "Books you have saved for later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useStore();
  const { data: books = [] } = useQuery(booksQuery);
  const saved = books.filter((b) => wishlist.includes(b.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-display text-3xl">Your Wishlist</h1>
      {saved.length === 0 ? (
        <div className="surface-card mt-8 p-10 text-center">
          <p className="text-muted-foreground">You have not saved any books yet.</p>
          <Button asChild className="mt-4">
            <Link to="/books">Browse books</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {saved.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </main>
  );
}
