import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { MemberAvatar } from "@/components/club/member-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, threadQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const MAX_LEN = 2000;

export const Route = createFileRoute("/_authenticated/messages/$memberId")({
  component: Thread,
});

function Thread() {
  const { memberId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: other, isLoading: loadingOther } = useQuery(profileQuery(memberId));
  const { data: messages = [] } = useQuery(threadQuery(user.id, memberId));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const unreadIds = messages.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
  const unreadKey = unreadIds.join(",");
  useEffect(() => {
    if (!unreadKey) return;
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadKey.split(","))
      .then(() => queryClient.invalidateQueries({ queryKey: ["messages"] }));
  }, [unreadKey, queryClient]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: memberId, body: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: () => toast.error("Your message didn't send. Try again."),
  });

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || send.isPending) return;
    if (text.length > MAX_LEN) return void toast.error(`Keep messages under ${MAX_LEN} characters`);
    send.mutate(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  if (memberId === user.id) {
    return <p className="p-8 text-center text-sm text-muted-foreground">You can't message yourself — pick another member.</p>;
  }
  if (!loadingOther && !other) {
    return <p className="p-8 text-center text-sm text-muted-foreground">This member couldn't be found.</p>;
  }

  const name = other?.display_name ?? "…";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link to="/messages" className="md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" />
        </Link>
        <MemberAvatar name={name} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold">{name}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/members/$memberId" params={{ memberId }}>
            View shelf
          </Link>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Say hello to {name} — maybe ask what they're reading?
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {messages.map((m, i) => {
              const mine = m.sender_id === user.id;
              const date = new Date(m.created_at);
              const prev = messages[i - 1];
              const showDay = !prev || !isSameDay(new Date(prev.created_at), date);
              return (
                <li key={m.id} className="flex flex-col">
                  {showDay && (
                    <span className="my-3 self-center rounded-full bg-secondary px-3 py-0.5 text-[11px] text-muted-foreground">
                      {format(date, "EEE, MMM d")}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
                      mine
                        ? "self-end rounded-br-md bg-bubble-mine text-bubble-mine-foreground"
                        : "self-start rounded-bl-md bg-bubble-theirs text-bubble-theirs-foreground",
                    )}
                  >
                    {m.body}
                    <span className={cn("mt-0.5 block text-right text-[10px] opacity-60")}>{format(date, "p")}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message ${name}`}
          aria-label={`Message ${name}`}
          rows={1}
          maxLength={MAX_LEN}
          className="max-h-40 min-h-11 resize-none"
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={!body.trim() || send.isPending} aria-label="Send message">
          {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
