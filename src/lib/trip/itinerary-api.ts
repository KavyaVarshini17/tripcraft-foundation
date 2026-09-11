/**
 * Client for the deployed Supabase `generate-itinerary` Edge Function.
 *
 * Maps the shared TripPlan onto the API contract, POSTs it, and normalizes
 * the response into the app's existing `GeneratedItinerary` shape — so the
 * itinerary UI needs no changes and no places are ever invented here.
 */

import type { TripPlan, InterestTag } from "./types";
import { todayIsoDate } from "./validation";
import { placeMatchesInterests } from "./interests";
import { dynKey } from "../i18n/dynamic";
import type { GeneratedItinerary, ItineraryDay, ItineraryItem, ItineraryResult, TravelLeg } from "./itinerary/types";
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
  /** How the traveller reaches the destination: road | train | bus | flight. */
  travel_mode: string;
  /** Only true for road journeys: allow relevant, verified stops en route. */
  include_enroute_stops: boolean;
  /** Plain-language journey context for the generation logic. */
  journey_context: string;
  /** UI language for generated user-facing text only: en | te | hi. */
  language: SupportedLanguage;
}

export type SupportedLanguage = "en" | "te" | "hi";

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "te", "hi"];

function normalizeLanguage(language?: string): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

const INTERCITY_LABEL: Record<string, string> = {
  road: "road trip by car",
  train: "train",
  bus: "bus",
  flight: "flight",
};

export function buildPayload(plan: TripPlan, language?: string): GenerateItineraryPayload {
  const d = plan.destinationDetails;
  const t = plan.travelersAndBudget;
  const origin = (d.startingLocation || "").trim();
  const mode = plan.travelStyle.intercityTransport || "";
  const byRoad = mode === "road";
  const modeLabel = INTERCITY_LABEL[mode] ?? "";

  const journeyContext = origin
    ? modeLabel
      ? `Traveling from ${origin} to ${d.destination} by ${modeLabel}.${
          byRoad
            ? " Day 1 may include worthwhile verified attractions along the route from the starting location, only when they are relevant and do not make the journey inefficient. Never repeat a place."
            : " The traveller arrives directly in the destination city, so do not add stops between the two cities."
        }`
      : `Traveling from ${origin} to ${d.destination}.`
    : "";

  return {
    destination: d.destination,
    starting_location: origin,
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
    travel_mode: mode,
    include_enroute_stops: byRoad,
    journey_context: journeyContext,
    language: normalizeLanguage(language),
  };
}

