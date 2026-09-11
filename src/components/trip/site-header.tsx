import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { LanguageSelect } from "@/components/trip/language-select";
import { useI18n } from "@/lib/i18n/i18n-context";

export function SiteHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Compass className="size-5" />
          </span>
          <span className="font-display text-lg tracking-tight text-foreground">TripCraft</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              to="/planner"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-4"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {t("nav.planner")}
            </Link>
            <Link
              to="/itinerary"
              className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-4"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {t("nav.itinerary")}
            </Link>
          </nav>
          <LanguageSelect />
        </div>
      </div>
    </header>
  );
}
