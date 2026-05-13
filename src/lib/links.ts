// Centralized external/social links.
// Override any of these without touching code by setting the matching VITE_ env vars
// (e.g. in your Lovable project / .env file). If unset, the default fallback is used.
//
// Available env vars:
//   VITE_DISCORD_INVITE
//   VITE_SOCIAL_X        (Twitter / X profile URL)
//   VITE_SOCIAL_INSTAGRAM
//   VITE_SOCIAL_TIKTOK
//   VITE_SOCIAL_YOUTUBE
//   VITE_SOCIAL_TWITCH

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const pick = (key: string, fallback: string): string => {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
};

export const DISCORD_INVITE = pick("VITE_DISCORD_INVITE", "https://discord.gg/knkEkkTSA");

export type SocialKey = "x" | "instagram" | "tiktok" | "youtube" | "twitch" | "discord";

export interface SocialLink {
  key: SocialKey;
  label: string;
  url: string;
}

/**
 * Centralized social profile URLs.
 * Empty string => link is hidden in UI. Override via VITE_SOCIAL_* env vars.
 */
export const SOCIAL_LINKS: Record<SocialKey, string> = {
  discord: DISCORD_INVITE,
  x: pick("VITE_SOCIAL_X", ""),
  instagram: pick("VITE_SOCIAL_INSTAGRAM", ""),
  tiktok: pick("VITE_SOCIAL_TIKTOK", ""),
  youtube: pick("VITE_SOCIAL_YOUTUBE", ""),
  twitch: pick("VITE_SOCIAL_TWITCH", ""),
};

/** Returns only the socials that have a configured URL, in display order. */
export function getActiveSocials(): SocialLink[] {
  const order: { key: SocialKey; label: string }[] = [
    { key: "discord", label: "Discord" },
    { key: "x", label: "X" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
    { key: "twitch", label: "Twitch" },
  ];
  return order
    .filter((s) => SOCIAL_LINKS[s.key] && SOCIAL_LINKS[s.key].length > 0)
    .map((s) => ({ ...s, url: SOCIAL_LINKS[s.key] }));
}