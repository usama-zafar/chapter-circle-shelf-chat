import { useEffect, type ReactNode } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, LogOut, Mail, User, Users } from "lucide-react";

import { BrandMark } from "@/components/club/brand";
import { MemberAvatar } from "@/components/club/member-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, unreadCountQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const authRoute = getRouteApi("/_authenticated");

const navItems = [
  { to: "/shelf", label: "My shelf", icon: BookOpen },
  { to: "/members", label: "Members", icon: Users },
  { to: "/messages", label: "Messages", icon: Mail },
] as const;

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { user } = authRoute.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: unread = 0 } = useQuery(unreadCountQuery(user.id));

  // One live subscription for the signed-in member; RLS only delivers their own messages.
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.id, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const name = profile?.display_name ?? user.email ?? "Reader";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/shelf" aria-label="Star Book Readers home">
            <BrandMark className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{label}</span>
                {to === "/messages" && unread > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-oxblood px-1.5 text-[11px] font-semibold text-oxblood-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                <MemberAvatar name={name} className="size-8 text-xs" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="size-4" /> Edit profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-8", wide ? "max-w-6xl" : "max-w-6xl")}>{children}</main>
    </div>
  );
}