export async function generateItineraryRemote(
  plan: TripPlan,
  language?: string,
): Promise<ItineraryResult> {
  const d = plan.destinationDetails;
  if (!d.startDate || !d.endDate) {
    return {
      ok: false,
      reason: dynKey("dyn.datesMissing"),
      details: [dynKey("dyn.datesMissingBody")],
    };
  }
  if (d.endDate < d.startDate) {
    return {
      ok: false,
      reason: dynKey("dyn.datesInvalid"),
      details: [dynKey("dyn.datesInvalidBody")],
    };
  }
  if (d.startDate < todayIsoDate()) {
    return {
      ok: false,
      reason: dynKey("dyn.datesPast"),
      details: [dynKey("dyn.datesPastBody")],
    };
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(plan, language)),
    });
  } catch {
    return {
      ok: false,
      reason: dynKey("dyn.unreachable"),
      details: [
        dynKey("dyn.unreachableBody1"),
        dynKey("dyn.unreachableBody2"),
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
      reason: dynKey("dyn.failed"),
      details: [
        asString(err?.error, `The service responded with status ${response.status}.`),
        asString(err?.details) || dynKey("dyn.failedBody"),
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
    .map((v) =>
      asString(v)
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_"),
    )
    .filter(Boolean);
  const matched = normalized.filter((c): c is InterestTag => KNOWN_INTERESTS.includes(c as InterestTag));
  return matched.length > 0 ? matched : ["culture"];
};

/** Adds `count` calendar days to an ISO yyyy-mm-dd date. */
const addDaysIso = (iso: string, count: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + count);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Accepts "HH:mm" or "HH:mm:ss". */
const asTime = (value: unknown, fallback = ""): string => {
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
  const noteValue = raw.description != null || raw.note != null ? asString(raw.note ?? raw.description) : null;
  return {
    id: asString(raw.place_id ?? raw.id, `api-place-${index}`),
    name,
    address: asString(raw.address ?? raw.formatted_address, city),
    city,
    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,
    categories: asCategories(raw.category ?? raw.categories),
    openingTime: asTime(raw.opening_time ?? raw.openingTime ?? raw.opens, ""),
    closingTime: asTime(raw.closing_time ?? raw.closingTime ?? raw.closes, ""),
    recommendedDurationMinutes: asNumber(
      raw.visit_duration_minutes ?? raw.recommended_duration_minutes ?? raw.duration,
      90,
    ),
    estimatedEntryCostInr: asNumber(raw.entry_fee ?? raw.entry_cost ?? raw.cost, 0),
    googleMapsUrl: mapsUrl,
    ...(noteValue ? { note: noteValue } : {}),
  };
}

function normalizeItem(raw: unknown, index: number, dayIndex: number, city: string): ItineraryItem | null {
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
      label: asString(r.name ?? r.label, dynKey("dyn.mealBreak")),
      startTime,
      endTime,
      durationMinutes: duration,
      costInr: asNumber(r.cost_inr ?? r.cost, 0),
    };
  }

  const place = normalizePlace(r, index, city);
  if (!place) return null;
  const travel: TravelLeg = {
    fromLabel: asString(r.previous_place ?? r.from, dynKey("dyn.previousStop")),
    distanceKm: asNumber(r.distance_from_previous_km ?? r.distance_km, 0),
    travelMinutes: asNumber(r.travel_time_from_previous_minutes ?? r.travel_minutes, 0),
    mode: asString(r.mode, "TRANSFER"),
  };
  return {
    kind: "place",
    id,
    place,
    startTime,
    endTime,
    durationMinutes: duration || place.recommendedDurationMinutes,
    costInr: r.entry_fee_known === true && r.entry_fee !== null && r.entry_fee !== undefined ? Number(r.entry_fee) : 0,
    entryFeeKnown: r.entry_fee_known === true,

    // Preserve backend Must Visit priority in the frontend.
    isMustVisit: r.is_must_visit === true,

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
  const items: ItineraryItem[] = (itemsRaw as unknown[])
    .map((item: unknown, i: number) => normalizeItem(item, i, index, city))
    .filter((i: ItineraryItem | null): i is ItineraryItem => i !== null);

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
      items.reduce((s: number, i: ItineraryItem) => s + i.costInr, 0),
    ),
    totalDistanceKm: asNumber(r.estimated_distance_km ?? r.total_distance_km ?? r.total_distance, 0),
    totalTravelMinutes: asNumber(
      r.total_travel_minutes,
      items.reduce(
        (s: number, i: ItineraryItem) => s + (i.kind === "place" ? (i.travelFromPrevious?.travelMinutes ?? 0) : 0),
        0,
      ),
    ),
    notes: asStringArray(r.notes),
  };
}

const minutesFromTime = (time: string): number => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const placeCount = (day: ItineraryDay): number => day.items.filter((item) => item.kind === "place").length;

function itemFitsDay(item: ItineraryItem, existingItems: ItineraryItem[], plan: TripPlan): boolean {
  const start = minutesFromTime(item.startTime);
  const end = minutesFromTime(item.endTime);
  const preferredStart = minutesFromTime(plan.dailyPreferences.startTime || "00:00");
  const preferredEnd = minutesFromTime(plan.dailyPreferences.endTime || "23:59");

  if (start < preferredStart || end > preferredEnd || end <= start) return false;
  if (item.kind === "place") {
    const openingKnown = Boolean(item.place.openingTime);
    const closingKnown = Boolean(item.place.closingTime);

    if (openingKnown && start < minutesFromTime(item.place.openingTime)) {
      return false;
    }

    if (closingKnown && end > minutesFromTime(item.place.closingTime)) {
      return false;
    }
  }

  return existingItems.every((existing) => {
    const existingStart = minutesFromTime(existing.startTime);
    const existingEnd = minutesFromTime(existing.endTime);
    return end <= existingStart || start >= existingEnd;
  });
}

