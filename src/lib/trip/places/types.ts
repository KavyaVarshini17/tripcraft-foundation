/**
 * Place data contracts.
 *
 * The itinerary engine only ever talks to a `PlacesProvider`. The current
 * implementation is a curated, verified real-place dataset; it can later be
 * replaced by a Google Places / Google Routes backed provider without any
 * change to the engine or UI.
 */

import type { InterestTag } from "../types";

export interface PlaceRecord {
  id: string;
  name: string;
  /** Real, postal-formatted address. */
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  categories: InterestTag[];
  /** Local opening time, HH:mm (24h). */
  openingTime: string;
  /** Local closing time, HH:mm (24h). */
  closingTime: string;
  /** Recommended time on site, in minutes. */
  recommendedDurationMinutes: number;
  /** Estimated entry cost per person, in INR. 0 means free. */
  estimatedEntryCostInr: number;
  googleMapsUrl: string;
  /** Short factual note used in the itinerary UI. */
  note?: string;
}

export interface PlacesQuery {
  destination: string;
  interests: InterestTag[];
}

export interface PlacesProvider {
  /** Returns the destinations this provider can currently serve. */
  listDestinations(): string[];
  /** Returns every known place for a destination (interest filtering is done by the engine). */
  search(query: PlacesQuery): PlaceRecord[];
  /** Best-effort lookup of a user-typed must-visit place. */
  matchByName(destination: string, name: string): PlaceRecord | null;
}
