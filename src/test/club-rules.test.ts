import { describe, expect, it } from "vitest";

import { filterShelf } from "@/components/club/shelf-filters";
import { groupConversations, type MessageRow } from "@/lib/conversations";
import { safeRedirect } from "@/lib/auth";
import type { ShelfBook } from "@/lib/queries";

const me = "me";
const msg = (id: string, from: string, to: string, at: string, read = false): MessageRow => ({
  id,
  sender_id: from,
  recipient_id: to,
  body: id,
  created_at: at,
  read_at: read ? at : null,
});

describe("messaging between members", () => {
  it("groups messages into one conversation per other member, newest first", () => {
    const list = groupConversations(
      [
        msg("1", "ana", me, "2026-01-01T10:00:00Z"),
        msg("2", me, "ana", "2026-01-01T11:00:00Z"),
        msg("3", "ben", me, "2026-01-02T09:00:00Z"),
      ],
      me,
    );
    expect(list.map((c) => c.otherId)).toEqual(["ben", "ana"]);
    expect(list[1]?.last.id).toBe("2");
  });

  it("counts only unread messages sent to me", () => {
    const [c] = groupConversations(
      [
        msg("1", "ana", me, "2026-01-01T10:00:00Z"),
        msg("2", "ana", me, "2026-01-01T10:05:00Z", true),
        msg("3", me, "ana", "2026-01-01T10:10:00Z"),
      ],
      me,
    );
    expect(c?.unread).toBe(1);
  });

  it("ignores messages between other members", () => {
    expect(groupConversations([msg("1", "ana", "ben", "2026-01-01T10:00:00Z")], me)).toEqual([]);
  });
});

describe("starred favorites", () => {
  const book = (id: string, fav: boolean): ShelfBook =>
    ({ id, is_favorite: fav, status: "read" }) as ShelfBook;

  it("favorites filter shows only starred books", () => {
    const shown = filterShelf([book("a", true), book("b", false)], "favorites");
    expect(shown.map((b) => b.id)).toEqual(["a"]);
  });
});

describe("sign-in redirects stay on the platform", () => {
  it("rejects outside addresses", () => {
    expect(safeRedirect("https://evil.example")).toBeUndefined();
    expect(safeRedirect("//evil.example")).toBeUndefined();
    expect(safeRedirect("/members/abc")).toBe("/members/abc");
  });
});
