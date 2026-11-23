import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Star } from "lucide-react";
import { toast } from "sonner";

import { AddBookDialog } from "@/components/club/add-book-dialog";
import { AppShell } from "@/components/club/app-shell";
import { BookCard } from "@/components/club/book-card";
import { ShelfFilters, filterShelf, type ShelfFilter } from "@/components/club/shelf-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, shelfQuery, type ShelfBook, type ShelfStatus } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/shelf")({
  head: () => ({
    meta: [
      { title: "My shelf — Star Book Readers" },
      { name: "description", content: "Your personal bookshelf and starred favorites at Star Book Readers." },
      { property: "og:title", content: "My shelf — Star Book Readers" },
      { property: "og:description", content: "Your personal bookshelf and starred favorites." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShelfPage,
});

function ShelfPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ShelfFilter>("all");
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: books, isLoading } = useQuery(shelfQuery(user.id));
  const key = shelfQuery(user.id).queryKey;

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<ShelfBook, "is_favorite" | "status">> }) => {
      const { error } = await supabase.from("shelf_books").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ShelfBook[]>(key);
      queryClient.setQueryData<ShelfBook[]>(key, (old) => old?.map((b) => (b.id === id ? { ...b, ...patch } : b)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      toast.error("Couldn't save that change");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (book: ShelfBook) => {
      const { error } = await supabase.from("shelf_books").delete().eq("id", book.id);
      if (error) throw error;
    },
    onSuccess: (_d, book) => {
      toast.success(`Removed “${book.title}”`);
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => toast.error("Couldn't remove that book"),
  });

  const all = books ?? [];
  const shown = filterShelf(all, filter);
  const favorites = all.filter((b) => b.is_favorite).length;
  const firstName = profile?.display_name.split(" ")[0];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{firstName ? `${firstName}'s` : "Your"} library</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">My shelf</h1>
          <p className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-4" /> {all.length} {all.length === 1 ? "book" : "books"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-star text-star" /> {favorites} starred
            </span>
          </p>
        </div>
        <AddBookDialog userId={user.id} shelf={all} />
      </div>

      <ShelfFilters value={filter} onChange={setFilter} books={all} className="mt-8" />

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center">
          <Star className="mx-auto size-8 text-star" />
          <h2 className="mt-3 text-2xl font-semibold">
            {all.length === 0 ? "Your shelf is waiting" : "Nothing here yet"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.length === 0
              ? "Add your first book to get started."
              : filter === "favorites"
                ? "Tap the star on a book to add it to your favorites."
                : "No books with this status yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {shown.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              editable
              onToggleFavorite={(b) => update.mutate({ id: b.id, patch: { is_favorite: !b.is_favorite } })}
              onStatusChange={(b, status: ShelfStatus) => update.mutate({ id: b.id, patch: { status } })}
              onRemove={(b) => remove.mutate(b)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
