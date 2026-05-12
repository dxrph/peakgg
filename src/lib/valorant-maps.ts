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