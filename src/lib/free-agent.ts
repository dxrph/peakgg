// Single source of truth for the Free Agent profile flow.
// All "Complete Profile" / "Edit Free Agent Profile" CTAs go through here
// so we have one route, one handler, and one set of rules.

import type { NavigateFunction } from "react-router-dom";

export const FREE_AGENT_COMPLETE_ROUTE = "/free-agents/complete-profile";

export type FreeAgentProfileLike = {
  preferred_game?: string | null;
  role?: string | null;
  region?: string | null;
  language?: string | null;
  availability?: string | null;
  looking_for_team?: boolean | null;
};

/** A profile is "complete enough" to be publicly listed. */
export function isFreeAgentProfileComplete(p?: FreeAgentProfileLike | null): boolean {
  if (!p) return false;
  return Boolean(
    p.preferred_game &&
    p.role &&
    p.region &&
    p.language &&
    p.availability,
  );
}

/** Is this user currently listed publicly on the Free Agents board? */
export function isFreeAgentListed(p?: FreeAgentProfileLike | null): boolean {
  return isFreeAgentProfileComplete(p) && !!p?.looking_for_team;
}

/** Decide the CTA label for any "Complete Profile" button. */
export function freeAgentCtaLabel(
  user: unknown | null,
  profile?: FreeAgentProfileLike | null,
): string {
  if (!user) return "Complete Profile";
  if (!isFreeAgentProfileComplete(profile)) return "Complete Profile";
  if (isFreeAgentListed(profile)) return "Edit Profile";
  return "Edit Free Agent Profile";
}

/**
 * Shared handler used by every "Complete Profile" CTA on the Free Agents page.
 * - Logged out  → /login with state.from preserved so Login redirects back.
 * - Logged in   → /free-agents/complete-profile directly.
 * (2FA is no longer a hard gate that strands the user — it stays optional
 * in Settings & Privacy.)
 */
export function handleCompleteFreeAgentProfile(
  user: unknown | null,
  navigate: NavigateFunction,
) {
  if (!user) {
    navigate("/login", { state: { from: FREE_AGENT_COMPLETE_ROUTE } });
    return;
  }
  navigate(FREE_AGENT_COMPLETE_ROUTE);
}