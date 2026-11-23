import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, Star } from "lucide-react";

import { AppShell } from "@/components/club/app-shell";
import { MemberAvatar } from "@/components/club/member-avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { membersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/members/")({
  head: () => ({
    meta: [
      { title: "Members — Star Book Readers" },
      { name: "description", content: "Browse fellow Star Book Readers members and their bookshelves." },
      { property: "og:title", content: "Members — Star Book Readers" },
      { property: "og:description", content: "Browse fellow members and their bookshelves." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { user } = Route.useRouteContext();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery(membersQuery());
  const members = (data ?? []).filter((m) => m.display_name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold sm:text-5xl">Members</h1>
          <p className="mt-2 text-sm text-muted-foreground">Peek at fellow readers' shelves and say hello.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member" className="pl-9" />
        </div>
      </div>
      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">No members match that name.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                to={m.id === user.id ? "/shelf" : "/members/$memberId"}
                params={{ memberId: m.id }}
                className="flex h-full items-start gap-4 rounded-2xl border bg-card p-5 shadow-book transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <MemberAvatar name={m.display_name} className="size-12 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">
                    {m.display_name}
                    {m.id === user.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                  </p>
                  {m.bio && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{m.bio}</p>}
                  <p className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="size-3.5" /> {m.bookCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-star text-star" /> {m.favoriteCount}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