function recalculateDay(day: ItineraryDay): ItineraryDay {
  return {
    ...day,
    items: day.items.slice().sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime)),
    totalCostInr: day.items.reduce((sum, item) => sum + item.costInr, 0),
    totalDistanceKm:
      Math.round(
        day.items.reduce((sum, item) => sum + (item.kind === "place" ? (item.travelFromPrevious?.distanceKm ?? 0) : 0), 0) * 10,
      ) / 10,
    totalTravelMinutes: day.items.reduce(
      (sum, item) => sum + (item.kind === "place" ? (item.travelFromPrevious?.travelMinutes ?? 0) : 0),
      0,
    ),
  };
}

/**
 * The service can return the full date range while greedily exhausting its
 * verified-place pool in the first few days. When there are enough unique,
 * already-verified places for every requested day, move one compatible stop
 * at a time from overfilled days into empty days. Places are never cloned and
 * their service-provided times, opening-hours checks and travel data remain
 * unchanged.
 */
const matchesInterests = (item: ItineraryItem, interests: string[]): boolean =>
  item.kind === "place" && placeMatchesInterests(item.place, interests);

function rebalanceSparseDays(days: ItineraryDay[], plan: TripPlan): ItineraryDay[] {
  const emptyIndexes = days.map((day, index) => (placeCount(day) === 0 ? index : -1)).filter((index) => index >= 0);
  if (emptyIndexes.length === 0) return days;

  const placeIds = days.flatMap((day) =>
    day.items.filter((item) => item.kind === "place").map((item) => item.place.id),
  );
  if (placeIds.length < days.length || new Set(placeIds).size !== placeIds.length) return days;

  const interests = plan.interests ?? [];
  const balanced = days.map((day) => ({ ...day, items: day.items.slice() }));

  for (const targetIndex of emptyIndexes) {
    const target = balanced[targetIndex];
    if (!target) return days;

    const donors = balanced
      .map((day, index) => ({ index, count: placeCount(day) }))
      .filter(({ count }) => count > 1)
      .sort((a, b) => b.count - a.count || a.index - b.index);

    let moved = false;
    // Two passes: fill the empty day with an interest-matching place first, and
    // only fall back to a non-matching place when no matching one can move.
    for (const preferMatching of [true, false]) {
      for (const donor of donors) {
        const source = balanced[donor.index];
        if (!source) continue;

        const donorMatching = source.items.filter((i) => matchesInterests(i, interests)).length;

        for (let itemIndex = source.items.length - 1; itemIndex >= 0; itemIndex -= 1) {
          const candidate = source.items[itemIndex];
          if (!candidate || candidate.kind !== "place") continue;
          const candidateMatches = matchesInterests(candidate, interests);
          if (candidateMatches !== preferMatching) continue;
          // Never strip a donor day of its last personalized stop just to fill
          // another day with it — matching places are not displaced by fallback.
          if (
            candidateMatches &&
            donorMatching <= 1 &&
            source.items.some((i) => !matchesInterests(i, interests) && i.kind === "place")
          ) {
            continue;
          }
          if (!itemFitsDay(candidate, target.items, plan)) continue;

          source.items.splice(itemIndex, 1);
          target.items.push(candidate);
          moved = true;
          break;
        }
        if (moved) break;
      }
      if (moved) break;
    }

    // Never return a partially rebalanced itinerary when a target date cannot
    // safely accept one of the verified stops.
    if (!moved) return days;
  }

  return balanced.map(recalculateDay);
}

/**
 * A road journey can legitimately surface en-route stops, so guard against the
 * same verified place appearing twice across the trip.
 */
