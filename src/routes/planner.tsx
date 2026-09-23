import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/trip/site-header";
import { StepDestination } from "@/components/trip/steps/step-destination";
import { StepTravelers } from "@/components/trip/steps/step-travelers";
import { StepInterests } from "@/components/trip/steps/step-interests";
import { StepStyle } from "@/components/trip/steps/step-style";
import { StepDaily } from "@/components/trip/steps/step-daily";
import { StepMustVisit } from "@/components/trip/steps/step-must-visit";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { validateStep, type StepErrorKeys, type StepErrors } from "@/lib/trip/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Trip Planner — TripCraft" },
      {
        name: "description",
        content:
          "Set your destination, dates, travelers, budget, interests, travel style and daily preferences in six guided steps.",
      },
      { property: "og:title", content: "Trip Planner — TripCraft" },
      {
        property: "og:description",
        content: "Six guided steps to capture everything your personalized itinerary needs.",
      },
    ],
  }),
  component: PlannerPage,
});

const STEP_KEYS: TranslationKey[] = [
  "planner.step.destination",
  "planner.step.travelers",
  "planner.step.interests",
  "planner.step.style",
  "planner.step.daily",
  "planner.step.mustVisit",
];

function PlannerPage() {
  const [step, setStep] = useState(0);
  const [errorKeys, setErrorKeys] = useState<StepErrorKeys>({});
  const { plan } = useTripPlan();
  const { t } = useI18n();
  const navigate = useNavigate();

  const isLast = step === STEP_KEYS.length - 1;

  const errors: StepErrors = Object.fromEntries(
    Object.entries(errorKeys).map(([field, key]) => [field, t(key)]),
  );

  const goNext = () => {
    const found = validateStep(step, plan);
    setErrorKeys(found);
    if (Object.keys(found).length > 0) return;
    if (isLast) {
      navigate({ to: "/itinerary" });
      return;
    }
    setStep((s) => s + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrorKeys({});
    setStep((s) => Math.max(0, s - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("planner.progress", { current: step + 1, total: STEP_KEYS.length })}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {t("planner.title")}
          </h1>

          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }}
            />
          </div>

          <ol className="mt-4 flex gap-2 overflow-x-auto pb-2 text-xs sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:overflow-visible sm:pb-0">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setErrorKeys({});
                    setStep(index);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    index === step
                      ? "text-foreground"
                      : index < step
                        ? "text-primary hover:text-primary/80"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {index < step ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="text-[0.7rem]">{index + 1}.</span>
                  )}
                  {t(key)}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div
          key={step}
          className="rounded-3xl border border-border bg-card p-6 shadow-soft duration-300 animate-in fade-in slide-in-from-bottom-2 sm:p-9"
        >
          {step === 0 && <StepDestination errors={errors} />}
          {step === 1 && <StepTravelers errors={errors} />}
          {step === 2 && <StepInterests errors={errors} />}
          {step === 3 && <StepStyle errors={errors} />}
          {step === 4 && <StepDaily errors={errors} />}
          {step === 5 && <StepMustVisit />}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={goBack} disabled={step === 0} className="rounded-full">
            <ArrowLeft className="size-4" />
            {t("common.back")}
          </Button>
          <Button onClick={goNext} className="rounded-full px-6">
            {isLast ? t("common.reviewTrip") : t("common.next")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
