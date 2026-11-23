import { useEffect } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { BookOpen, Mail, Star } from "lucide-react";

import heroBooks from "@/assets/hero-books.jpg";
import { BrandMark } from "@/components/club/brand";
import { Button } from "@/components/ui/button";
import { PENDING_REDIRECT_KEY, safeRedirect, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Star Book Readers — a book club with shelves, stars and letters" },
      {
        name: "description",
        content: "Join Star Book Readers: keep your bookshelf, star your favorite books and message fellow members.",
      },
      { property: "og:title", content: "Star Book Readers" },
      {
        property: "og:description",
        content: "Keep your bookshelf, star your favorites and talk books with fellow members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: BookOpen, title: "Your shelf", text: "Track what you want to read, are reading and have finished." },
  { icon: Star, title: "Gold stars", text: "Star the books you love so fellow members can find them." },
  { icon: Mail, title: "Members only letters", text: "Message other readers privately, right here in the club." },
];

function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // After a full-page social sign-in returns here, continue to where the member was headed.
  useEffect(() => {
    if (!session) return;
    const pending = safeRedirect(sessionStorage.getItem(PENDING_REDIRECT_KEY));
    if (pending) {
      sessionStorage.removeItem(PENDING_REDIRECT_KEY);
      router.history.push(pending);
    }
  }, [session, router]);

  return (
    <div className="min-h-screen">
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <img src={heroBooks} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-ink" />
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <BrandMark light />
          {!loading && (
            <Button asChild variant="heroOutline" size="sm">
              {session ? <Link to="/shelf">My shelf</Link> : <Link to="/auth">Sign in</Link>}
            </Button>
          )}
        </header>
        <div className="mx-auto flex max-w-6xl flex-col items-start px-4 pt-[18vh] pb-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 bg-ink/40 px-3 py-1 text-xs tracking-widest text-ink-foreground uppercase backdrop-blur">
            <Star className="size-3 animate-twinkle fill-star text-star" /> A members' book club
          </p>
          <h1 className="max-w-3xl text-5xl leading-[1.02] font-semibold text-ink-foreground sm:text-7xl">
            Every reader deserves a well-lit shelf.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-foreground/85">
            Keep your books, star the ones you love, and trade notes with fellow members of Star Book Readers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {session ? (
              <Button asChild variant="gold" size="lg">
                <Link to="/shelf">Open my shelf</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="gold" size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Join the club
                  </Link>
                </Button>
                <Button asChild variant="heroOutline" size="lg">
                  <Link to="/auth">I'm a member</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-book">
            <span className="grid size-10 place-items-center rounded-full bg-primary">
              <Icon className="size-5 text-star" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Star Book Readers · Read together.
      </footer>
    </div>
  );
}
