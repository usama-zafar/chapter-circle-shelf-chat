import { MoreHorizontal, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABELS, type ShelfBook, type ShelfStatus } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function BookCover({
  title,
  author,
  coverUrl,
  className,
}: {
  title: string;
  author: string | null;
  coverUrl: string | null;
  className?: string;
}) {
  return (
    <div className={cn("book-cover bg-gradient-binding", className)}>
      {coverUrl ? (
        <img src={coverUrl} alt={`Cover of ${title}`} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col justify-between p-3 text-primary-foreground">
          <span className="h-px w-8 bg-star" />
          <span className="font-display text-sm leading-tight font-semibold line-clamp-5">{title}</span>
          <span className="text-[10px] tracking-widest uppercase opacity-75 line-clamp-1">
            {author ?? "Unknown"}
          </span>
        </div>
      )}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-ink/25" />
    </div>
  );
}

type Props = {
  book: ShelfBook;
  editable?: boolean;
  onToggleFavorite?: (book: ShelfBook) => void;
  onStatusChange?: (book: ShelfBook, status: ShelfStatus) => void;
  onRemove?: (book: ShelfBook) => void;
};

export function BookCard({ book, editable = false, onToggleFavorite, onStatusChange, onRemove }: Props) {
  const status = book.status as ShelfStatus;
  return (
    <article className="group flex flex-col gap-3">
      <div className="relative transition-transform duration-300 group-hover:-translate-y-1">
        <BookCover title={book.title} author={book.author} coverUrl={book.cover_url} />
        {editable ? (
          <button
            type="button"
            onClick={() => onToggleFavorite?.(book)}
            aria-pressed={book.is_favorite}
            aria-label={book.is_favorite ? `Unstar ${book.title}` : `Star ${book.title}`}
            className={cn(
              "absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-ink/60 backdrop-blur transition hover:bg-ink/80",
              book.is_favorite && "bg-ink/80",
            )}
          >
            <Star
              key={String(book.is_favorite)}
              className={cn(
                "size-4 animate-pop",
                book.is_favorite ? "fill-star text-star" : "text-ink-foreground",
              )}
            />
          </button>
        ) : (
          book.is_favorite && (
            <span
              className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-ink/80"
              aria-label="Favorite"
            >
              <Star className="size-4 fill-star text-star" />
            </span>
          )
        )}
      </div>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm leading-snug font-semibold line-clamp-2">{book.title}</h3>
          {book.author && <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>}
          <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {STATUS_LABELS[status]}
          </span>
        </div>
        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Options for ${book.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Reading status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(v) => onStatusChange?.(book, v as ShelfStatus)}
              >
                {(Object.keys(STATUS_LABELS) as ShelfStatus[]).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onRemove?.(book)}
              >
                <Trash2 className="size-4" /> Remove from shelf
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
