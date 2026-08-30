import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { PACE_OPTIONS, TRANSPORT_OPTIONS, type TransportMode } from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepStyle({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const style = plan.travelStyle;

  const toggleTransport = (value: TransportMode) => {
    const next = style.transport.includes(value)
      ? style.transport.filter((t) => t !== value)
      : [...style.transport, value];
    updateSection("travelStyle", { transport: next });
  };

  return (
    <div className="space-y-7">
      <StepHeading
        title="How should the days feel?"
        description="Set the rhythm of your trip and how you'd like to move around."
      />

      <Field label="Travel pace" error={errors.pace}>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACE_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              hint={option.hint}
              selected={style.pace === option.value}
              onClick={() => updateSection("travelStyle", { pace: option.value })}
            />
          ))}
        </div>
      </Field>

      <Field label="Transportation" error={errors.transport}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRANSPORT_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              selected={style.transport.includes(option.value)}
              onClick={() => toggleTransport(option.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
