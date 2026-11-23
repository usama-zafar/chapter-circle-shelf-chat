import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { AppShell } from "@/components/club/app-shell";
import { BookCard } from "@/components/club/book-card";
import { MemberAvatar } from "@/components/club/member-avatar";
import { ShelfFilters, filterShelf, type ShelfFilter } from "@/components/club/shelf-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { profileQuery, shelfQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/members/$memberId")({
  head: () => ({
    meta: [
      { title: "Member shelf — Star Book Readers" },
      { name: "description", content: "A fellow member's bookshelf and starred favorites at Star Book Readers." },
      { property: "og:title", content: "Member shelf — Star Book Readers" },
      { property: "og:description", content: "A fellow member's bookshelf and starred favorites." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberPage,
});

function MemberPage() {
  const { memberId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<ShelfFilter>("favorites");
  const { data: profile, isLoading } = useQuery(profileQuery(memberId));
  const { data: books = [] } = useQuery(shelfQuery(memberId));
  const isMe = memberId === user.id;
  const shown = filterShelf(books, filter);
  const effective = shown.length === 0 && filter === "favorites" ? books : shown;

  return (
    <AppShell>
      <Link to="/members" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All members
      </Link>
      {isLoading ? (
        <Skeleton className="mt-6 h-24 rounded-2xl" />
      ) : !profile ? (
        <p className="mt-10 text-center text-muted-foreground">This member couldn't be found.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <MemberAvatar name={profile.display_name} className="size-16 text-xl" />
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-semibold">{profile.display_name}</h1>
              {profile.bio && <p className="mt-1 max-w-xl text-muted-foreground">{profile.bio}</p>}
            </div>
            {isMe ? (
              <Button asChild variant="outline">
                <Link to="/shelf">Go to my shelf</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/messages/$memberId" params={{ memberId }}>
                  <MessageCircle /> Send a message
                </Link>
              </Button>
            )}
          </div>
          <ShelfFilters value={filter} onChange={setFilter} books={books} className="mt-8" />
          {filter === "favorites" && shown.length === 0 && books.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">No starred books yet — here's the whole shelf.</p>
          )}
          {books.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              {profile.display_name} hasn't added any books yet.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {effective.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
