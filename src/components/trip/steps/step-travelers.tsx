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
import { COMPANION_OPTIONS, CURRENCY_OPTIONS, type CompanionType } from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepTravelers({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const t = plan.travelersAndBudget;

  return (
    <div className="space-y-7">
      <StepHeading
        title="Who's travelling, and what's the budget?"
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
        <Field label="Total budget" htmlFor="totalBudget" error={errors.totalBudget}>
          <div className="flex gap-2">
            <Select
              value={t.currency}
              onValueChange={(currency) => updateSection("travelersAndBudget", { currency })}
            >
              <SelectTrigger className="w-28" aria-label="Currency">
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
            <Input
              id="totalBudget"
              inputMode="numeric"
              placeholder="50000"
              className="flex-1"
              value={t.totalBudget}
              onChange={(e) =>
                updateSection("travelersAndBudget", {
                  totalBudget: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
            />
          </div>
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
    </div>
  );
}
