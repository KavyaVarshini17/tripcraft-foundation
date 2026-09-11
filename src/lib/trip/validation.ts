import type { TranslationKey } from "@/lib/i18n/translations";

import type { TripPlan } from "./types";

export type StepErrorField =
  | "destination"
  | "startingLocation"
  | "startDate"
  | "endDate"
  | "travelers"
  | "companionType"
  | "ageGroups"
  | "totalBudget"
  | "currency"
  | "budgetFlexibility"
  | "interests"
  | "pace"
  | "transport"
  | "startTime"
  | "endTime"
  | "mealPreferences";

/** Errors ready for display (already translated). */
export type StepErrors = Partial<Record<StepErrorField, string>>;

/** Errors as translation keys — UI-free, translated at render time. */
export type StepErrorKeys = Partial<Record<StepErrorField, TranslationKey>>;

/** Today's date as ISO yyyy-mm-dd (local). */
export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Validates a single planner step (0-indexed). Pure, UI-free. */
export function validateStep(step: number, plan: TripPlan): StepErrorKeys {
  const errors: StepErrorKeys = {};

  if (step === 0) {
    const d = plan.destinationDetails;
    if (!d.destination.trim()) errors.destination = "validation.destination";
    if (!d.startingLocation.trim()) errors.startingLocation = "validation.startingLocation";
    if (!d.startDate) errors.startDate = "validation.startDate";
    if (!d.endDate) errors.endDate = "validation.endDate";
    if (d.startDate && d.startDate < todayIsoDate())
      errors.startDate = "validation.startDatePast";
    if (d.startDate && d.endDate && d.endDate < d.startDate)
      errors.endDate = "validation.endDateOrder";
  }

  if (step === 1) {
    const t = plan.travelersAndBudget;
    if (!t.travelers || t.travelers < 1) errors.travelers = "validation.travelers";
    if (!t.companionType) errors.companionType = "validation.companionType";
    if ((t.ageGroups ?? []).length === 0) errors.ageGroups = "validation.ageGroups";
    const budget = Number(t.totalBudget);
    if (!t.totalBudget.trim() || Number.isNaN(budget) || budget <= 0)
      errors.totalBudget = "validation.totalBudget";
    if (!t.currency) errors.currency = "validation.currency";
    if (!t.budgetFlexibility) errors.budgetFlexibility = "validation.budgetFlexibility";
  }

  if (step === 2 && plan.interests.length === 0) {
    errors.interests = "validation.interests";
  }

  if (step === 3) {
    if (!plan.travelStyle.pace) errors.pace = "validation.pace";
    if (plan.travelStyle.transport.length === 0) errors.transport = "validation.transport";
  }

  if (step === 4) {
    const p = plan.dailyPreferences;
    if (!p.startTime) errors.startTime = "validation.startTime";
    if (!p.endTime) errors.endTime = "validation.endTime";
    if (p.startTime && p.endTime && p.endTime <= p.startTime)
      errors.endTime = "validation.endTimeOrder";
    if (p.mealPreferences.length === 0) errors.mealPreferences = "validation.mealPreferences";
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

export function formatDate(iso: string, locale?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
