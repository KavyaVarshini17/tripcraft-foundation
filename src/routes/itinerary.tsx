import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarRange, Loader2, MapPin, Sparkles, Users, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/trip/site-header";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { generateItineraryRemote, saveGeneratedResult } from "@/lib/trip/itinerary-api";
import { INTEREST_OPTIONS } from "@/lib/trip/types";
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
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<{ reason: string; details: string[] } | null>(
    null,
  );

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError(null);
    const result = await generateItineraryRemote(plan);
    saveGeneratedResult(result);
    setGenerating(false);
    if (result.ok) {
      navigate({ to: "/my-itinerary" });
    } else {
      setGenerateError({ reason: result.reason, details: result.details });
    }
  };

  const { destinationDetails: d, travelersAndBudget: traveler } = plan;
  const days = tripDurationDays(d.startDate, d.endDate);
  const hasPlan = Boolean(d.destination);
  const companion = traveler.companionType
    ? t(`companion.${traveler.companionType}`)
    : "";
  const interestLabels = INTEREST_OPTIONS.filter((i) => plan.interests.includes(i.value)).map((i) =>
    t(`interest.${i.value}`),
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
              {t("summary.emptyTitle")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("summary.emptyBody")}
            </p>
            <Link
              to="/planner"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              {t("summary.startPlanning")}
            </Link>
          </div>
        ) : (
          <>
            <header className="rounded-3xl bg-primary px-7 py-10 text-primary-foreground shadow-lift sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                {t("summary.eyebrow")}
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-5xl">
                {d.destination}
              </h1>
              <p className="mt-3 text-sm text-primary-foreground/80">
                {t("summary.from", { location: d.startingLocation || "—" })}
                {days
                  ? ` · ${days > 1 ? t("summary.days", { count: days }) : t("summary.day", { count: days })}`
                  : ""}
              </p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<MapPin className="size-4" />}
                label={t("summary.destination")}
                value={d.destination}
              />
              <SummaryCard
                icon={<CalendarRange className="size-4" />}
                label={t("summary.dates")}
                value={`${formatDate(d.startDate, language)} – ${formatDate(d.endDate, language)}`}
              />
              <SummaryCard
                icon={<Users className="size-4" />}
                label={t("summary.travelers")}
                value={`${traveler.travelers}${companion ? ` · ${companion}` : ""}`}
              />
              <SummaryCard
                icon={<Wallet className="size-4" />}
                label={t("summary.budget")}
                value={
                  traveler.totalBudget
                    ? `${traveler.currency} ${traveler.totalBudget}`
                    : t("summary.notSet")
                }
              />
            </section>

            {interestLabels.length > 0 && (
              <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-sm font-semibold text-foreground">{t("summary.interests")}</h2>
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
                {generating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
              </span>
              <h2 className="mt-5 font-display text-2xl tracking-tight text-foreground">
                {generating ? t("summary.generatingTitle") : t("summary.readyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {generating ? t("summary.generatingBody") : t("summary.readyBody")}
              </p>
              {generateError && (
                <div className="mx-auto mt-5 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <AlertTriangle className="size-4 text-destructive" />
                    {generateError.reason}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {generateError.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button className="rounded-full px-6" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {generating ? t("summary.generating") : t("summary.generate")}
                </Button>
                <Link
                  to="/planner"
                  className="inline-flex items-center rounded-full border border-input px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {t("summary.editDetails")}
                </Link>
              </div>
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
