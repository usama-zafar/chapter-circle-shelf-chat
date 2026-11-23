import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import heroBooks from "@/assets/hero-books.jpg";
import { BrandMark, GoogleLogo } from "@/components/club/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PENDING_REDIRECT_KEY, safeRedirect, useAuth } from "@/lib/auth";

type Mode = "signin" | "signup" | "forgot";
type AuthSearch = { redirect?: string; mode?: Mode };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const out: AuthSearch = {};
    const r = safeRedirect(search["redirect"]);
    if (r) out.redirect = r;
    const m = search["mode"];
    if (m === "signin" || m === "signup" || m === "forgot") out.mode = m;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Sign in or join — Star Book Readers" },
      { name: "description", content: "Sign in to Star Book Readers or create your member account." },
      { property: "og:title", content: "Sign in or join — Star Book Readers" },
      { property: "og:description", content: "Sign in to Star Book Readers or create your member account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const signupSchema = z.object({
  displayName: z.string().trim().min(1, "Tell us your name").max(60, "Keep it under 60 characters"),
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters").max(72),
});
const signinSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });

function AuthPage() {
  const search = Route.useSearch();
  const router = useRouter();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);
  const destination = search.redirect ?? "/shelf";

  useEffect(() => {
    if (session) router.history.replace(destination);
  }, [session, destination, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ displayName, email, password });
        if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Check your details");
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) return void toast.error(error.message);
        if (!data.session) {
          sessionStorage.setItem(PENDING_REDIRECT_KEY, destination);
          setSentTo({ email: parsed.data.email, kind: "confirm" });
        }
      } else if (mode === "signin") {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Check your details");
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) return void toast.error(error.message);
      } else {
        const parsed = emailSchema.safeParse(email);
        if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Enter your email");
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return void toast.error(error.message);
        setSentTo({ email: parsed.data, kind: "reset" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    sessionStorage.setItem(PENDING_REDIRECT_KEY, destination);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    sessionStorage.removeItem(PENDING_REDIRECT_KEY);
    router.history.replace(destination);
  }

  const title =
    mode === "signup" ? "Join the club" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={heroBooks} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-ink" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="max-w-md font-display text-3xl leading-snug text-ink-foreground">
            “A reader lives a thousand lives before he dies.”
          </p>
          <p className="mt-3 text-sm text-ink-foreground/75">— George R.R. Martin</p>
        </div>
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="self-start">
          <BrandMark />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {sentTo ? (
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary">
                <MailCheck className="size-6 text-star" />
              </span>
              <h1 className="mt-5 text-3xl font-semibold">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {sentTo.kind === "confirm"
                  ? `We sent a confirmation link to ${sentTo.email}. Open it to finish joining.`
                  : `We sent a password reset link to ${sentTo.email}.`}
              </p>
              <Button
                variant="link"
                className="mt-4"
                onClick={() => {
                  setSentTo(null);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-semibold">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Create your member account to start your shelf."
                  : mode === "forgot"
                    ? "We'll email you a link to choose a new password."
                    : "Sign in to your shelf and messages."}
              </p>

              {mode !== "forgot" && (
                <div className="mt-8 grid gap-3">
                  <Button type="button" variant="google" className="h-11" onClick={() => void social("google")}>
                    <GoogleLogo /> Continue with Google
                  </Button>
                  <Button type="button" variant="outline" className="h-11" onClick={() => void social("lovable")}>
                    <LovableMark /> Continue with Lovable
                  </Button>
                  <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className={mode === "forgot" ? "mt-8 grid gap-4" : "grid gap-4"}>
                {mode === "signup" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="displayName">Your name</Label>
                    <Input
                      id="displayName"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={60}
                    />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                          onClick={() => setMode("forgot")}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      maxLength={72}
                    />
                  </div>
                )}
                <Button type="submit" size="lg" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signup" ? (
                  <>
                    Already a member?{" "}
                    <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
                      Sign in
                    </button>
                  </>
                ) : mode === "forgot" ? (
                  <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
                    Back to sign in
                  </button>
                ) : (
                  <>
                    New here?{" "}
                    <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
                      Join the club
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