function dedupePlaces(days: ItineraryDay[]): ItineraryDay[] {
  const seen = new Set<string>();
  return days.map((day) => ({
    ...day,
    items: day.items.filter((item) => {
      if (item.kind !== "place") return true;
      const key = (item.place.id || item.place.name).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  }));
}

function normalizeResponse(body: unknown, plan: TripPlan): ItineraryResult {
  const root = asRecord(body);
  if (!root) {
    return {
      ok: false,
      reason: dynKey("dyn.emptyResponse"),
      details: [dynKey("dyn.emptyResponseBody")],
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
  const parsedDays = daysRaw
    .map((d: unknown, i: number) => normalizeDay(d, i, city))
    .filter((d: ItineraryDay | null): d is ItineraryDay => d !== null);

  // One itinerary day per calendar day, start date through end date inclusive:
  // index days onto the user's actual date range so the result always matches
  // the selected trip duration, never a fixed count.
  const { startDate, endDate } = plan.destinationDetails;
  const spanDays =
    startDate && endDate && endDate >= startDate
      ? Math.round(
          (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86_400_000,
        ) + 1
      : parsedDays.length;
  const alignedDays = parsedDays.slice(0, spanDays).map((day: ItineraryDay, i: number) => ({
    ...day,
    dayNumber: i + 1,
    date: startDate ? addDaysIso(startDate, i) : day.date,
  }));
  const balancedDays = rebalanceSparseDays(dedupePlaces(alignedDays), plan);

  // Anchor the trip to the traveller's real starting point and arrival mode.
  const origin = (plan.destinationDetails.startingLocation || "").trim();
  const arrivalMode = plan.travelStyle.intercityTransport || "";
  const days: ItineraryDay[] = origin
    ? balancedDays.map((day, i) =>
        i === 0
          ? {
              ...day,
              startLocation: origin,
              items: day.items.map((item, index) =>
                index === 0 && item.kind === "place"
                  ? {
                      ...item,
                      travelFromPrevious: {
                        distanceKm: item.travelFromPrevious?.distanceKm ?? 0,
                        travelMinutes: item.travelFromPrevious?.travelMinutes ?? 0,
                        mode: item.travelFromPrevious?.mode ?? "",
                        fromLabel: origin,
                      },
                    }
                  : item,
              ),
            }
          : day,
      )
    : balancedDays;

  const totalStops = (days as ItineraryDay[]).reduce(
    (s: number, d: ItineraryDay) => s + d.items.filter((i: ItineraryItem) => i.kind === "place").length,
    0,
  );

  if (days.length === 0 || totalStops === 0) {
    return {
      ok: false,
      reason: dynKey("dyn.noPlaces"),
      details: [
        asString(root.message) ||
          asString(root.error) ||
          dynKey("dyn.noPlacesBody1"),
        dynKey("dyn.noPlacesBody2"),
      ],
    };
  }

  const unscheduledRaw = Array.isArray(root.unscheduled) ? root.unscheduled : [];
  const unscheduled = unscheduledRaw
    .map((u: unknown) => {
      const r = asRecord(u);
      if (!r) return null;
      const name = asString(r.name);
      return name ? { name, reason: asString(r.reason, dynKey("dyn.unscheduled")) } : null;
    })
    .filter((u: { name: string; reason: string } | null): u is { name: string; reason: string } => u !== null);

  const itinerary: GeneratedItinerary = {
    destination: city,
    startingLocation: origin || asString(root.starting_location ?? root.startingLocation, ""),
    days,
    totalCostInr: asNumber(
      root.total_estimated_cost ?? root.total_cost_inr ?? root.total_cost,
      days.reduce((s: number, d: ItineraryDay) => s + d.totalCostInr, 0),
    ),
    totalDistanceKm: asNumber(
      root.total_distance_km ?? root.total_distance,
      Math.round(days.reduce((s: number, d: ItineraryDay) => s + d.totalDistanceKm, 0) * 10) / 10,
    ),
    travelers: asNumber(root.travelers, plan.travelersAndBudget.travelers),
    unscheduled,
    warnings: [
      ...asStringArray(root.warnings),
      ...(origin && arrivalMode
        ? [
            arrivalMode === "road"
              ? dynKey("dyn.roadTrip", { origin, city })
              : dynKey("dyn.arrival", {
                  origin,
                  city,
                  mode: dynKey(
                    arrivalMode === "train"
                      ? "mode.train"
                      : arrivalMode === "bus"
                        ? "mode.bus"
                        : "mode.flight",
                  ),
                }),
          ]
        : []),
    ],
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
