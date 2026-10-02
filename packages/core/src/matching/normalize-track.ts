import { normalizeText } from "./normalize";

const VERSION_PATTERNS = [
  /\bremaster(?:ed)?(?:\s+\d{4})?\b/gi,
  /\bradio edit\b/gi,
  /\bdeluxe(?: edition)?\b/gi,
  /\bexplicit\b/gi,
];

export function normalizeTrackTitle(title: string): string {
  let normalized = title;

  for (const pattern of VERSION_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  normalized = normalized
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "");

  return normalizeText(normalized);
}