import { Input } from "@/components/ui/input";
import { Field, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import type { StepErrors } from "@/lib/trip/validation";

export function StepDestination({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const d = plan.destinationDetails;

  return (
    <div className="space-y-7">
      <StepHeading
        title="Where are you headed?"
        description="Tell us the destination and travel window so we can shape the days around it."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Destination" htmlFor="destination" error={errors.destination}>
          <Input
            id="destination"
            placeholder="e.g. Jaipur, Rajasthan"
            value={d.destination}
            onChange={(e) => updateSection("destinationDetails", { destination: e.target.value })}
          />
        </Field>
        <Field label="Starting location" htmlFor="startingLocation" error={errors.startingLocation}>
          <Input
            id="startingLocation"
            placeholder="e.g. Bengaluru"
            value={d.startingLocation}
            onChange={(e) =>
              updateSection("destinationDetails", { startingLocation: e.target.value })
            }
          />
        </Field>
        <Field label="Start date" htmlFor="startDate" error={errors.startDate}>
          <Input
            id="startDate"
            type="date"
            value={d.startDate}
            onChange={(e) => updateSection("destinationDetails", { startDate: e.target.value })}
          />
        </Field>
        <Field label="End date" htmlFor="endDate" error={errors.endDate}>
          <Input
            id="endDate"
            type="date"
            min={d.startDate || undefined}
            value={d.endDate}
            onChange={(e) => updateSection("destinationDetails", { endDate: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
