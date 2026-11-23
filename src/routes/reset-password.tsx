import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/club/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Star Book Readers" },
      { name: "description", content: "Set a new password for your Star Book Readers account." },
      { property: "og:title", content: "Choose a new password — Star Book Readers" },
      { property: "og:description", content: "Set a new password for your Star Book Readers account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    setIsRecovery(window.location.hash.includes("type=recovery") || !!session);
  }, [session]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return void toast.error("Use at least 8 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Password updated");
    void navigate({ to: "/shelf", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-10">
        <BrandMark />
      </Link>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      {!loading && !isRecovery ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This link has expired or was already used.{" "}
          <Link to="/auth" search={{ mode: "forgot" }} className="font-medium text-foreground underline">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
            />
          </div>
          <Button type="submit" disabled={busy || !session}>
            {busy && <Loader2 className="animate-spin" />} Save password
          </Button>
        </form>
      )}
    </div>
  );
}
