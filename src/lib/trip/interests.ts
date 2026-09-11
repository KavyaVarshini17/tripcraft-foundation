/**
 * Interest matching with aliases.
 *
 * Providers (local dataset today, Google Places later) label places with
 * varying vocabularies. This matcher maps a user-selected interest onto the
 * words a provider is likely to use, and checks both the place's categories
 * and its free text (name / note / description).
 */

export const INTEREST_ALIASES: Record<string, string[]> = {
  food: ["food", "restaurant", "cafe", "catering", "cuisine", "dining", "street food"],
  nightlife: ["nightlife", "nightclub", "night club", "bar", "pub", "lounge", "entertainment"],
  shopping: ["shopping", "mall", "market", "bazaar", "bazar", "retail", "store", "emporium"],
  adventure: [
    "adventure",
    "amusement",
    "water_park",
    "water park",
    "theme_park",
    "theme park",
    "rafting",
    "trekking",
    "trek",
    "hiking",
    "waterfall",
    "outdoor",
    "zipline",
    "kayak",
  ],
  history: ["history", "historic", "heritage", "fort", "palace", "monument", "ruins", "museum"],
  culture: ["culture", "cultural", "traditional", "folk", "craft"],
  nature: ["nature", "park", "garden", "lake", "hill", "wildlife", "sanctuary", "forest"],
  beaches: ["beach", "beaches", "shore", "coast", "seaside"],
  spiritual: ["spiritual", "temple", "church", "mosque", "shrine", "ashram", "gurudwara"],
  art: ["art", "gallery", "artisan", "sculpture", "mural"],
  photography: ["photography", "viewpoint", "scenic", "sunset point"],
  family: ["family", "kids", "children", "zoo", "aquarium", "playground"],
};

const normalize = (value: unknown): string => String(value ?? "").toLowerCase().trim();

export const aliasesFor = (interest: string): string[] => {
  const key = normalize(interest);
  return INTEREST_ALIASES[key] ?? (key ? [key] : []);
};

export interface MatchablePlace {
  name?: string;
  note?: string;
  description?: string;
  categories?: readonly unknown[];
}

/** True when the place matches at least one of the selected interests. */
export function placeMatchesInterests(
  place: MatchablePlace | null | undefined,
  interests: readonly string[] | null | undefined,
): boolean {
  return interestMatchCount(place, interests) > 0;
}

/** Number of distinct selected interests the place satisfies. */
export function interestMatchCount(
  place: MatchablePlace | null | undefined,
  interests: readonly string[] | null | undefined,
): number {
  if (!place || !interests || interests.length === 0) return 0;

  const categories = (place.categories ?? []).map(normalize).filter(Boolean);
  const text = [place.name, place.note, place.description].map(normalize).join(" ");

  let matches = 0;
  for (const interest of interests) {
    const aliases = aliasesFor(interest);
    const hit = aliases.some(
      (alias) =>
        categories.some((c) => c === alias || c.includes(alias) || alias.includes(c)) ||
        (text.length > 0 && text.includes(alias)),
    );
    if (hit) matches += 1;
  }
  return matches;
}
