/**
 * Client for the deployed Supabase `generate-itinerary` Edge Function.
 *
 * Maps the shared TripPlan onto the API contract, POSTs it, and normalizes
 * the response into the app's existing `GeneratedItinerary` shape — so the
 * itinerary UI needs no changes and no places are ever invented here.
 */

import type { TripPlan, InterestTag } from "./types";
import type {
  GeneratedItinerary,
  ItineraryDay,
  ItineraryItem,
  ItineraryResult,
  TravelLeg,
} from "./itinerary/types";
import type { PlaceRecord } from "./places/types";

const ENDPOINT = "https://razzdhjvordllglpwtxn.supabase.co/functions/v1/generate-itinerary";

const RESULT_STORAGE_KEY = "tripcraft.generated-itinerary.v1";

export interface GenerateItineraryPayload {
  destination: string;
  starting_location: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  interests: string[];
  travel_style: string;
  transportation: string;
  preferred_start_time: string;
  preferred_end_time: string;
  must_visit: string[];
}

export function buildPayload(plan: TripPlan): GenerateItineraryPayload {
  const d = plan.destinationDetails;
  const t = plan.travelersAndBudget;
  return {
    destination: d.destination,
    starting_location: d.startingLocation,
    start_date: d.startDate,
    end_date: d.endDate,
    travelers: t.travelers,
    budget: Number(t.totalBudget) || 0,
    interests: plan.interests,
    travel_style: plan.travelStyle.pace,
    transportation: plan.travelStyle.transport.join(", "),
    preferred_start_time: plan.dailyPreferences.startTime,
    preferred_end_time: plan.dailyPreferences.endTime,
    must_visit: plan.mustVisit.places.map((p) => p.name),
  };
}

export async function generateItineraryRemote(plan: TripPlan): Promise<ItineraryResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(plan)),
    });
  } catch {
    return {
      ok: false,
      reason: "We couldn't reach the itinerary service",
      details: [
        "Check your internet connection and try again.",
        "If the problem continues, the itinerary service may be temporarily unavailable.",
      ],
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const err = asRecord(body);
    return {
      ok: false,
      reason: "Itinerary generation failed",
      details: [
        asString(err?.error, `The service responded with status ${response.status}.`),
        asString(err?.details) || "Please adjust your trip details or try again in a moment.",
      ].filter(Boolean),
    };
  }

  return normalizeResponse(body, plan);
}

/* ------------------------- response normalization ------------------------- */

// The Edge Function's response shape is external and flexible, so we treat
// parsed records as `any` here and narrow with the as* helpers below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any;

const asRecord = (value: unknown): AnyRecord | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : value == null ? fallback : String(value);

const asNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => asString(v)).filter(Boolean) : [];

const KNOWN_INTERESTS: InterestTag[] = [
  "history",
  "culture",
  "nature",
  "beaches",
  "adventure",
  "food",
  "shopping",
  "spiritual",
  "art",
  "nightlife",
  "photography",
  "family",
];

const asCategories = (value: unknown): InterestTag[] => {
  const raw = Array.isArray(value) ? value : value != null ? [value] : [];
  const normalized = raw
    .map((v) => asString(v).toLowerCase().trim().replace(/[\s-]+/g, "_"))
    .filter(Boolean);
  const matched = normalized.filter((c): c is InterestTag =>
    KNOWN_INTERESTS.includes(c as InterestTag),
  );
  return matched.length > 0 ? matched : ["culture"];
};

/** Accepts "HH:mm" or "HH:mm:ss". */
const asTime = (value: unknown, fallback: string): string => {
  const s = asString(value);
  return /^\d{1,2}:\d{2}/.test(s) ? s.slice(0, 5).padStart(5, "0") : fallback;
};

