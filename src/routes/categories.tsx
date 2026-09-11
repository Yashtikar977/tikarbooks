import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { booksQuery, categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Book Categories — Tikar Books Emporium, Buldhana" },
      {
        name: "description",
        content:
          "School, college, engineering, competitive exam, fiction, children's and reference book categories at Tikar Books Emporium, Buldhana.",
      },
      { property: "og:title", content: "Book Categories — Tikar Books Emporium" },
      {
        property: "og:description",
        content: "Browse every book category stocked by our Buldhana bookstore.",
      },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: books = [] } = useQuery(booksQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-display text-3xl sm:text-4xl">Browse by category</h1>
      <p className="mt-2 text-muted-foreground">
        Every shelf in our Buldhana store, available online.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = books.filter((b) => b.category_id === c.id).length;
          return (
            <Link
              key={c.id}
              to="/books"
              search={{ category: c.slug }}
              className="surface-card group p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <h2 className="text-display mt-3 text-xl group-hover:text-primary">{c.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                {count} title{count === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
