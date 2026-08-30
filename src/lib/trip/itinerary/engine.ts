/**
 * Deterministic itinerary engine.
 *
 * Pure, UI-free and provider-driven: it consumes the shared `TripPlan` object
 * plus a `PlacesProvider` and produces a chronological day-by-day plan.
 * No network calls, no invented places — if nothing real fits the constraints
 * the engine says so instead of fabricating a stop.
 */

import { localPlacesProvider, resolveDestinationCity } from "../places/provider";
import type { PlaceRecord, PlacesProvider } from "../places/types";
import type { TransportMode, TripPlan } from "../types";
import type {
  GeneratedItinerary,
  ItineraryDay,
  ItineraryItem,
  ItineraryResult,
  ItineraryStop,
  TravelLeg,
} from "./types";

// ── time helpers ────────────────────────────────────────────────────────────
const toMinutes = (hhmm: string) => {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
};

const toHHMM = (minutes: number) => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const addDays = (iso: string, count: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + count);
  return d.toISOString().slice(0, 10);
};

// ── geo helpers ─────────────────────────────────────────────────────────────
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Average door-to-door speed (km/h) per transport mode. */
const MODE_SPEED_KMH: Record<TransportMode, number> = {
  walking: 4.5,
  public_transport: 18,
  taxi: 24,
  own_vehicle: 26,
  rental_two_wheeler: 22,
  combination: 22,
};

const MODE_LABEL: Record<TransportMode, string> = {
  walking: "Walking",
  public_transport: "Public transport",
  taxi: "Taxi / cab",
  own_vehicle: "Own vehicle",
  rental_two_wheeler: "Two-wheeler",
  combination: "Mixed transport",
};

/** Buffer minutes added to every leg for parking, waiting and entry queues. */
const TRAVEL_BUFFER_MINUTES = 10;

/** Maximum sightseeing stops per day by pace. */
const PACE_CAPS = { relaxed: 3, balanced: 4, packed: 6 } as const;

const MEAL_COST_PER_PERSON = { lunch: 350, dinner: 500 } as const;

interface Coordinates {
  latitude: number;
  longitude: number;
}

function pickMode(plan: TripPlan): TransportMode {
  const selected = plan.travelStyle.transport;
  if (selected.length === 0) return "combination";
  if (selected.length > 1) return "combination";
  return selected[0] as TransportMode;
}

function buildLeg(
  from: Coordinates,
  to: Coordinates,
  fromLabel: string,
  mode: TransportMode,
): TravelLeg {
  // City road factor: straight-line distance under-reports real driving distance.
  const distanceKm = Math.round(haversineKm(from, to) * 1.3 * 10) / 10;
  const speed = MODE_SPEED_KMH[mode];
  const travelMinutes = Math.max(5, Math.round((distanceKm / speed) * 60) + TRAVEL_BUFFER_MINUTES);
  return { fromLabel, distanceKm, travelMinutes, mode: MODE_LABEL[mode] };
}

/**
 * Approximate anchor for the traveller's base each day. Without a geocoding
 * service the dataset centroid is the honest stand-in; a Google Geocoding
 * provider can replace this without touching the scheduling logic.
 */
function centroid(places: PlaceRecord[]): Coordinates {
  const lat = places.reduce((s, p) => s + p.latitude, 0) / places.length;
  const lng = places.reduce((s, p) => s + p.longitude, 0) / places.length;
  return { latitude: lat, longitude: lng };
}

export interface GenerateOptions {
  provider?: PlacesProvider;
}

