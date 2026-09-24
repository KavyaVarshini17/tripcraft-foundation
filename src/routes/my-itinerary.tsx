import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  Coins,
  Hospital,
  MapPin,
  Navigation,
  Phone,
  Route as RouteIcon,
  Siren,
  Shield,
  Flame,
  Sparkles,
  Timer,
  Utensils,
} from "lucide-react";

import { SiteHeader } from "@/components/trip/site-header";
import { useI18n, type Translate } from "@/lib/i18n/i18n-context";
import {
  translateCategory,
  translateDynamic,
  translateNote,
  translatePlaceName,
  translateTravelMode,
} from "@/lib/i18n/dynamic";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { loadGeneratedResult } from "@/lib/trip/itinerary-api";
import type { GeneratedItinerary, ItineraryDay, ItineraryItem } from "@/lib/trip/itinerary/types";
import type { ItineraryResult } from "@/lib/trip/itinerary/types";
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

const minutesLabel = (minutes: number, t: Translate) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return t("units.min", { count: m });
  return m === 0 ? t("units.hr", { count: h }) : t("units.hrMin", { hours: h, minutes: m });
};

function MyItineraryPage() {
  const { plan, hydrated } = useTripPlan();
  const { t } = useI18n();
  const [result, setResult] = useState<ItineraryResult | null | undefined>(undefined);

  useEffect(() => {
    if (!hydrated) return;
    setResult(loadGeneratedResult());
  }, [hydrated]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        {!hydrated || result === undefined ? (
          <div className="h-64 animate-pulse rounded-3xl border border-border bg-card" />
        ) : result === null ? (
          <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Sparkles className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl tracking-tight text-foreground">
              {t("itin.noneTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("itin.noneBody")}
            </p>
            <Link
              to="/itinerary"
              className="mt-7 inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {t("itin.goSummary")}
            </Link>
          </section>
        ) : !result.ok ? (
          <section className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <AlertTriangle className="size-5" />
            </span>
            <h1 className="mt-5 font-display text-2xl tracking-tight text-foreground">
              {translateDynamic(t, result.reason)}
            </h1>
            <ul className="mx-auto mt-3 max-w-md space-y-2 text-sm text-muted-foreground">
              {result.details.map((detail) => (
                <li key={detail}>{translateDynamic(t, detail)}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/itinerary"
                className="inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t("itin.tryAgain")}
              </Link>
              <Link
                to="/planner"
                className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {t("itin.adjust")}
              </Link>
            </div>
          </section>
        ) : (
          <ItineraryView
            itinerary={result.itinerary}
            interests={INTEREST_OPTIONS.filter((i) => plan.interests.includes(i.value)).map((i) =>
              t(`interest.${i.value}`),
            )}
          />
        )}
      </main>
    </div>
  );
}

function ItineraryView(props: { itinerary: GeneratedItinerary; interests: string[] }) {
  const { itinerary, interests } = props;
  const { t } = useI18n();

  const totalStops = itinerary.days.reduce((sum, day) => sum + day.items.filter((i) => i.kind === "place").length, 0);
  const totalTravelMinutes = itinerary.days.reduce((s, day) => s + day.totalTravelMinutes, 0);
  const dayCount = itinerary.days.length;

  return (
    <>
      <header className="rounded-3xl bg-primary px-7 py-10 text-primary-foreground shadow-lift sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
          {t("itin.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{itinerary.destination}</h1>
        <p className="mt-3 text-sm font-semibold text-primary-foreground/80">
          {dayCount > 1 ? t("itin.daysCount", { count: dayCount }) : t("itin.dayCount", { count: dayCount })} ·{" "}
          {t("itin.stops", { count: totalStops })} ·{" "}
          {itinerary.travelers > 1
            ? t("itin.travelersCount", { count: itinerary.travelers })
            : t("itin.travelerCount", { count: itinerary.travelers })}
          {itinerary.startingLocation
            ? ` · ${t("itin.fromLocation", { location: itinerary.startingLocation })}`
            : ""}
        </p>
        {interests.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-primary-foreground/70">
            {t("itin.builtAround", { interests: interests.join(" · ") })}
          </p>
        ) : null}
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Coins className="size-4" />}
          label={t("itin.statCost")}
          value={inr(itinerary.totalCostInr)}
          hint={t("itin.statCostHint")}
        />
        <StatCard
          icon={<RouteIcon className="size-4" />}
          label={t("itin.statDistance")}
          value={`${itinerary.totalDistanceKm} km`}
          hint={t("itin.statDistanceHint")}
        />
        <StatCard
          icon={<Timer className="size-4" />}
          label={t("itin.statTransit")}
          value={minutesLabel(totalTravelMinutes, t)}
          hint={t("itin.statTransitHint")}
        />
      </section>

      {itinerary.warnings.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-border bg-secondary/60 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-4" />
            {t("itin.warningsTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {itinerary.warnings.map((w) => (
              <li key={w}>{translateDynamic(t, w)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 space-y-8">
        {itinerary.days.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>

      {itinerary.unscheduled.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">{t("itin.unscheduledTitle")}</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {itinerary.unscheduled.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-foreground">{translatePlaceName(t, item.name)}</span>
                <span className="block text-muted-foreground">{translateDynamic(t, item.reason)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <EmergencyAssistance destination={itinerary.destination} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/planner"
          className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          {t("itin.editDetails")}
        </Link>
        <Link
          to="/itinerary"
          className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          {t("itin.backSummary")}
        </Link>
      </div>
    </>
  );
}

function DayCard({ day }: { day: ItineraryDay }) {
  const { t, language } = useI18n();
  const stops = day.items.filter((i) => i.kind === "place");

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("itin.day", { number: day.dayNumber })}
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight text-foreground">
            {formatDate(day.date, language)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("itin.startsEnds", { start: day.startLocation, end: day.endLocation })}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">{inr(day.totalCostInr)}</p>
          <p>
            {day.totalDistanceKm} km · {minutesLabel(day.totalTravelMinutes, t)} {t("itin.travel")}
          </p>
        </div>
      </div>

      {day.items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {day.notes[0] ? translateDynamic(t, day.notes[0]) : t("itin.emptyDay")}
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
            {t("itin.returnLeg", {
              place: day.endLocation,
              km: day.returnLeg.distanceKm,
              time: minutesLabel(day.returnLeg.travelMinutes, t),
              mode: translateTravelMode(t, day.returnLeg.mode),
            })}
          </span>
        </div>
      ) : null}

      {day.notes.length > 0 && day.items.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {day.notes.map((note) => (
            <li key={note}>{translateDynamic(t, note)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TimelineRow({ item, isLast }: { item: ItineraryItem; isLast: boolean }) {
  const { t } = useI18n();

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
              {translateDynamic(t, item.label)}
            </span>
            <span className="text-xs text-muted-foreground">
              {minutesLabel(item.durationMinutes, t)} · {inr(item.costInr)}
            </span>
          </div>
        ) : (
          <div className="mt-1 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg tracking-tight text-foreground">{translatePlaceName(t, item.place.name)}</h3>

                  {item.isMustVisit && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      ⭐ {t("itin.mustVisit")}
                    </span>
                  )}
                </div>
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
                {t("itin.getDirections")}
              </a>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {item.place.categories.map((category) => (
                <li
                  key={category}
                  className="rounded-full bg-secondary px-3 py-1 text-[0.7rem] font-medium capitalize text-secondary-foreground"
                >
                  {translateCategory(t, category)}
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Detail icon={<Clock className="size-3.5" />} label={t("itin.detail.visit")}>
                {minutesLabel(item.durationMinutes, t)}
              </Detail>
              <Detail icon={<Coins className="size-3.5" />} label={t("itin.detail.entry")}>
                {item.entryFeeKnown
                  ? item.costInr === 0
                    ? t("itin.free")
                    : inr(item.costInr)
                  : t("itin.feeUnavailable")}
              </Detail>
              <Detail icon={<RouteIcon className="size-3.5" />} label={t("itin.detail.distance")}>
                {item.travelFromPrevious?.distanceKm ?? 0} km
              </Detail>
              <Detail icon={<Timer className="size-3.5" />} label={t("itin.detail.travel")}>
                {minutesLabel(item.travelFromPrevious?.travelMinutes ?? 0, t)}
              </Detail>
            </dl>

            <p className="mt-3 text-[0.7rem] text-muted-foreground">
              {item.travelFromPrevious?.fromLabel
                ? `${translateDynamic(t, item.travelFromPrevious.fromLabel)} · `
                : ""}
              {item.place.openingTime && item.place.closingTime
                ? `${item.place.openingTime} – ${item.place.closingTime}`
                : t("itin.hoursUnavailable")}
              {item.place.note ? ` · ${translateNote(t, item.place.note)}` : ""}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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

function EmergencyAssistance({ destination }: { destination: string }) {
  const { t } = useI18n();
  const hospitalQuery = encodeURIComponent(`hospitals near ${destination}`);
  const actions = [
    {
      icon: <Siren className="size-4" />,
      label: t("emergency.ambulance"),
      sub: t("emergency.call", { number: "108" }),
      href: "tel:108",
      accent: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      icon: <Shield className="size-4" />,
      label: t("emergency.police"),
      sub: t("emergency.call", { number: "112" }),
      href: "tel:112",
      accent: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      icon: <Flame className="size-4" />,
      label: t("emergency.fire"),
      sub: t("emergency.call", { number: "112" }),
      href: "tel:112",
      accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      icon: <Hospital className="size-4" />,
      label: t("emergency.hospitals"),
      sub: t("emergency.openMaps"),
      href: `https://www.google.com/maps/search/?api=1&query=${hospitalQuery}`,
      accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      external: true,
    },
  ];

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertTriangle className="size-4" />
        </span>
        <h2 className="font-display text-lg tracking-tight text-foreground">{t("emergency.title")}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("emergency.body")}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const isExternal = action.external ?? false;
          const className =
            "group flex flex-col items-start gap-2 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-secondary";
          return isExternal ? (
            <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
              <span className={`flex size-8 items-center justify-center rounded-xl ${action.accent}`}>
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.sub}</span>
            </a>
          ) : (
            <a key={action.label} href={action.href} className={className}>
              <span className={`flex size-8 items-center justify-center rounded-xl ${action.accent}`}>
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-foreground">{action.label}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                <Phone className="size-3" />
                {action.sub}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
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
