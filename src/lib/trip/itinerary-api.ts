/**
 * Client for the deployed Supabase `generate-itinerary` Edge Function.
 *
 * This module maps the shared TripPlan onto the API contract, POSTs it, and
 * normalizes whatever the function returns into the app's existing
 * `GeneratedItinerary` shape — so the itinerary UI needs no changes and no
 * places are ever invented on the frontend.
 */

import type { TripPlan } from "./types";
import type {
  GeneratedItinerary,
  ItineraryDay,
  ItineraryItem,
  ItineraryResult,
  TravelLeg,
} from "./itinerary/types";
import type { PlaceRecord } from "./places/types";
import type { InterestTag } from "./types";

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
  transportation: string[];
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
    transportation: plan.travelStyle.transport,
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
    return {
      ok: false,
      reason: "Itinerary generation failed",
      details: [
        typeof body === "object" && body !== null && "error" in body
          ? String((body as { error: unknown }).error)
          : `The service responded with status ${response.status}.`,
        "Please adjust your trip details or try again in a moment.",
      ],
    };
  }

  return normalizeResponse(body, plan);
}

/* ------------------------- response normalization ------------------------- */

type AnyRecord = Record<string, unknown>;

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

const asTime = (value: unknown, fallback: string): string => {
  const s = asString(value);
  return /^\d{1,2}:\d{2}/.test(s) ? s.slice(0, 5).padStart(5, "0") : fallback;
};