export function generateItinerary(plan: TripPlan, options: GenerateOptions = {}): ItineraryResult {
  const provider = options.provider ?? localPlacesProvider;
  const details: string[] = [];
  const { destinationDetails: d, travelersAndBudget: t } = plan;

  if (!d.destination.trim() || !d.startDate || !d.endDate) {
    return {
      ok: false,
      reason: "Your trip details are incomplete.",
      details: ["Add a destination and both travel dates in the planner, then try again."],
    };
  }

  const city = resolveDestinationCity(d.destination);
  if (!city) {
    return {
      ok: false,
      reason: `We don't have verified place data for “${d.destination}” yet.`,
      details: [
        `Verified datasets currently cover: ${provider.listDestinations().join(", ")}.`,
        "Rather than invent places, the itinerary is left unbuilt until live place data is connected.",
      ],
    };
  }

  const pool = provider.search({ destination: d.destination, interests: plan.interests });
  if (pool.length === 0) {
    return {
      ok: false,
      reason: `No verified places are available for ${city}.`,
      details: ["The dataset returned no records for this destination."],
    };
  }

  const dayCount = Math.max(
    1,
    Math.round(
      (new Date(`${d.endDate}T00:00:00`).getTime() - new Date(`${d.startDate}T00:00:00`).getTime()) /
        86_400_000,
    ) + 1,
  );

  const mode = pickMode(plan);
  const travelers = Math.max(1, t.travelers || 1);
  const pace = (plan.travelStyle.pace || "balanced") as keyof typeof PACE_CAPS;
  const cap = PACE_CAPS[pace] ?? PACE_CAPS.balanced;

  const dayStart = toMinutes(plan.dailyPreferences.startTime || "09:00");
  const dayEnd = toMinutes(plan.dailyPreferences.endTime || "21:00");
  if (dayEnd - dayStart < 120) {
    return {
      ok: false,
      reason: "Your daily window is too short to schedule anything.",
      details: ["Allow at least two hours between your preferred start and end time."],
    };
  }

  // Must-visit resolution.
  const mustVisitIds = new Set<string>();
  const unscheduled: { name: string; reason: string }[] = [];
  for (const entry of plan.mustVisit.places) {
    const match = provider.matchByName(d.destination, entry.name);
    if (match) mustVisitIds.add(match.id);
    else
      unscheduled.push({
        name: entry.name,
        reason: `No verified record for this place in our ${city} dataset, so it was not scheduled.`,
      });
  }

  const interests = new Set(plan.interests);
  const score = (p: PlaceRecord) => {
    let s = 0;
    if (mustVisitIds.has(p.id)) s += 1000;
    s += p.categories.filter((c) => interests.has(c)).length * 40;
    if (p.estimatedEntryCostInr === 0) s += 5;
    return s;
  };

  // Candidates: must-visits always; otherwise interest matches, falling back to
  // the full pool when interests match nothing.
  const interestMatches = pool.filter(
    (p) => mustVisitIds.has(p.id) || p.categories.some((c) => interests.has(c)),
  );
  const candidates = (interestMatches.length > 0 ? interestMatches : pool)
    .slice()
    .sort((a, b) => score(b) - score(a));

  if (interestMatches.length === 0) {
    details.push(
      `No place in the ${city} dataset matches your selected interests, so the plan uses the city's main verified sights instead.`,
    );
  }

  const base = centroid(pool);
  const remaining = new Map(candidates.map((p) => [p.id, p] as const));
  const days: ItineraryDay[] = [];
  const rejected = new Map<string, string>();

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
    const date = addDays(d.startDate, dayIndex);
    const items: ItineraryItem[] = [];
    const notes: string[] = [];
    let clock = dayStart;
    let cursor: Coordinates = base;
    let cursorLabel = dayIndex === 0 ? d.startingLocation || "Your starting point" : "Your stay";
    let placed = 0;
    let lunchDone = false;
    let dinnerDone = false;
    let dayDistance = 0;
    let dayTravel = 0;
    let dayCost = 0;

    while (placed < cap) {
      // Lunch break around midday.
      if (!lunchDone && clock >= 13 * 60 && clock + 60 <= dayEnd) {
        const cost = MEAL_COST_PER_PERSON.lunch * travelers;
        items.push({
          kind: "break",
          id: `${date}-lunch`,
          label: "Lunch break",
          startTime: toHHMM(clock),
          endTime: toHHMM(clock + 60),
          durationMinutes: 60,
          costInr: cost,
        });
        clock += 60;
        dayCost += cost;
        lunchDone = true;
        continue;
      }

      // Pick the best next place: nearest-first with score weighting.
      let best: { place: PlaceRecord; leg: TravelLeg; arrival: number; score: number } | null = null;
      for (const place of remaining.values()) {
        const leg = buildLeg(cursor, place, cursorLabel, mode);
        const arrival = Math.max(clock + leg.travelMinutes, toMinutes(place.openingTime));
        const departure = arrival + place.recommendedDurationMinutes;
        if (arrival < clock + leg.travelMinutes) continue;
        if (departure > toMinutes(place.closingTime)) {
          rejected.set(
            place.id,
            `Closes at ${place.closingTime}; a full ${place.recommendedDurationMinutes}-minute visit no longer fits your day window.`,
          );
          continue;
        }
        if (departure > dayEnd) {
          rejected.set(
            place.id,
            `Needs ${place.recommendedDurationMinutes} minutes plus travel, which runs past your ${plan.dailyPreferences.endTime} end time.`,
          );
          continue;
        }
        const candidateScore = score(place) - leg.distanceKm * 6 - (arrival - clock) * 0.5;
        if (!best || candidateScore > best.score) best = { place, leg, arrival, score: candidateScore };
      }

      if (!best) break;

      const { place, leg, arrival } = best;
      const cost = place.estimatedEntryCostInr * travelers;
      const stop: ItineraryStop = {
        kind: "place",
        id: `${date}-${place.id}`,
        place,
        startTime: toHHMM(arrival),
        endTime: toHHMM(arrival + place.recommendedDurationMinutes),
        durationMinutes: place.recommendedDurationMinutes,
        costInr: cost,
        travelFromPrevious: leg,
      };
      items.push(stop);
      remaining.delete(place.id);
      rejected.delete(place.id);
      clock = arrival + place.recommendedDurationMinutes;
      cursor = place;
      cursorLabel = place.name;
      dayDistance += leg.distanceKm;
      dayTravel += leg.travelMinutes;
      dayCost += cost;
      placed += 1;
    }

    if (items.length === 0) {
      notes.push(
        remaining.size === 0
          ? "Every verified place in the dataset is already scheduled on an earlier day — keep this day free or extend the dataset."
          : "No verified place fits this day's opening hours and time window.",
      );
    } else if (!dinnerDone && clock + 75 <= dayEnd) {
      const cost = MEAL_COST_PER_PERSON.dinner * travelers;
      items.push({
        kind: "break",
        id: `${date}-dinner`,
        label: "Dinner break",
        startTime: toHHMM(clock),
        endTime: toHHMM(clock + 75),
        durationMinutes: 75,
        costInr: cost,
      });
      clock += 75;
      dayCost += cost;
      dinnerDone = true;
    }

    const endLabel = "Your stay";
    const returnLeg = buildLeg(cursor, base, cursorLabel, mode);
    if (items.length > 0) {
      dayDistance += returnLeg.distanceKm;
      dayTravel += returnLeg.travelMinutes;
    }

    days.push({
      dayNumber: dayIndex + 1,
      date,
      startLocation: dayIndex === 0 ? d.startingLocation || "Your starting point" : endLabel,
      endLocation: endLabel,
      items,
      returnLeg,
      totalCostInr: dayCost,
      totalDistanceKm: Math.round(dayDistance * 10) / 10,
      totalTravelMinutes: dayTravel,
      notes,
    });
  }

  for (const [id, reason] of rejected) {
    const place = remaining.get(id);
    if (place) unscheduled.push({ name: place.name, reason });
  }
  for (const place of remaining.values()) {
    if (mustVisitIds.has(place.id) && !unscheduled.some((u) => u.name === place.name)) {
      unscheduled.push({
        name: place.name,
        reason: "Your trip length and daily pace left no slot that respects its opening hours.",
      });
    }
  }

  const totalCostInr = days.reduce((s, day) => s + day.totalCostInr, 0);
  const totalDistanceKm = Math.round(days.reduce((s, day) => s + day.totalDistanceKm, 0) * 10) / 10;

  const budget = Number(t.totalBudget);
  const warnings = [...details];
  if (!Number.isNaN(budget) && budget > 0 && totalCostInr > budget) {
    warnings.push(
      `Estimated entry and meal costs (${totalCostInr.toLocaleString("en-IN")}) exceed your stated budget of ${budget.toLocaleString("en-IN")}. Costs exclude stay and transport fares.`,
    );
  }

  const itinerary: GeneratedItinerary = {
    destination: city,
    startingLocation: d.startingLocation,
    days,
    totalCostInr,
    totalDistanceKm,
    travelers,
    unscheduled,
    warnings,
  };

  return { ok: true, itinerary };
}
