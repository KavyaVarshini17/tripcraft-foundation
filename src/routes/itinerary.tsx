import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, MapPin, Sparkles, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/trip/site-header";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { COMPANION_OPTIONS, INTEREST_OPTIONS } from "@/lib/trip/types";
import { formatDate, tripDurationDays } from "@/lib/trip/validation";

export const Route = createFileRoute("/itinerary")({
  head: () => ({
    meta: [
      { title: "Your Trip Summary — TripCraft" },
      {
        name: "description",
        content:
          "Review your destination, travel dates, travelers and budget before generating your personalized TripCraft itinerary.",
      },
      { property: "og:title", content: "Your Trip Summary — TripCraft" },
      {
        property: "og:description",
        content: "Review your trip details before generating a personalized itinerary.",
      },
    ],
  }),
  component: ItineraryPage,
});

function ItineraryPage() {
  const { plan, hydrated } = useTripPlan();
  const { destinationDetails: d, travelersAndBudget: t } = plan;
  const days = tripDurationDays(d.startDate, d.endDate);
  const hasPlan = Boolean(d.destination);
  const companion = COMPANION_OPTIONS.find((c) => c.value === t.companionType)?.label;
  const interestLabels = INTEREST_OPTIONS.filter((i) => plan.interests.includes(i.value)).map(
    (i) => i.label,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        {!hydrated ? (
          <div className="h-64 animate-pulse rounded-3xl border border-border bg-card" />
        ) : !hasPlan ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
            <h1 className="font-display text-2xl tracking-tight text-foreground">
              No trip details yet
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Fill in the planner and your trip summary will appear here, ready for itinerary
              generation.
            </p>
            <Link
              to="/planner"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Start planning
            </Link>
          </div>
        ) : (
          <>
            <header className="rounded-3xl bg-primary px-7 py-10 text-primary-foreground shadow-lift sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                Your trip
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-5xl">
                {d.destination}
              </h1>
              <p className="mt-3 text-sm text-primary-foreground/80">
                From {d.startingLocation || "—"}
                {days ? ` · ${days} day${days > 1 ? "s" : ""}` : ""}
              </p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<MapPin className="size-4" />}
                label="Destination"
                value={d.destination}
              />
              <SummaryCard
                icon={<CalendarRange className="size-4" />}
                label="Dates"
                value={`${formatDate(d.startDate)} – ${formatDate(d.endDate)}`}
              />
              <SummaryCard
                icon={<Users className="size-4" />}
                label="Travelers"
                value={`${t.travelers}${companion ? ` · ${companion}` : ""}`}
              />
              <SummaryCard
                icon={<Wallet className="size-4" />}
                label="Budget"
                value={t.totalBudget ? `${t.currency} ${t.totalBudget}` : "Not set"}
              />
            </section>

            {interestLabels.length > 0 && (
              <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-sm font-semibold text-foreground">Interests</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {interestLabels.map((label) => (
                    <li
                      key={label}
                      className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Sparkles className="size-5" />
              </span>
              <h2 className="mt-5 font-display text-2xl tracking-tight text-foreground">
                Your itinerary hasn't been generated yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Once generation is available, your day-by-day plan will appear right here, built
                from the preferences you saved.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button className="rounded-full px-6" disabled>
                  <Sparkles className="size-4" />
                  Generate My Itinerary
                </Button>
                <Link
                  to="/planner"
                  className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Edit trip details
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Coming soon</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
