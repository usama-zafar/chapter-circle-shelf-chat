import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/club/app-shell";
import { MemberAvatar } from "@/components/club/member-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";

const schema = z.object({
  display_name: z.string().trim().min(1, "Your name can't be empty").max(60, "Keep it under 60 characters"),
  bio: z.string().trim().max(300, "Keep your bio under 300 characters"),
});

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Star Book Readers" },
      { name: "description", content: "Edit how fellow members see you at Star Book Readers." },
      { property: "og:title", content: "Your profile — Star Book Readers" },
      { property: "og:description", content: "Edit how fellow members see you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user.id));
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.display_name);
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: values.display_name, bio: values.bio || null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: () => toast.error("Couldn't save your profile"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ display_name: name, bio });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Check your details");
    save.mutate(parsed.data);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4">
          <MemberAvatar name={name || "Reader"} className="size-16 text-xl" />
          <div>
            <h1 className="text-4xl font-semibold">Your profile</h1>
            <p className="text-sm text-muted-foreground">This is how fellow members see you.</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-8 grid gap-5 rounded-2xl border bg-card p-6 shadow-book">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="Favorite genres, current obsession, the book you always recommend…"
            />
            <span className="text-right text-xs text-muted-foreground">{bio.length}/300</span>
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user.email} · only you can see this</p>
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />} Save profile
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
