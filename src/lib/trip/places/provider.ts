import { PLACES_DATASET } from "./dataset";
import type { PlaceRecord, PlacesProvider, PlacesQuery } from "./types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Matches a free-text destination ("Jaipur, Rajasthan") to a dataset city. */
export function resolveDestinationCity(destination: string): string | null {
  const query = normalize(destination);
  if (!query) return null;
  const cities = Array.from(new Set(PLACES_DATASET.map((p) => p.city)));
  return (
    cities.find((city) => {
      const c = normalize(city);
      return query === c || query.includes(c) || c.includes(query);
    }) ?? null
  );
}

/**
 * Local dataset implementation of `PlacesProvider`.
 * Swapping this for a Google Places implementation requires no engine changes.
 */
export const localPlacesProvider: PlacesProvider = {
  listDestinations() {
    return Array.from(new Set(PLACES_DATASET.map((p) => p.city))).sort();
  },

  search({ destination }: PlacesQuery): PlaceRecord[] {
    const city = resolveDestinationCity(destination);
    if (!city) return [];
    return PLACES_DATASET.filter((p) => p.city === city);
  },

  matchByName(destination, name) {
    const city = resolveDestinationCity(destination);
    if (!city) return null;
    const query = normalize(name);
    if (!query) return null;
    const candidates = PLACES_DATASET.filter((p) => p.city === city);
    return (
      candidates.find((p) => normalize(p.name) === query) ??
      candidates.find((p) => normalize(p.name).includes(query) || query.includes(normalize(p.name))) ??
      null
    );
  },
};
