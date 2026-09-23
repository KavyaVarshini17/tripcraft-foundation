import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Sparkles, Route as RouteIcon, Wallet } from "lucide-react";

import heroImage from "@/assets/hero-travel.jpg";
import { SiteHeader } from "@/components/trip/site-header";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { TranslationKey } from "@/lib/i18n/translations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripCraft — AI Personalized Travel Itineraries" },
      {
        name: "description",
        content:
          "TripCraft turns your destination, budget and interests into a personalized day-by-day travel itinerary. Start planning in minutes.",
      },
      { property: "og:title", content: "TripCraft — AI Personalized Travel Itineraries" },
      {
        property: "og:description",
        content:
          "Plan a trip shaped around your pace, budget and interests with TripCraft's personalized itinerary planner.",
      },
    ],
  }),
  component: Index,
});

const highlights: { icon: typeof Sparkles; title: TranslationKey; body: TranslationKey }[] = [
  { icon: Sparkles, title: "home.f1.title", body: "home.f1.body" },
  { icon: CalendarRange, title: "home.f2.title", body: "home.f2.body" },
  { icon: Wallet, title: "home.f3.title", body: "home.f3.body" },
  { icon: RouteIcon, title: "home.f4.title", body: "home.f4.body" },
];

function Index() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Aerial view of a coastal road winding along turquoise sea cliffs at golden hour"
              width={1920}
              height={1280}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.17_0.05_255_/_0.9)] via-[oklch(0.17_0.05_255_/_0.6)] to-transparent" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/25 bg-hero-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-hero-foreground backdrop-blur">
                <Sparkles className="size-3.5" />
                {t("home.badge")}
              </span>
              <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight text-hero-foreground sm:text-6xl">
                {t("home.title")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-hero-foreground/85 sm:text-lg">
                {t("home.subtitle")}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/planner"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent-warm px-7 py-3.5 text-sm font-semibold text-accent-warm-foreground shadow-lift transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t("home.ctaPrimary")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/itinerary"
                  className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/30 px-7 py-3.5 text-sm font-semibold text-hero-foreground backdrop-blur transition-colors hover:bg-hero-foreground/10"
                >
                  {t("home.ctaSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              {t("home.featuresTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("home.featuresSubtitle")}</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">{t(item.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(item.body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div className="overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-center shadow-lift sm:px-16">
            <h2 className="font-display text-3xl tracking-tight text-primary-foreground sm:text-4xl">
              {t("home.finalTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/80 sm:text-base">
              {t("home.finalBody")}
            </p>
            <Link
              to="/planner"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-warm px-7 py-3.5 text-sm font-semibold text-accent-warm-foreground transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t("home.ctaPrimary")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-muted-foreground">{t("home.footer")}</p>
      </footer>
    </div>
  );
}