function normalizePlace(raw: AnyRecord, index: number, city: string): PlaceRecord | null {
  const name = asString(raw.name ?? raw.place_name ?? raw.title);
  if (!name) return null;
  const lat = asNumber(raw.latitude ?? raw.lat, Number.NaN);
  const lng = asNumber(raw.longitude ?? raw.lng ?? raw.lon, Number.NaN);
  const mapsUrl =
    asString(raw.maps_url ?? raw.google_maps_url ?? raw.googleMapsUrl) ||
    (Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`);
  return {
    id: asString(raw.place_id ?? raw.id, `api-place-${index}`),
    name,
    address: asString(raw.address ?? raw.formatted_address, city),
    city,
    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,
    categories: asCategories(raw.category ?? raw.categories),
    openingTime: asTime(raw.opening_time ?? raw.openingTime ?? raw.opens, "09:00"),
    closingTime: asTime(raw.closing_time ?? raw.closingTime ?? raw.closes, "18:00"),
    recommendedDurationMinutes: asNumber(
      raw.visit_duration_minutes ?? raw.recommended_duration_minutes ?? raw.duration,
      90,
    ),
    estimatedEntryCostInr: asNumber(raw.entry_fee ?? raw.entry_cost ?? raw.cost, 0),
    googleMapsUrl: mapsUrl,
    note:
      raw.description != null || raw.note != null
        ? asString(raw.note ?? raw.description)
        : undefined,
  };
}

function normalizeItem(
  raw: unknown,
  index: number,
  dayIndex: number,
  city: string,
): ItineraryItem | null {
  const r = asRecord(raw);
  if (!r) return null;
  const kind = asString(r.type ?? r.kind).toLowerCase();
  const startTime = asTime(r.start_time ?? r.startTime, "09:00");
  const endTime = asTime(r.end_time ?? r.endTime, startTime);
  const duration = asNumber(r.visit_duration_minutes ?? r.duration_minutes ?? r.duration, 60);
  const id = asString(r.id, `api-${dayIndex}-${index}`);

  if (kind === "meal" || kind === "break") {
    return {
      kind: "break",
      id,
      label: asString(r.name ?? r.label, "Meal break"),
      startTime,
      endTime,
      durationMinutes: duration,
      costInr: asNumber(r.cost_inr ?? r.cost, 0),
    };
  }

  const place = normalizePlace(r, index, city);
  if (!place) return null;
  const travel: TravelLeg = {
    fromLabel: asString(r.previous_place ?? r.from, "Previous stop"),
    distanceKm: asNumber(r.distance_from_previous_km ?? r.distance_km, 0),
    travelMinutes: asNumber(
      r.travel_time_from_previous_minutes ?? r.travel_minutes,
      0,
    ),
    mode: asString(r.mode, "TRANSFER"),
  };
  return {
    kind: "place",
    id,
    place,
    startTime,
    endTime,
    durationMinutes: duration || place.recommendedDurationMinutes,
    costInr: asNumber(r.cost_inr ?? r.entry_fee ?? r.cost, place.estimatedEntryCostInr),
    travelFromPrevious: travel,
  };
}

function normalizeDay(raw: unknown, index: number, city: string): ItineraryDay | null {
  const r = asRecord(raw);
  if (!r) return null;
  const itemsRaw = Array.isArray(r.activities)
    ? r.activities
    : Array.isArray(r.items)
      ? r.items
      : Array.isArray(r.stops)
        ? r.stops
        : [];
  const items = itemsRaw
    .map((item, i) => normalizeItem(item, i, index, city))
    .filter((i): i is ItineraryItem => i !== null);

  return {
    dayNumber: asNumber(r.day_number ?? r.dayNumber, index + 1),
    date: asString(r.date, ""),
    startLocation: asString(r.start_location ?? r.startLocation, city),
    endLocation: asString(r.end_location ?? r.endLocation, city),
    items,
    returnLeg: {
      fromLabel: asString(r.end_location ?? r.endLocation, city),
      distanceKm: 0,
      travelMinutes: 0,
      mode: "RETURN",
    },
    totalCostInr: asNumber(
      r.estimated_cost ?? r.total_cost_inr ?? r.total_cost,
      items.reduce((s, i) => s + i.costInr, 0),
    ),
    totalDistanceKm: asNumber(r.estimated_distance_km ?? r.total_distance_km ?? r.total_distance, 0),
    totalTravelMinutes: asNumber(
      r.total_travel_minutes,
      items.reduce((s, i) => s + (i.kind === "place" ? i.travelFromPrevious.travelMinutes : 0), 0),
    ),
    notes: asStringArray(r.notes),
  };
}

function normalizeResponse(body: unknown, plan: TripPlan): ItineraryResult {
  const root = asRecord(body);
  if (!root) {
    return {
      ok: false,
      reason: "No itinerary came back from the service",
      details: ["The service returned an empty response. Please try again."],
    };
  }

  // The function returns `itinerary` as an array of days; also tolerate
  // { itinerary: { days: [...] } } or a top-level days array.
  const daysRaw = Array.isArray(root.itinerary)
    ? root.itinerary
    : Array.isArray(asRecord(root.itinerary)?.days)
      ? (asRecord(root.itinerary)!.days as unknown[])
      : Array.isArray(root.days)
        ? root.days
        : [];

  const city = asString(root.destination, plan.destinationDetails.destination);
  const days = daysRaw
    .map((d, i) => normalizeDay(d, i, city))
    .filter((d): d is ItineraryDay => d !== null);

  const totalStops = days.reduce(
    (s, d) => s + d.items.filter((i) => i.kind === "place").length,
    0,
  );

  if (days.length === 0 || totalStops === 0) {
    return {
      ok: false,
      reason: "No verified places available for this trip",
      details: [
        asString(root.message) ||
          asString(root.error) ||
          "The service couldn't find verified real places matching your destination, dates and preferences.",
        "Try a different destination, wider interests, or a longer trip.",
      ],
    };
  }

  const unscheduledRaw = Array.isArray(root.unscheduled) ? root.unscheduled : [];
  const unscheduled = unscheduledRaw
    .map((u) => {
      const r = asRecord(u);
      if (!r) return null;
      const name = asString(r.name);
      return name ? { name, reason: asString(r.reason, "Could not be scheduled.") } : null;
    })
    .filter((u): u is { name: string; reason: string } => u !== null);

  const itinerary: GeneratedItinerary = {
    destination: city,
    startingLocation: asString(
      root.starting_location ?? root.startingLocation,
      plan.destinationDetails.startingLocation,
    ),
    days,
    totalCostInr: asNumber(
      root.total_estimated_cost ?? root.total_cost_inr ?? root.total_cost,
      days.reduce((s, d) => s + d.totalCostInr, 0),
    ),
    totalDistanceKm: asNumber(
      root.total_distance_km ?? root.total_distance,
      Math.round(days.reduce((s, d) => s + d.totalDistanceKm, 0) * 10) / 10,
    ),
    travelers: asNumber(root.travelers, plan.travelersAndBudget.travelers),
    unscheduled,
    warnings: asStringArray(root.warnings),
  };

  return { ok: true, itinerary };
}

/* ------------------------------ result cache ------------------------------ */

export function saveGeneratedResult(result: ItineraryResult) {
  try {
    window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // storage unavailable — results page will show its empty state
  }
}

export function loadGeneratedResult(): ItineraryResult | null {
  try {
    const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ItineraryResult;
    return parsed && typeof parsed === "object" && "ok" in parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function clearGeneratedResult() {
  try {
    window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
