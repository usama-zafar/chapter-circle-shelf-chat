import { Link, Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Lock, PenLine } from "lucide-react";

import { AppShell } from "@/components/club/app-shell";
import { MemberAvatar } from "@/components/club/member-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { groupConversations } from "@/lib/conversations";
import { myMessagesQuery, profilesByIdsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Star Book Readers" },
      { name: "description", content: "Private messages between Star Book Readers members." },
      { property: "og:title", content: "Messages — Star Book Readers" },
      { property: "og:description", content: "Private messages between club members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesLayout,
});

function MessagesLayout() {
  const { user } = Route.useRouteContext();
  const params = useParams({ strict: false }) as { memberId?: string };
  const activeId = params.memberId;
  const { data: messages, isLoading } = useQuery(myMessagesQuery(user.id));
  const conversations = groupConversations(messages ?? [], user.id);
  const { data: profiles = [] } = useQuery(profilesByIdsQuery(conversations.map((c) => c.otherId)));
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.display_name ?? "Member";

  return (
    <AppShell>
      <div className="grid h-[calc(100vh-8rem)] min-h-[480px] overflow-hidden rounded-2xl border bg-card shadow-book md:grid-cols-[320px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-r", activeId && "hidden md:flex")}>
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h1 className="text-2xl font-semibold">Messages</h1>
            <Button asChild size="sm" variant="outline">
              <Link to="/members">
                <PenLine /> New
              </Link>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                No conversations yet. Visit a member's shelf and send them a message.
              </p>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const name = nameOf(c.otherId);
                  const active = c.otherId === activeId;
                  return (
                    <li key={c.otherId}>
                      <Link
                        to="/messages/$memberId"
                        params={{ memberId: c.otherId }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary",
                          active && "bg-secondary",
                        )}
                      >
                        <MemberAvatar name={name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{name}</p>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatDistanceToNowStrict(new Date(c.last.created_at))}
                            </span>
                          </div>
                          <p className={cn("truncate text-xs", c.unread ? "text-foreground" : "text-muted-foreground")}>
                            {c.last.sender_id === user.id ? "You: " : ""}
                            {c.last.body}
                          </p>
                        </div>
                        {c.unread > 0 && (
                          <span className="grid min-w-5 place-items-center rounded-full bg-oxblood px-1.5 text-[11px] font-semibold text-oxblood-foreground">
                            {c.unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="flex items-center gap-1.5 border-t px-4 py-3 text-[11px] text-muted-foreground">
            <Lock className="size-3" /> Messages stay inside Star Book Readers.
          </p>
        </aside>
        <section className={cn("min-h-0", !activeId && "hidden md:block")}>
          <Outlet />
        </section>
      </div>
    </AppShell>
  );
}