function normalizePlace(raw: unknown, index: number, city: string): PlaceRecord | null {
  const r = asRecord(raw);
  if (!r) return null;
  const name = asString(r.name ?? r.place_name ?? r.title);
  if (!name) return null;
  const lat = asNumber(r.latitude ?? r.lat, Number.NaN);
  const lng = asNumber(r.longitude ?? r.lng ?? r.lon, Number.NaN);
  const mapsUrl =
    asString(r.google_maps_url ?? r.googleMapsUrl ?? r.maps_url ?? r.map_url) ||
    (Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`);
  return {
    id: asString(r.id, `api-place-${index}`),
    name,
    address: asString(r.address ?? r.formatted_address, city),
    city,
    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,
    categories: asCategories(r.categories ?? r.category),
    openingTime: asTime(r.opening_time ?? r.openingTime ?? r.opens, "09:00"),
    closingTime: asTime(r.closing_time ?? r.closingTime ?? r.closes, "18:00"),
    recommendedDurationMinutes: asNumber(
      r.recommended_duration_minutes ?? r.visit_duration ?? r.duration_minutes ?? r.duration,
      90,
    ),
    estimatedEntryCostInr: asNumber(
      r.estimated_entry_cost_inr ?? r.entry_fee ?? r.entry_cost ?? r.cost,
      0,
    ),
    googleMapsUrl: mapsUrl,
    note: r.note != null ? asString(r.note) : undefined,
  };
}

function normalizeLeg(raw: unknown, fromLabel: string): TravelLeg {
  const r = asRecord(raw) ?? {};
  return {
    fromLabel: asString(r.from ?? r.from_label, fromLabel),
    distanceKm: asNumber(r.distance_km ?? r.distanceKm, 0),
    travelMinutes: asNumber(r.travel_minutes ?? r.travel_time_minutes ?? r.travelMinutes, 0),
    mode: asString(r.mode, "TRANSFER"),
  };
}

function normalizeItem(raw: unknown, index: number, city: string): ItineraryItem | null {
  const r = asRecord(raw);
  if (!r) return null;
  const kind = asString(r.kind ?? r.type).toLowerCase();
  const startTime = asTime(r.start_time ?? r.startTime, "09:00");
  const endTime = asTime(r.end_time ?? r.endTime, startTime);

  if (kind === "break" || kind === "meal") {
    return {
      kind: "break",
      id: asString(r.id, `api-break-${index}`),
      label: asString(r.label ?? r.name, "Meal break"),
      startTime,
      endTime,
      durationMinutes: asNumber(r.duration_minutes ?? r.duration, 60),
      costInr: asNumber(r.cost_inr ?? r.cost, 0),
    };
  }

  const place = normalizePlace(r.place ?? r, index, city);
  if (!place) return null;
  const previous = asString(r.previous_place ?? r.from, "Previous stop");
  return {
    kind: "place",
    id: asString(r.id, `api-stop-${index}`),
    place,
    startTime,
    endTime,
    durationMinutes: asNumber(
      r.duration_minutes ?? r.visit_duration ?? r.duration,
      place.recommendedDurationMinutes,
    ),
    costInr: asNumber(r.cost_inr ?? r.entry_fee ?? r.cost, place.estimatedEntryCostInr),
    travelFromPrevious: normalizeLeg(r.travel_from_previous ?? r.travel, previous),
  };
}

function normalizeDay(raw: unknown, index: number, city: string): ItineraryDay | null {
  const r = asRecord(raw);
  if (!r) return null;
  const itemsRaw = Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.activities)
      ? r.activities
      : Array.isArray(r.stops)
        ? r.stops
        : [];
  const items = itemsRaw
    .map((item, i) => normalizeItem(item, i, city))
    .filter((i): i is ItineraryItem => i !== null);

  const totalCost = asNumber(
    r.total_cost_inr ?? r.total_cost,
    items.reduce((s, i) => s + i.costInr, 0),
  );
  const totalDistance = asNumber(r.total_distance_km ?? r.total_distance, 0);
  const totalTravel = asNumber(r.total_travel_minutes ?? r.total_travel_time, 0);

  return {
    dayNumber: asNumber(r.day_number ?? r.dayNumber, index + 1),
    date: asString(r.date, ""),
    startLocation: asString(r.start_location ?? r.startLocation, city),
    endLocation: asString(r.end_location ?? r.endLocation, city),
    items,
    returnLeg: normalizeLeg(r.return_leg ?? r.returnLeg, asString(r.end_location, city)),
    totalCostInr: totalCost,
    totalDistanceKm: totalDistance,
    totalTravelMinutes: totalTravel,
    notes: asStringArray(r.notes),
  };
}

function normalizeResponse(body: unknown, plan: TripPlan): ItineraryResult {
  const root = asRecord(body);
  // Accept either { itinerary: {...} } or the itinerary object at top level.
  const itineraryRaw = asRecord(root?.itinerary) ?? root;
  if (!itineraryRaw) {
    return {
      ok: false,
      reason: "No itinerary came back from the service",
      details: ["The service returned an empty response. Please try again."],
    };
  }

  const city = asString(itineraryRaw.destination, plan.destinationDetails.destination);
  const daysRaw = Array.isArray(itineraryRaw.days) ? itineraryRaw.days : [];
  const days = daysRaw
    .map((d, i) => normalizeDay(d, i, city))
    .filter((d): d is ItineraryDay => d !== null);

  const totalStops = days.reduce(
    (s, d) => s + d.items.filter((i) => i.kind === "place").length,
    0,
  );

  if (days.length === 0 || totalStops === 0) {
    const message =
      asString(itineraryRaw.message) ||
      asString(itineraryRaw.error) ||
      asString(root?.message);
    return {
      ok: false,
      reason: "No verified places available for this trip",
      details: [
        message ||
          "The service couldn't find verified real places matching your destination, dates and preferences.",
        "Try a different destination, wider interests, or a longer trip.",
      ],
    };
  }

  const unscheduledRaw = Array.isArray(itineraryRaw.unscheduled) ? itineraryRaw.unscheduled : [];
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
      itineraryRaw.starting_location ?? itineraryRaw.startingLocation,
      plan.destinationDetails.startingLocation,
    ),
    days,
    totalCostInr: asNumber(
      itineraryRaw.total_cost_inr ?? itineraryRaw.total_cost,
      days.reduce((s, d) => s + d.totalCostInr, 0),
    ),
    totalDistanceKm: asNumber(
      itineraryRaw.total_distance_km ?? itineraryRaw.total_distance,
      days.reduce((s, d) => s + d.totalDistanceKm, 0),
    ),
    travelers: asNumber(itineraryRaw.travelers, plan.travelersAndBudget.travelers),
    unscheduled,
    warnings: asStringArray(itineraryRaw.warnings),
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
