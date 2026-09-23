import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, StepHeading } from "@/components/trip/field";
import { useI18n } from "@/lib/i18n/i18n-context";
import { INDIAN_TRAVEL_LOCATIONS } from "@/lib/trip/locations";
import { useTripPlan } from "@/lib/trip/trip-plan-context";
import { todayIsoDate, type StepErrors } from "@/lib/trip/validation";

export function StepDestination({ errors }: { errors: StepErrors }) {
  const { plan, updateSection } = useTripPlan();
  const { t } = useI18n();
  const d = plan.destinationDetails;

  return (
    <div className="space-y-7">
      <StepHeading title={t("step1.title")} description={t("step1.desc")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("field.destination")} htmlFor="destination" error={errors.destination}>
          <Select
            value={d.destination}
            onValueChange={(destination) => updateSection("destinationDetails", { destination })}
          >
            <SelectTrigger id="destination" className="h-9 bg-transparent">
              <SelectValue placeholder={t("ph.destination")} />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_TRAVEL_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location} disabled={location !== "Goa"}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={t("field.startingLocation")}
          htmlFor="startingLocation"
          error={errors.startingLocation}
        >
          <Select
            value={d.startingLocation}
            onValueChange={(startingLocation) =>
              updateSection("destinationDetails", { startingLocation })
            }
          >
            <SelectTrigger id="startingLocation" className="h-9 bg-transparent">
              <SelectValue placeholder={t("ph.startingLocation")} />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_TRAVEL_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location} disabled={location !== "Mumbai"}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("field.startDate")} htmlFor="startDate" error={errors.startDate}>
          <Input
            id="startDate"
            type="date"
            min={todayIsoDate()}
            value={d.startDate}
            onChange={(e) => updateSection("destinationDetails", { startDate: e.target.value })}
          />
        </Field>
        <Field label={t("field.endDate")} htmlFor="endDate" error={errors.endDate}>
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
