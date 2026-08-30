import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { INTEREST_OPTIONS, type InterestTag } from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepInterests({ errors }: { errors: StepErrors }) {
  const { plan, updatePlan } = useTripPlan();

  const toggle = (value: InterestTag) => {
    const next = plan.interests.includes(value)
      ? plan.interests.filter((i) => i !== value)
      : [...plan.interests, value];
    updatePlan({ interests: next });
  };

  return (
    <div className="space-y-7">
      <StepHeading
        title="What do you want to spend time on?"
        description="Choose as many as you like — this drives the character of each day."
      />
      <Field label="Interests" error={errors.interests}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {INTEREST_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              selected={plan.interests.includes(option.value)}
              onClick={() => toggle(option.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
