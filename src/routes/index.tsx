import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange, Sparkles, Route as RouteIcon, Wallet } from "lucide-react";

import heroImage from "@/assets/hero-travel.jpg";
import { SiteHeader } from "@/components/trip/site-header";

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

const highlights = [
  {
    icon: Sparkles,
    title: "Personal, not generic",
    body: "Your interests, pace and travel companions shape every suggestion.",
  },
  {
    icon: CalendarRange,
    title: "Day-by-day structure",
    body: "A clear travel window with realistic start and end times each day.",
  },
  {
    icon: Wallet,
    title: "Budget aware",
    body: "Plan around a total budget in your own currency, from INR upward.",
  },
  {
    icon: RouteIcon,
    title: "Built to route",
    body: "Structured trip data designed to plug into maps and routing later.",
  },
];

function Index() {
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
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.2_0.04_205_/_0.9)] via-[oklch(0.2_0.04_205_/_0.6)] to-transparent" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground backdrop-blur">
                <Sparkles className="size-3.5" />
                AI-powered trip design
              </span>
              <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight text-primary-foreground sm:text-6xl">
                Personalized itineraries, crafted around the way you travel.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
                Tell TripCraft where you're going, who's coming along, your budget and what you love
                doing. We shape a trip that fits your pace — not a generic tourist checklist.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/planner"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent-warm px-7 py-3.5 text-sm font-semibold text-accent-warm-foreground shadow-lift transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Plan My Trip
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/itinerary"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-white/10"
                >
                  View my itinerary
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              A planner that actually listens
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six quick steps capture everything a great itinerary needs — and nothing it doesn't.
            </p>
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
                <h3 className="mt-5 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div className="overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-center shadow-lift sm:px-16">
            <h2 className="font-display text-3xl tracking-tight text-primary-foreground sm:text-4xl">
              Ready when you are
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/80 sm:text-base">
              Start with your destination and dates. You can come back and refine everything before
              generating your itinerary.
            </p>
            <Link
              to="/planner"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-warm px-7 py-3.5 text-sm font-semibold text-accent-warm-foreground transition-transform duration-200 hover:-translate-y-0.5"
            >
              Plan My Trip
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-muted-foreground">
          TripCraft — personalized travel planning.
        </p>
      </footer>
    </div>
  );
}
