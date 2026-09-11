import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { INTEREST_OPTIONS, type InterestTag } from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepInterests({ errors }: { errors: StepErrors }) {
  const { plan, updatePlan } = useTripPlan();
  const { t } = useI18n();

  const toggle = (value: InterestTag) => {
    const next = plan.interests.includes(value)
      ? plan.interests.filter((i) => i !== value)
      : [...plan.interests, value];
    updatePlan({ interests: next });
  };

  return (
    <div className="space-y-7">
      <StepHeading title={t("step3.title")} description={t("step3.desc")} />
      <Field label={t("field.interests")} error={errors.interests}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {INTEREST_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`interest.${option.value}`)}
              selected={plan.interests.includes(option.value)}
              onClick={() => toggle(option.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
