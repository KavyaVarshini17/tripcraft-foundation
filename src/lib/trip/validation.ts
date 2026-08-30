import type { TripPlan } from "./types";

export interface StepErrors {
  destination?: string;
  startingLocation?: string;
  startDate?: string;
  endDate?: string;
  travelers?: string;
  companionType?: string;
  totalBudget?: string;
  currency?: string;
  interests?: string;
  pace?: string;
  transport?: string;
  startTime?: string;
  endTime?: string;
  mealPreferences?: string;
}

/** Validates a single planner step (0-indexed). Pure, UI-free. */
export function validateStep(step: number, plan: TripPlan): StepErrors {
  const errors: StepErrors = {};

  if (step === 0) {
    const d = plan.destinationDetails;
    if (!d.destination.trim()) errors.destination = "Where are you going?";
    if (!d.startingLocation.trim()) errors.startingLocation = "Where are you starting from?";
    if (!d.startDate) errors.startDate = "Pick a start date.";
    if (!d.endDate) errors.endDate = "Pick an end date.";
    if (d.startDate && d.endDate && d.endDate < d.startDate)
      errors.endDate = "End date must be on or after the start date.";
  }

  if (step === 1) {
    const t = plan.travelersAndBudget;
    if (!t.travelers || t.travelers < 1) errors.travelers = "At least one traveler.";
    if (!t.companionType) errors.companionType = "Select who you're traveling with.";
    const budget = Number(t.totalBudget);
    if (!t.totalBudget.trim() || Number.isNaN(budget) || budget <= 0)
      errors.totalBudget = "Enter a valid total budget.";
    if (!t.currency) errors.currency = "Select a currency.";
  }

  if (step === 2 && plan.interests.length === 0) {
    errors.interests = "Pick at least one interest.";
  }

  if (step === 3) {
    if (!plan.travelStyle.pace) errors.pace = "Choose a travel pace.";
    if (plan.travelStyle.transport.length === 0)
      errors.transport = "Select at least one way to get around.";
  }

  if (step === 4) {
    const p = plan.dailyPreferences;
    if (!p.startTime) errors.startTime = "Set a preferred start time.";
    if (!p.endTime) errors.endTime = "Set a preferred end time.";
    if (p.startTime && p.endTime && p.endTime <= p.startTime)
      errors.endTime = "End time must be after start time.";
    if (p.mealPreferences.length === 0) errors.mealPreferences = "Pick at least one meal preference.";
  }

  return errors;
}

export function tripDurationDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diff < 0 ? null : diff + 1;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
