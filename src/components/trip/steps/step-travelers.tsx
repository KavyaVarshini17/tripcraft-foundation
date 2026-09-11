import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useI18n } from "@/lib/i18n/i18n-context";
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
  const { t } = useI18n();
  const traveler = plan.travelersAndBudget;

  const toggleAgeGroup = (value: AgeGroup) => {
    const ageGroups = (traveler.ageGroups ?? []).includes(value)
      ? (traveler.ageGroups ?? []).filter((g) => g !== value)
      : [...(traveler.ageGroups ?? []), value];
    updateSection("travelersAndBudget", { ageGroups });
  };

  return (
    <div className="space-y-7">
      <StepHeading title={t("step2.title")} description={t("step2.desc")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("field.travelers")} htmlFor="travelers" error={errors.travelers}>
          <Input
            id="travelers"
            type="number"
            min={1}
            value={traveler.travelers}
            onChange={(e) =>
              updateSection("travelersAndBudget", { travelers: Number(e.target.value) })
            }
          />
        </Field>
        <Field label={t("field.currency")} error={errors.currency}>
          <Select
            value={traveler.currency}
            onValueChange={(currency) => updateSection("travelersAndBudget", { currency })}
          >
            <SelectTrigger aria-label={t("field.currency")}>
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

      <Field label={t("field.travelingWith")} error={errors.companionType}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COMPANION_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`companion.${option.value}`)}
              selected={traveler.companionType === option.value}
              onClick={() =>
                updateSection("travelersAndBudget", {
                  companionType: option.value as CompanionType,
                })
              }
            />
          ))}
        </div>
      </Field>

      <Field label={t("field.ageGroup")} error={errors.ageGroups} hint={t("hint.selectAll")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGE_GROUP_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`age.${option.value}`)}
              selected={(traveler.ageGroups ?? []).includes(option.value)}
              onClick={() => toggleAgeGroup(option.value)}
            />
          ))}
        </div>
      </Field>

      <Field
        label={t("field.totalBudget")}
        htmlFor="totalBudget"
        error={errors.totalBudget}
        hint={t("hint.totalBudget")}
      >
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-muted-foreground">
            {CURRENCY_SYMBOLS[traveler.currency] ?? traveler.currency}
          </span>
          <Input
            id="totalBudget"
            inputMode="numeric"
            placeholder="50000"
            className="pl-10"
            value={traveler.totalBudget}
            onChange={(e) =>
              updateSection("travelersAndBudget", {
                totalBudget: e.target.value.replace(/[^\d.]/g, ""),
              })
            }
          />
        </div>
      </Field>

      <Field label={t("field.budgetFlexibility")} error={errors.budgetFlexibility}>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUDGET_FLEXIBILITY_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`flex.${option.value}`)}
              hint={t(`flex.${option.value}.hint`)}
              selected={traveler.budgetFlexibility === option.value}
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
