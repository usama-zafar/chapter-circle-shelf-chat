import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: () => (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary">
          <Mail className="size-6 text-star" />
        </span>
        <h2 className="mt-4 text-2xl font-semibold">Pick a conversation</h2>
        <p className="mt-1 text-sm text-muted-foreground">Or start one from a member's shelf.</p>
      </div>
    </div>
  ),
});
