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
