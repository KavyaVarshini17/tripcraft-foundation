import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import {
  AGE_GROUP_OPTIONS,
  BUDGET_FLEXIBILITY_OPTIONS,
  COMPANION_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  type AgeGroup,
  type BudgetFlexibility,
  type CompanionType,
} from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepTravelers({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const t = plan.travelersAndBudget;

  const toggleAgeGroup = (value: AgeGroup) => {
    const ageGroups = (t.ageGroups ?? []).includes(value)
      ? (t.ageGroups ?? []).filter((g) => g !== value)
      : [...(t.ageGroups ?? []), value];
    updateSection("travelersAndBudget", { ageGroups });
  };

  return (
    <div className="space-y-7">
      <StepHeading
        title="Who's coming along?"
        description="This shapes pacing, pricing and the kind of experiences we suggest."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Number of travelers" htmlFor="travelers" error={errors.travelers}>
          <Input
            id="travelers"
            type="number"
            min={1}
            value={t.travelers}
            onChange={(e) =>
              updateSection("travelersAndBudget", { travelers: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Currency" error={errors.currency}>
          <Select
            value={t.currency}
            onValueChange={(currency) => updateSection("travelersAndBudget", { currency })}
          >
            <SelectTrigger aria-label="Currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Traveling with" error={errors.companionType}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COMPANION_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              selected={t.companionType === option.value}
              onClick={() =>
                updateSection("travelersAndBudget", {
                  companionType: option.value as CompanionType,
                })
              }
            />
          ))}
        </div>
      </Field>

      <Field label="Age group" error={errors.ageGroups} hint="Select all that apply.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGE_GROUP_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              selected={(t.ageGroups ?? []).includes(option.value)}
              onClick={() => toggleAgeGroup(option.value)}
            />
          ))}
        </div>
      </Field>

      <Field
        label="Total trip budget"
        htmlFor="totalBudget"
        error={errors.totalBudget}
        hint="This is the total budget for the entire trip."
      >
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-muted-foreground">
            {CURRENCY_SYMBOLS[t.currency] ?? t.currency}
          </span>
          <Input
            id="totalBudget"
            inputMode="numeric"
            placeholder="50000"
            className="pl-10"
            value={t.totalBudget}
            onChange={(e) =>
              updateSection("travelersAndBudget", {
                totalBudget: e.target.value.replace(/[^\d.]/g, ""),
              })
            }
          />
        </div>
      </Field>

      <Field label="Budget flexibility" error={errors.budgetFlexibility}>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUDGET_FLEXIBILITY_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              hint={option.hint}
              selected={t.budgetFlexibility === option.value}
              onClick={() =>
                updateSection("travelersAndBudget", {
                  budgetFlexibility: option.value as BudgetFlexibility,
                })
              }
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
