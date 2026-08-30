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
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { validateStep, type StepErrors } from "@/lib/trip/validation";
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

const STEPS = [
  "Destination",
  "Travelers & Budget",
  "Interests",
  "Travel Style",
  "Daily Preferences",
  "Must Visit",
];

function PlannerPage() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const { plan } = useTripPlan();
  const navigate = useNavigate();

  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    const found = validateStep(step, plan);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (isLast) {
      navigate({ to: "/itinerary" });
      return;
    }
    setStep((s) => s + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Plan your trip
          </h1>

          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-1.5 font-medium",
                  index === step
                    ? "text-foreground"
                    : index < step
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {index < step ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="text-[0.7rem]">{index + 1}.</span>
                )}
                {label}
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
            Back
          </Button>
          <Button onClick={goNext} className="rounded-full px-6">
            {isLast ? "Review trip" : "Next"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
