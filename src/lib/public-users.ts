// Filters for hiding demo/test/inactive accounts from public-facing lists.

const DEMO_USERNAME_RE = /^(test|demo|bot|fake|seed|dummy|sample|qa)/i;

export function isPublicPlayer(p: {
  username?: string | null;
  display_name?: string | null;
  matches_played?: number | null;
  wins?: number | null;
  losses?: number | null;
}): boolean {
  const name = (p.username ?? "").trim();
  if (!name || name.length < 3) return false;
  if (DEMO_USERNAME_RE.test(name)) return false;
  if (p.display_name && DEMO_USERNAME_RE.test(p.display_name)) return false;
  return true;
}

export function hasCompetitiveActivity(p: {
  matches_played?: number | null;
  wins?: number | null;
  losses?: number | null;
  elo?: number | null;
}): boolean {
  const mp = p.matches_played ?? 0;
  const w = p.wins ?? 0;
  const l = p.losses ?? 0;
  return mp > 0 || w > 0 || l > 0;
}