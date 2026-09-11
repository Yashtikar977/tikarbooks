import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Book, Category } from "./types";

const BOOK_SELECT = "*, categories(name, slug)";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Category[];
  },
  staleTime: 5 * 60 * 1000,
});

export const booksQuery = queryOptions({
  queryKey: ["books"],
  queryFn: async (): Promise<Book[]> => {
    const { data, error } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Book[];
  },
  staleTime: 60 * 1000,
});

export function bookQuery(slug: string) {
  return queryOptions({
    queryKey: ["book", slug],
    queryFn: async (): Promise<Book | null> => {
      const { data, error } = await supabase
        .from("books")
        .select(BOOK_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Book | null;
    },
  });
}

export function reviewsQuery(bookId: string | undefined) {
  return queryOptions({
    queryKey: ["reviews", bookId],
    enabled: Boolean(bookId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", bookId!)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
