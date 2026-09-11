import { Field, OptionChip, StepHeading } from "@/components/trip/field";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import {
  INTERCITY_TRANSPORT_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  type TransportMode,
} from "@/lib/trip/types";
import type { StepErrors } from "@/lib/trip/validation";

export function StepStyle({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const { t } = useI18n();
  const style = plan.travelStyle;

  const toggleTransport = (value: TransportMode) => {
    const next = style.transport.includes(value)
      ? style.transport.filter((item) => item !== value)
      : [...style.transport, value];
    updateSection("travelStyle", { transport: next });
  };

  return (
    <div className="space-y-7">
      <StepHeading title={t("step4.title")} description={t("step4.desc")} />

      <Field label={t("field.pace")} error={errors.pace}>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACE_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`pace.${option.value}`)}
              hint={t(`pace.${option.value}.hint`)}
              selected={style.pace === option.value}
              onClick={() => updateSection("travelStyle", { pace: option.value })}
            />
          ))}
        </div>
      </Field>

      <Field label={t("field.intercity")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INTERCITY_TRANSPORT_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`intercity.${option.value}`)}
              hint={t(`intercity.${option.value}.hint`)}
              selected={style.intercityTransport === option.value}
              onClick={() =>
                updateSection("travelStyle", {
                  intercityTransport:
                    style.intercityTransport === option.value ? "" : option.value,
                })
              }
            />
          ))}
        </div>
      </Field>

      <Field label={t("field.localTransport")} error={errors.transport}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TRANSPORT_OPTIONS.map((option) => (
            <OptionChip
              key={option.value}
              label={t(`transport.${option.value}`)}
              selected={style.transport.includes(option.value)}
              onClick={() => toggleTransport(option.value)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}
