import { Star } from "lucide-react";

import { STATUS_LABELS, type ShelfBook, type ShelfStatus } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type ShelfFilter = "all" | "favorites" | ShelfStatus;

export function filterShelf(books: ShelfBook[], filter: ShelfFilter): ShelfBook[] {
  if (filter === "all") return books;
  if (filter === "favorites") return books.filter((b) => b.is_favorite);
  return books.filter((b) => b.status === filter);
}

const order: ShelfFilter[] = ["all", "favorites", "reading", "want", "read"];

export function ShelfFilters({
  value,
  onChange,
  books,
  className,
}: {
  value: ShelfFilter;
  onChange: (f: ShelfFilter) => void;
  books: ShelfBook[];
  className?: string;
}) {
  return (
    <div role="tablist" aria-label="Filter shelf" className={cn("flex flex-wrap gap-2", className)}>
      {order.map((f) => {
        const label = f === "all" ? "All" : f === "favorites" ? "Favorites" : STATUS_LABELS[f];
        const count = filterShelf(books, f).length;
        const active = value === f;
        return (
          <button
            key={f}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(f)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
            )}
          >
            {f === "favorites" && <Star className={cn("size-3.5", "fill-star text-star")} />}
            {label}
            <span className={cn("text-xs", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
