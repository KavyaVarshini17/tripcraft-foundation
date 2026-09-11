/**
 * Resolver for translatable strings that travel inside itinerary data.
 *
 * Data-layer code (never UI) encodes a translatable string as
 * `@key|name=value|...` with URI-encoded values. The UI resolves it at render
 * time so language switches apply instantly. Anything that is not a token —
 * backend copy, place names, addresses — is returned untouched.
 */

import { en, type TranslationKey } from "./translations";
import type { Translate, TranslateVars } from "./i18n-context";

export function dynKey(key: TranslationKey, vars?: TranslateVars): string {
  const parts = Object.entries(vars ?? {}).map(
    ([name, value]) => `${name}=${encodeURIComponent(String(value))}`,
  );
  return [`@${key}`, ...parts].join("|");
}

const isKnownKey = (key: string): key is TranslationKey => key in en;

export function translateDynamic(t: Translate, value: string): string {
  if (!value.startsWith("@")) return value;
  const [head = "", ...rest] = value.slice(1).split("|");
  if (!isKnownKey(head)) return value.slice(1);
  const vars: TranslateVars = {};
  for (const part of rest) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    vars[part.slice(0, index)] = translateDynamic(t, decodeURIComponent(part.slice(index + 1)));
  }
  return t(head, vars);
}

/** Translates a known place category slug; unknown values are shown as-is. */
export function translateCategory(t: Translate, category: string): string {
  const slug = category.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const key = `category.${slug}`;
  if (isKnownKey(key)) return t(key);
  return category.replace(/_/g, " ");
}

/** Translates a routing mode label (TRANSFER, DRIVING, ...) for display. */
export function translateTravelMode(t: Translate, mode: string): string {
  const slug = mode.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const key = `travelmode.${slug}`;
  if (isKnownKey(key)) return t(key);
  return mode.toLowerCase();
}

/**
 * Translates only recognised English UI wrappers around a place name
 * (e.g. "On the Way: X"). The place name itself is never translated.
 */
export function translatePlaceName(t: Translate, name: string): string {
  const match = /^\s*on the way\s*[:\-–]\s*(.+)$/i.exec(name);
  if (match) return t("place.onTheWay", { name: match[1]!.trim() });
  return name;
}

const KNOWN_NOTES: Array<[RegExp, TranslationKey]> = [
  [/personalized en-?route stop selected by tripcraft/i, "note.enrouteStop"],
];

/** Translates recognised backend explanatory notes; unknown notes pass through. */
export function translateNote(t: Translate, note: string): string {
  if (note.startsWith("@")) return translateDynamic(t, note);
  for (const [pattern, key] of KNOWN_NOTES) {
    if (pattern.test(note)) return t(key);
  }
  return note;
}
