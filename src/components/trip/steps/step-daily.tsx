import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { MEAL_OPTIONS, type MealPreference } from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepDaily({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const p = plan.dailyPreferences;

  const toggleMeal = (value: MealPreference) => {
    const next = p.mealPreferences.includes(value)
      ? p.mealPreferences.filter((m) => m !== value)
      : [...p.mealPreferences, value];
    updateSection("dailyPreferences", { mealPreferences: next });
  };

  return (
    <div className="space-y-7">
      <StepHeading
        title="Your daily rhythm"
        description="When you like to start and wind down, plus anything we should plan around."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred start time" htmlFor="startTime" error={errors.startTime}>
          <Input
            id="startTime"
            type="time"
            value={p.startTime}
            onChange={(e) => updateSection("dailyPreferences", { startTime: e.target.value })}
          />
        </Field>
        <Field label="Preferred end time" htmlFor="endTime" error={errors.endTime}>
          <Input
            id="endTime"
            type="time"
            value={p.endTime}
            onChange={(e) => updateSection("dailyPreferences", { endTime: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Meal preferences" error={errors.mealPreferences}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEAL_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              selected={p.mealPreferences.includes(option.value)}
              onClick={() => toggleMeal(option.value)}
            />
          ))}
        </div>
      </Field>

      <Field
        label="Accessibility & other preferences"
        htmlFor="accessibilityNotes"
        hint="Optional — mobility needs, travelling with kids or elders, anything to avoid."
      >
        <Textarea
          id="accessibilityNotes"
          rows={4}
          placeholder="e.g. Minimal walking after 6pm, wheelchair-accessible venues preferred"
          value={p.accessibilityNotes}
          onChange={(e) =>
            updateSection("dailyPreferences", { accessibilityNotes: e.target.value })
          }
        />
      </Field>
    </div>
  );
}
