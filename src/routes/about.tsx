import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, HeartHandshake, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/format";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Tikar Books Emporium — Book Shop in Buldhana" },
      {
        name: "description",
        content:
          "Tikar Books Emporium is a trusted bookstore in Buldhana, Maharashtra supplying school, college, competitive exam and general reading books.",
      },
      { property: "og:title", content: "About Tikar Books Emporium, Buldhana" },
      {
        property: "og:description",
        content: "Our story, our shelves and why readers in Buldhana shop with us.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-display text-4xl">About {STORE.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {STORE.name} is a family-run bookstore owned by {STORE.owner}, located in {STORE.city},
        Maharashtra. We supply books to students, teachers, exam aspirants, professionals and readers
        of every age.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {[
          {
            icon: BookOpen,
            title: "A wide range of books",
            text: "School and board textbooks, degree course books, engineering and computer science titles, competitive exam guides, novels, children's books, references and stationery.",
          },
          {
            icon: HeartHandshake,
            title: "Customer-focused service",
            text: "Not in stock? Tell us the title on WhatsApp or at the counter and we will source it for you as quickly as we can.",
          },
          {
            icon: Sparkles,
            title: "Curated for the syllabus",
            text: "We track what schools, colleges and coaching classes in the district prescribe, so the right editions stay on our shelves.",
          },
          {
            icon: MapPin,
            title: "Proudly local",
            text: `Run from ${STORE.address}, with home delivery across Buldhana and free in-store pickup.`,
          },
        ].map((item) => (
          <div key={item.title} className="surface-card p-6">
            <item.icon className="size-6 text-primary" aria-hidden />
            <h2 className="text-display mt-3 text-xl">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/books">Browse the catalogue</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/contact">Contact the store</Link>
        </Button>
      </div>
    </div>
  );
}
