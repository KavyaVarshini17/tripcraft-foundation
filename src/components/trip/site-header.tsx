import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-lg tracking-tight text-foreground">TripCraft</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/planner"
            className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            Planner
          </Link>
          <Link
            to="/itinerary"
            className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            Itinerary
          </Link>
        </nav>
      </div>
    </header>
  );
}
