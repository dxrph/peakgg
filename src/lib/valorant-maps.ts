export const DEFAULT_VALORANT_MAP_POOL = [
  "Bind",
  "Haven",
  "Split",
  "Ascent",
  "Icebox",
  "Lotus",
  "Sunset",
  "Abyss",
  "Pearl",
  "Fracture",
  "Breeze",
] as const;

/**
 * Fallback map splash art served from the community-maintained valorant-api.com
 * CDN. Used by the match room when a tournament's `map_pool.image_url` is not
 * set, so map cards never render as empty dark boxes.
 */
export const VALORANT_MAP_SPLASH: Record<string, string> = {
  Ascent:   "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
  Bind:     "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-18db23bcc1c4/splash.png",
  Haven:    "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
  Split:    "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
  Icebox:   "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
  Breeze:   "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
  Fracture: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
  Pearl:    "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
  Lotus:    "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
  Sunset:   "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
  Abyss:    "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
};

export function getValorantMapImage(name: string, fallback?: string | null): string | null {
  return fallback || VALORANT_MAP_SPLASH[name] || null;
}

export type MapSelectionMode =
  | "admin_manual"
  | "random"
  | "captain_veto"
  | "predefined"
  | "bo3_veto"
  | "bo5_veto";

export const MAP_SELECTION_MODE_LABEL: Record<string, string> = {
  admin_manual: "Admin selects map manually",
  random: "Random map from active pool",
  captain_veto: "Captain veto (BO1)",
  predefined: "Predefined map per round",
  bo3_veto: "Captain veto — BO3 series",
  bo5_veto: "Captain veto — BO5 series",
};

export const MATCH_FORMAT_OPTIONS = ["BO1", "BO2", "BO3", "BO5"] as const;
export const RESULT_CONFIRMATION_MODES = [
  "admin_manual",
  "both_captains_confirm",
  "captain_report_admin_confirm",
] as const;
export const TOURNAMENT_STATUS_OPTIONS = [
  "collecting_interest",
  "registration_open",
  "registration_closed",
  "checkin",
  "live",
  "paused",
  "completed",
  "cancelled",
] as const;