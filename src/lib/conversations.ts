export type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  otherId: string;
  last: MessageRow;
  unread: number;
};

/** Groups a member's messages into one conversation per other member, newest first. */
export function groupConversations(messages: MessageRow[], me: string): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const m of messages) {
    if (m.sender_id !== me && m.recipient_id !== me) continue;
    const otherId = m.sender_id === me ? m.recipient_id : m.sender_id;
    const isUnread = m.recipient_id === me && m.read_at === null;
    const existing = map.get(otherId);
    if (!existing) {
      map.set(otherId, { otherId, last: m, unread: isUnread ? 1 : 0 });
    } else {
      if (m.created_at > existing.last.created_at) existing.last = m;
      if (isUnread) existing.unread += 1;
    }
  }
  return [...map.values()].sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}
