import { createFileRoute } from "@tanstack/react-router";

/**
 * Public passthrough for book cover images stored in the private
 * "book-covers" bucket. Anon read policy allows the fetch; we stream
 * the bytes with long-lived cache headers.
 */
export const Route = createFileRoute("/api/public/book-cover/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as Record<string, string>)["_splat"] ?? "";
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const url = `${process.env['SUPABASE_URL']}/storage/v1/object/book-covers/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;

        const upstream = await fetch(url, {
          headers: { apikey: process.env['SUPABASE_PUBLISHABLE_KEY']! },
        });

        if (!upstream.ok || !upstream.body) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
