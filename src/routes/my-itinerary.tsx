import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  Coins,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Timer,
  Utensils,
} from "lucide-react";

import { SiteHeader } from "@/components/trip/site-header";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { generateItinerary } from "@/lib/trip/itinerary/engine";
import type { GeneratedItinerary, ItineraryDay, ItineraryItem } from "@/lib/trip/itinerary/types";
import { INTEREST_OPTIONS } from "@/lib/trip/types";

import { formatDate } from "@/lib/trip/validation";

export const Route = createFileRoute("/my-itinerary")({
  head: () => ({
    meta: [
      { title: "Your Day-by-Day Itinerary — TripCraft" },
      {
        name: "description",
        content:
          "A chronological, hour-by-hour TripCraft itinerary built from verified real places, your interests, pace, budget and daily timings.",
      },
      { property: "og:title", content: "Your Day-by-Day Itinerary — TripCraft" },
      {
        property: "og:description",
        content: "Every stop, timing, cost and travel leg of your personalized trip.",
      },
    ],
  }),
  component: MyItineraryPage,
});

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const minutesLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

function MyItineraryPage() {
  const { plan, hydrated } = useTripPlan();
  const result = useMemo(() => (hydrated ? generateItinerary(plan) : null), [plan, hydrated]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        {!hydrated || !result ? (
          <div className="h-64 animate-pulse rounded-3xl border border-border bg-card" />
        ) : !result.ok ? (
          <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <AlertTriangle className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl tracking-tight text-foreground">
              {result.reason}
            </h1>
            <ul className="mx-auto mt-3 max-w-md space-y-2 text-sm text-muted-foreground">
              {result.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <Link
              to="/planner"
              className="mt-7 inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Adjust trip details
            </Link>
          </section>
        ) : (
          <ItineraryView
            itinerary={result.itinerary}
            currency={plan.travelersAndBudget.currency}
            interests={INTEREST_OPTIONS.filter((i) => plan.interests.includes(i.value)).map(
              (i) => i.label,
            )}
          />
        )}
      </main>
    </div>
  );
}

function ItineraryView(props: {
  itinerary: GeneratedItinerary;
  currency: string;
  interests: string[];
}) {
  const { itinerary, interests } = props;

  const totalStops = itinerary.days.reduce(
    (sum, day) => sum + day.items.filter((i) => i.kind === "place").length,
    0,
  );
  const totalTravelMinutes = itinerary.days.reduce((s, day) => s + day.totalTravelMinutes, 0);

  return (
    <>
      <header className="rounded-3xl bg-primary px-7 py-10 text-primary-foreground shadow-lift sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
          Your itinerary
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-5xl">
          {itinerary.destination}
        </h1>
        <p className="mt-3 text-sm text-primary-foreground/80">
          {itinerary.days.length} day{itinerary.days.length > 1 ? "s" : ""} · {totalStops} stops ·{" "}
          {itinerary.travelers} traveler{itinerary.travelers > 1 ? "s" : ""}
          {itinerary.startingLocation ? ` · from ${itinerary.startingLocation}` : ""}
        </p>
        {interests.length > 0 ? (
          <p className="mt-2 text-xs text-primary-foreground/70">
            Built around: {interests.join(" · ")}
          </p>
        ) : null}
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Coins className="size-4" />}
          label="Estimated trip cost"
          value={inr(itinerary.totalCostInr)}
          hint="Entries + meals, all travelers"
        />
        <StatCard
          icon={<RouteIcon className="size-4" />}
          label="Estimated distance"
          value={`${itinerary.totalDistanceKm} km`}
          hint="Across all days"
        />
        <StatCard
          icon={<Timer className="size-4" />}
          label="Time in transit"
          value={minutesLabel(totalTravelMinutes)}
          hint="Includes travel buffers"
        />
      </section>

      {itinerary.warnings.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-border bg-secondary/60 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-4" />
            Worth knowing
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {itinerary.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 space-y-8">
        {itinerary.days.map((day) => (
          <DayCard key={day.date} day={day} currency={currency} />
        ))}
      </div>

      {itinerary.unscheduled.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">Not scheduled — and why</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {itinerary.unscheduled.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="block text-muted-foreground">{item.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/planner"
          className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Edit trip details
        </Link>
        <Link
          to="/itinerary"
          className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Back to trip summary
        </Link>
      </div>
    </>
  );
}

function DayCard({ day, currency }: { day: ItineraryDay; currency: string }) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  void symbol;
  const stops = day.items.filter((i) => i.kind === "place");

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Day {day.dayNumber}
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight text-foreground">
            {formatDate(day.date)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Starts at {day.startLocation} · ends at {day.endLocation}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">{inr(day.totalCostInr)}</p>
          <p>
            {day.totalDistanceKm} km · {minutesLabel(day.totalTravelMinutes)} travel
          </p>
        </div>
      </div>

      {day.items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {day.notes[0] ?? "No verified place fits this day's constraints."}
        </p>
      ) : (
        <ol className="mt-6 space-y-0">
          {day.items.map((item, index) => (
            <TimelineRow key={item.id} item={item} isLast={index === day.items.length - 1} />
          ))}
        </ol>
      )}

      {stops.length > 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
          <Navigation className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Return to {day.endLocation} — {day.returnLeg.distanceKm} km ·{" "}
            {minutesLabel(day.returnLeg.travelMinutes)} by {day.returnLeg.mode.toLowerCase()}.
          </span>
        </div>
      ) : null}

      {day.notes.length > 0 && day.items.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {day.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TimelineRow({ item, isLast }: { item: ItineraryItem; isLast: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={
            item.kind === "place"
              ? "mt-1.5 flex size-3 shrink-0 rounded-full bg-primary ring-4 ring-primary/15"
              : "mt-1.5 flex size-3 shrink-0 rounded-full bg-muted-foreground/40 ring-4 ring-muted/40"
          }
        />
        {!isLast ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
      </div>

      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {item.startTime} – {item.endTime}
        </p>

        {item.kind === "break" ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Utensils className="size-4 text-muted-foreground" />
              {item.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {minutesLabel(item.durationMinutes)} · approx. {inr(item.costInr)}
            </span>
          </div>
        ) : (
          <div className="mt-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg tracking-tight text-foreground">
                  {item.place.name}
                </h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {item.place.address}
                </p>
              </div>
              <a
                href={item.place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Navigation className="size-3.5" />
                Get Directions
              </a>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {item.place.categories.map((category) => (
                <li
                  key={category}
                  className="rounded-full bg-secondary px-3 py-1 text-[0.7rem] font-medium capitalize text-secondary-foreground"
                >
                  {category.replace("_", " ")}
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Detail icon={<Clock className="size-3.5" />} label="Visit">
                {minutesLabel(item.durationMinutes)}
              </Detail>
              <Detail icon={<Coins className="size-3.5" />} label="Entry">
                {item.costInr === 0 ? "Free" : inr(item.costInr)}
              </Detail>
              <Detail icon={<RouteIcon className="size-3.5" />} label="Distance">
                {item.travelFromPrevious.distanceKm} km
              </Detail>
              <Detail icon={<Timer className="size-3.5" />} label="Travel">
                {minutesLabel(item.travelFromPrevious.travelMinutes)}
              </Detail>
            </dl>

            <p className="mt-3 text-[0.7rem] text-muted-foreground">
              {item.travelFromPrevious.mode} from {item.travelFromPrevious.fromLabel} · open{" "}
              {item.place.openingTime}–{item.place.closingTime}
              {item.place.note ? ` · ${item.place.note}` : ""}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </span>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
