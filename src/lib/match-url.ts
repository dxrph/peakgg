/**
 * Centralised builder for match deep-links. Returns null when the id is
 * missing/invalid so callers can render a disabled state instead of a broken
 * `/matches/undefined` or `/matches/null` URL.
 */
export const INVALID_MATCH_ID_TOKENS = new Set([
  "undefined",
  "null",
  "",
  "NaN",
]);

export function isValidMatchId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (INVALID_MATCH_ID_TOKENS.has(trimmed)) return false;
  return true;
}

export function buildMatchUrl(id: unknown): string | null {
  if (!isValidMatchId(id)) return null;
  return `/matches/${id}`;
}

export function buildBroadcastMatchUrl(id: unknown): string | null {
  if (!isValidMatchId(id)) return null;
  return `/broadcast/matches/${id}`;
}

export function buildTournamentMatchUrl(
  slug: string | null | undefined,
  id: unknown,
): string | null {
  if (!slug || !isValidMatchId(id)) return null;
  return `/tournaments/${slug}/matches/${id}`;
}

/**
 * Sanitises an arbitrary URL (e.g. from notifications). Strips links that
 * resolve to /matches/undefined or /matches/null.
 */
export function sanitizeMatchUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/^\/matches\/([^/?#]+)/);
  if (match && !isValidMatchId(match[1])) return null;
  return url;
}

