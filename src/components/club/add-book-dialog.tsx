import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { BookCover } from "@/components/club/book-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { searchCatalog, type CatalogBook } from "@/lib/openlibrary";
import { STATUS_LABELS, type ShelfBook, type ShelfStatus } from "@/lib/queries";

const manualSchema = z.object({
  title: z.string().trim().min(1, "Give the book a title").max(300, "Title is too long"),
  author: z.string().trim().max(300, "Author name is too long"),
});

type NewBook = {
  title: string;
  author: string | null;
  cover_url: string | null;
  ol_key: string | null;
  first_published: number | null;
  status: ShelfStatus;
  is_favorite: boolean;
};

export function AddBookDialog({ userId, shelf }: { userId: string; shelf: ShelfBook[] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (book: NewBook) => {
      const { error } = await supabase.from("shelf_books").insert({ ...book, user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_d, book) => {
      toast.success(`Added “${book.title}” to your shelf`);
      void queryClient.invalidateQueries({ queryKey: ["shelf", userId] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: { code?: string; message?: string }) => {
      toast.error(err.code === "23505" ? "That book is already on your shelf" : "Couldn't add that book");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="lg">
          <Plus /> Add a book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a book</DialogTitle>
          <DialogDescription>Search the catalog, or type the details yourself.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="search" className="min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search catalog</TabsTrigger>
            <TabsTrigger value="manual">Type it in</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="mt-4">
            <CatalogSearch
              shelf={shelf}
              pending={add.isPending}
              onAdd={(b) =>
                add.mutate({
                  title: b.title,
                  author: b.author,
                  cover_url: b.coverUrl,
                  ol_key: b.olKey,
                  first_published: b.year,
                  status: "want",
                  is_favorite: false,
                })
              }
            />
          </TabsContent>
          <TabsContent value="manual" className="mt-4">
            <ManualForm
              pending={add.isPending}
              onSubmit={(b) => add.mutate(b, { onSuccess: () => setOpen(false) })}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CatalogSearch({
  shelf,
  pending,
  onAdd,
}: {
  shelf: ShelfBook[];
  pending: boolean;
  onAdd: (book: CatalogBook) => void;
}) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const results = useQuery({
    queryKey: ["catalog", query],
    queryFn: ({ signal }) => searchCatalog(query, signal),
    enabled: query.length >= 2,
    staleTime: 5 * 60_000,
  });

  const onShelf = new Set(shelf.map((b) => b.ol_key).filter(Boolean));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Title, author or ISBN"
          className="h-11 pl-9"
          aria-label="Search the book catalog"
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto pr-1">
        {query.length < 2 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Start typing to find a book.</p>
        ) : results.isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : results.isError ? (
          <p className="py-10 text-center text-sm text-destructive">
            The catalog didn't answer. Try again, or use “Type it in”.
          </p>
        ) : results.data?.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No matches. Try another spelling, or use “Type it in”.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {results.data?.map((b) => {
              const added = onShelf.has(b.olKey);
              return (
                <li key={b.olKey} className="flex items-center gap-3 py-2.5">
                  <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} className="w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold line-clamp-1">{b.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {[b.author, b.year].filter(Boolean).join(" · ") || "Unknown author"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={added ? "secondary" : "default"}
                    disabled={added || pending}
                    onClick={() => onAdd(b)}
                  >
                    {added ? (
                      <>
                        <Check /> On shelf
                      </>
                    ) : (
                      <>
                        <Plus /> Add
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ManualForm({ pending, onSubmit }: { pending: boolean; onSubmit: (book: NewBook) => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<ShelfStatus>("want");
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = manualSchema.safeParse({ title, author });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the details");
      return;
    }
    setError(null);
    onSubmit({
      title: parsed.data.title,
      author: parsed.data.author || null,
      cover_url: null,
      ol_key: null,
      first_published: null,
      status,
      is_favorite: favorite,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="manual-title">Title</Label>
        <Input id="manual-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="manual-author">Author</Label>
        <Input id="manual-author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={300} />
      </div>
      <div className="grid gap-1.5">
        <Label>Reading status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ShelfStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as ShelfStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={favorite} onCheckedChange={(v) => setFavorite(v === true)} />
        Star it as a favorite
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Add to my shelf
      </Button>
    </form>
  );
}
