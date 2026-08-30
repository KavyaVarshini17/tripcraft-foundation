import type { PlaceRecord } from "../places/types";

export interface TravelLeg {
  fromLabel: string;
  distanceKm: number;
  travelMinutes: number;
  mode: string;
}

export interface ItineraryStop {
  kind: "place";
  id: string;
  place: PlaceRecord;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  /** Entry cost for the whole party, INR. */
  costInr: number;
  travelFromPrevious: TravelLeg;
}

export interface ItineraryBreak {
  kind: "break";
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  costInr: number;
}

export type ItineraryItem = ItineraryStop | ItineraryBreak;

export interface ItineraryDay {
  dayNumber: number;
  date: string; // ISO yyyy-mm-dd
  startLocation: string;
  endLocation: string;
  items: ItineraryItem[];
  /** Travel back to the day's end location. */
  returnLeg: TravelLeg;
  totalCostInr: number;
  totalDistanceKm: number;
  totalTravelMinutes: number;
  notes: string[];
}

export interface GeneratedItinerary {
  destination: string;
  startingLocation: string;
  days: ItineraryDay[];
  totalCostInr: number;
  totalDistanceKm: number;
  travelers: number;
  /** Places that could not be scheduled, with a factual reason. */
  unscheduled: { name: string; reason: string }[];
  warnings: string[];
}

export type ItineraryResult =
  | { ok: true; itinerary: GeneratedItinerary }
  | { ok: false; reason: string; details: string[] };
