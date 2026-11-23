import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { MessageRow } from "@/lib/conversations";

export type ShelfBook = Tables<"shelf_books">;
export type Profile = Tables<"profiles">;
export type ShelfStatus = "want" | "reading" | "read";

export const STATUS_LABELS: Record<ShelfStatus, string> = {
  want: "Want to read",
  reading: "Reading",
  read: "Read",
};

export const shelfQuery = (userId: string) =>
  queryOptions({
    queryKey: ["shelf", userId],
    queryFn: async (): Promise<ShelfBook[]> => {
      const { data, error } = await supabase
        .from("shelf_books")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type MemberSummary = Profile & { bookCount: number; favoriteCount: number };

export const membersQuery = () =>
  queryOptions({
    queryKey: ["members"],
    queryFn: async (): Promise<MemberSummary[]> => {
      const [{ data: profiles, error }, { data: books, error: booksError }] = await Promise.all([
        supabase.from("profiles").select("*").order("display_name"),
        supabase.from("shelf_books").select("user_id, is_favorite"),
      ]);
      if (error) throw error;
      if (booksError) throw booksError;
      return profiles.map((p) => {
        const mine = books.filter((b) => b.user_id === p.id);
        return {
          ...p,
          bookCount: mine.length,
          favoriteCount: mine.filter((b) => b.is_favorite).length,
        };
      });
    },
  });

export const profilesByIdsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["profiles", [...ids].sort()],
    queryFn: async (): Promise<Profile[]> => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
      if (error) throw error;
      return data;
    },
  });

export const myMessagesQuery = (me: string) =>
  queryOptions({
    queryKey: ["messages", "all", me],
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

export const threadQuery = (me: string, other: string) =>
  queryOptions({
    queryKey: ["messages", "thread", me, other],
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`,
        )
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

export const unreadCountQuery = (me: string) =>
  queryOptions({
    queryKey: ["messages", "unread", me],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", me)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
