import { initials } from "@/lib/conversations";
import { cn } from "@/lib/utils";

export function MemberAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-gradient-binding font-display text-sm font-semibold text-primary-foreground shadow-book",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
