import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, StepHeading } from "@/components/trip/field";
import { useTripPlan } from "@/lib/trip/trip-plan-context";

export function StepMustVisit() {
  const { plan, updateSection } = useTripPlan();
  const [draft, setDraft] = useState("");
  const places = plan.mustVisit.places;

  const addPlace = () => {
    const name = draft.trim();
    if (!name) return;
    updateSection("mustVisit", {
      places: [...places, { id: `${Date.now()}-${places.length}`, name }],
    });
    setDraft("");
  };

  const removePlace = (id: string) => {
    updateSection("mustVisit", { places: places.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-7">
      <StepHeading
        title="Anything you must not miss?"
        description="Add specific places you already know you want in the plan."
      />

      <Field label="Must-visit places" hint="Optional — add as many as you like.">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Amber Fort"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlace();
              }
            }}
          />
          <Button type="button" onClick={addPlace} disabled={!draft.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </Field>

      {places.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {places.map((place) => (
            <li
              key={place.id}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
            >
              {place.name}
              <button
                type="button"
                aria-label={`Remove ${place.name}`}
                onClick={() => removePlace(place.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No must-visit places added yet.
        </p>
      )}

      <Field label="Additional notes" htmlFor="additionalNotes" hint="Optional.">
        <Textarea
          id="additionalNotes"
          rows={4}
          placeholder="Anything else that should shape the trip"
          value={plan.mustVisit.additionalNotes}
          onChange={(e) => updateSection("mustVisit", { additionalNotes: e.target.value })}
        />
      </Field>
    </div>
  );
}
