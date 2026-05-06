export type Game = "valorant" | "cs2" | "r6s";

export const GAME_MAPS: Record<Game, string[]> = {
  valorant: ["Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split", "Sunset"],
  cs2:      ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Vertigo", "Dust2", "Overpass"],
  r6s:      ["Bank", "Border", "Chalet", "Clubhouse", "Consulate", "Kafe Dostoyevsky", "Oregon", "Skyscraper", "Theme Park", "Villa"],
};

export const TIER_LABELS = ["Open Cup", "Challenger Series", "Peak Championship", "Community Event", "Invitational"] as const;
export const TOURNAMENT_TYPES = ["official", "community", "partner", "test"] as const;
export const VISIBILITIES = ["public", "private", "unlisted", "draft"] as const;
export const LANGUAGES = ["en", "fr", "it", "multi"] as const;
export const TEAM_SIZES = ["1v1", "2v2", "3v3", "5v5"] as const;
export const FORMATS = [
  { value: "single_elim", label: "Single Elimination" },
  { value: "double_elim", label: "Double Elimination" },
  { value: "round_robin", label: "Round Robin" },
  { value: "swiss",       label: "Swiss" },
  { value: "groups_elim", label: "Groups + Playoffs" },
  { value: "league",      label: "League Format" },
  { value: "custom",      label: "Custom Format" },
] as const;
export const BO_OPTIONS = ["BO1", "BO3", "BO5"] as const;
export const BRACKET_SIZES = [4, 8, 16, 32, 64] as const;
export const REGIONS = ["EU", "EU West", "EU East", "MENA", "Global"] as const;
export const PRIZE_CURRENCIES = ["EUR", "USD", "PeakCoins", "Gift Card", "Other"] as const;

export type Eligibility = {
  regions: string[];
  countries: string[];
  min_peak_elo: number;
  max_peak_elo: number;
  min_game_rank?: string;
  max_game_rank?: string;
  min_account_age_days: number;
  min_profile_completion: number;
  require_discord: boolean;
  require_verified_email: boolean;
  require_team_logo: boolean;
  require_all_peakgg_account: boolean;
  captain_only_registration: boolean;
  allow_substitutes: boolean;
  max_substitutes: number;
  allow_mixed_country: boolean;
  allow_free_agents: boolean;
  allow_solo_waitlist: boolean;
  require_game_id: boolean;
  require_rank_screenshot: boolean;
  require_manual_approval: boolean;
  block_duplicate_accounts: boolean;
  flag_suspicious_accounts: boolean;
};

export type FormatSettings = {
  format: string;
  bracket_size: number | "custom";
  team_size: string;
  bo: string;
  grand_final_format: string;
  third_place_match: boolean;
  lower_bracket_final: boolean;
  bronze_final: boolean;
  group_stage_enabled: boolean;
  num_groups: number;
  teams_per_group: number;
  teams_advancing: number;
  seeding_method: string;
  allow_manual_bracket_edit: boolean;
  lock_bracket_after_publish: boolean;
  auto_generate_bracket: boolean;
  allow_late_replacement: boolean;
};

export type RegistrationSettings = {
  status: string;
  registration_mode: string;
  approval: string;
  invite_code?: string;
  questions: string[];
  allow_waitlist: boolean;
  max_waitlist: number;
  allow_team_edits: boolean;
  lock_roster: boolean;
  roster_lock_at?: string;
  allow_roster_changes_with_approval: boolean;
  require_captain_confirmation: boolean;
  require_all_players_confirmation: boolean;
};

export type MapSettings = {
  map_pool: string[];
  selection_mode: string;
  veto_enabled: boolean;
  veto_format: string;
  server_selection: string;
  side_selection: string;
  overtime_rules: string;
  tactical_pauses: boolean;
  technical_pauses: boolean;
  max_pauses: number;
  pause_duration_min: number;
  reporting_mode: string;
  screenshot_required: boolean;
  demo_required: boolean;
  dispute_window_min: number;
  noshow_limit_min: number;
  rematch_allowed: boolean;
  admin_can_override: boolean;
};

export type ScheduleSettings = {
  scheduling_mode: string;
  break_between_rounds_min: number;
  max_match_duration_min: number;
  auto_advance: boolean;
  auto_disqualify_noshow: boolean;
  checkin_required: boolean;
  checkin_method: string;
  reminders: string[];
};

export type RewardSettings = {
  prize_distribution: string;
  prize_first?: string;
  prize_second?: string;
  prize_third?: string;
  prize_mvp?: string;
  prize_clip?: string;
  pp_participation: number;
  pp_win: number;
  pp_runner_up: number;
  pp_champion: number;
  pp_mvp: number;
  reward_trophy: boolean;
  reward_badge: boolean;
  reward_banner: boolean;
  reward_title: boolean;
};

export type VisibilitySettings = {
  featured_homepage: boolean;
  featured_tournaments_page: boolean;
  discord_announce: boolean;
  show_countdown: boolean;
  show_in_upcoming: boolean;
  allow_social_sharing: boolean;
  social_title?: string;
  social_description?: string;
  social_image?: string;
  social_caption?: string;
  discord_announcement_text?: string;
};

export type ModerationSettings = {
  allow_edit_after_publish: boolean;
  allow_manual_add_teams: boolean;
  allow_remove_teams: boolean;
  allow_ban_teams: boolean;
  allow_reset_bracket: boolean;
  allow_regenerate_bracket: boolean;
  allow_score_override: boolean;
  allow_resolve_disputes: boolean;
  allow_lock_registrations: boolean;
  allow_pause_tournament: boolean;
  allow_cancel_tournament: boolean;
  report_system_enabled: boolean;
  allow_match_disputes: boolean;
  require_evidence_for_dispute: boolean;
  auto_hide_reported_content: boolean;
  checklist_rules: boolean;
  checklist_prize: boolean;
  checklist_discord: boolean;
  checklist_bracket: boolean;
  checklist_registration: boolean;
  checklist_staff: boolean;
};

export type StaffSettings = {
  tournament_admin?: string;
  referees: string[];
  caster?: string;
  support_contact?: string;
};

export type WizardForm = {
  id?: string;
  // Basic info
  name: string;
  slug: string;
  game: Game;
  tier_label: string;
  tournament_type: string;
  short_description: string;
  description: string;
  banner_url: string;
  logo_url: string;
  rules: string;
  rules_url: string;
  organizer_name: string;
  organizer_discord: string;
  language: string;
  // Schedule (top-level for queries)
  registration_open_at: string;
  registration_close_at: string;
  checkin_open_at: string;
  checkin_close_at: string;
  start_date: string;
  end_date: string;
  timezone: string;
  // Teams
  max_teams: number;
  min_teams: number;
  team_size: string;
  // Rewards (top-level)
  prize_pool: string;
  prize_currency: string;
  reward_trophies: number;
  reward_badge: string;
  reward_banner: string;
  // Visibility (top-level)
  visibility: string;
  featured: boolean;
  status: string;
  // Game-related top-level
  format: string;
  bo: string;
  map_mode: string;
  fixed_map: string;
  entry_type: string;
  entry_cost_coins: number;
  min_elo: number;
  rank_max: number;
  seeding_enabled: boolean;
  // Advanced (jsonb buckets)
  eligibility: Eligibility;
  format_advanced: FormatSettings;
  registration: RegistrationSettings;
  maps: MapSettings;
  schedule: ScheduleSettings;
  rewards: RewardSettings;
  visibility_advanced: VisibilitySettings;
  moderation: ModerationSettings;
  staff: StaffSettings;
  admin_notes: string;
};

export const defaultEligibility: Eligibility = {
  regions: ["EU"], countries: [], min_peak_elo: 0, max_peak_elo: 9999,
  min_account_age_days: 0, min_profile_completion: 0,
  require_discord: false, require_verified_email: false, require_team_logo: false,
  require_all_peakgg_account: true, captain_only_registration: true,
  allow_substitutes: true, max_substitutes: 2, allow_mixed_country: true,
  allow_free_agents: false, allow_solo_waitlist: false,
  require_game_id: true, require_rank_screenshot: false,
  require_manual_approval: false, block_duplicate_accounts: true,
  flag_suspicious_accounts: true,
};

export const defaultFormat: FormatSettings = {
  format: "single_elim", bracket_size: 16, team_size: "5v5",
  bo: "BO1", grand_final_format: "same",
  third_place_match: false, lower_bracket_final: false, bronze_final: false,
  group_stage_enabled: false, num_groups: 4, teams_per_group: 4, teams_advancing: 2,
  seeding_method: "random", allow_manual_bracket_edit: true,
  lock_bracket_after_publish: false, auto_generate_bracket: true,
  allow_late_replacement: false,
};

export const defaultRegistration: RegistrationSettings = {
  status: "closed", registration_mode: "captain_full_team", approval: "automatic",
  questions: ["Team Discord", "Captain Discord", "Average rank"],
  allow_waitlist: true, max_waitlist: 8,
  allow_team_edits: true, lock_roster: true,
  allow_roster_changes_with_approval: true,
  require_captain_confirmation: true, require_all_players_confirmation: false,
};

export const defaultMaps: MapSettings = {
  map_pool: [], selection_mode: "team_veto", veto_enabled: true,
  veto_format: "ban_ban_pick_pick_decider", server_selection: "EU West",
  side_selection: "coinflip", overtime_rules: "game_default",
  tactical_pauses: true, technical_pauses: true, max_pauses: 4, pause_duration_min: 5,
  reporting_mode: "both_confirm", screenshot_required: true, demo_required: false,
  dispute_window_min: 30, noshow_limit_min: 15,
  rematch_allowed: false, admin_can_override: true,
};

export const defaultSchedule: ScheduleSettings = {
  scheduling_mode: "fixed_round", break_between_rounds_min: 15,
  max_match_duration_min: 90, auto_advance: true, auto_disqualify_noshow: true,
  checkin_required: true, checkin_method: "captain",
  reminders: ["24h", "1h", "15min"],
};

export const defaultRewards: RewardSettings = {
  prize_distribution: "top_3",
  pp_participation: 10, pp_win: 25, pp_runner_up: 50, pp_champion: 100, pp_mvp: 30,
  reward_trophy: true, reward_badge: true, reward_banner: false, reward_title: false,
};

export const defaultVisibility: VisibilitySettings = {
  featured_homepage: false, featured_tournaments_page: true,
  discord_announce: true, show_countdown: true, show_in_upcoming: true,
  allow_social_sharing: true,
};

export const defaultModeration: ModerationSettings = {
  allow_edit_after_publish: true, allow_manual_add_teams: true,
  allow_remove_teams: true, allow_ban_teams: true,
  allow_reset_bracket: true, allow_regenerate_bracket: true,
  allow_score_override: true, allow_resolve_disputes: true,
  allow_lock_registrations: true, allow_pause_tournament: true,
  allow_cancel_tournament: true,
  report_system_enabled: true, allow_match_disputes: true,
  require_evidence_for_dispute: true, auto_hide_reported_content: true,
  checklist_rules: false, checklist_prize: false, checklist_discord: false,
  checklist_bracket: false, checklist_registration: false, checklist_staff: false,
};

export const defaultStaff: StaffSettings = { referees: [] };

export const emptyWizardForm: WizardForm = {
  name: "", slug: "", game: "valorant", tier_label: "Open Cup",
  tournament_type: "official", short_description: "", description: "",
  banner_url: "", logo_url: "", rules: "", rules_url: "",
  organizer_name: "PeakGG", organizer_discord: "", language: "en",
  registration_open_at: "", registration_close_at: "",
  checkin_open_at: "", checkin_close_at: "",
  start_date: "", end_date: "", timezone: "Europe/Brussels",
  max_teams: 16, min_teams: 4, team_size: "5v5",
  prize_pool: "", prize_currency: "PeakCoins",
  reward_trophies: 1, reward_badge: "", reward_banner: "",
  visibility: "draft", featured: false, status: "upcoming",
  format: "single_elim", bo: "BO1", map_mode: "ban", fixed_map: "",
  entry_type: "open", entry_cost_coins: 0, min_elo: 0, rank_max: 9999,
  seeding_enabled: false,
  eligibility: defaultEligibility,
  format_advanced: defaultFormat,
  registration: defaultRegistration,
  maps: { ...defaultMaps, map_pool: GAME_MAPS.valorant },
  schedule: defaultSchedule,
  rewards: defaultRewards,
  visibility_advanced: defaultVisibility,
  moderation: defaultModeration,
  staff: defaultStaff,
  admin_notes: "",
};

export const STEPS = [
  { id: "basic",       label: "Basic Info" },
  { id: "eligibility", label: "Game & Eligibility" },
  { id: "format",      label: "Format & Bracket" },
  { id: "teams",       label: "Teams & Registration" },
  { id: "maps",        label: "Maps & Match Rules" },
  { id: "schedule",    label: "Schedule & Check-in" },
  { id: "rewards",     label: "Rewards & Points" },
  { id: "visibility",  label: "Visibility & Promotion" },
  { id: "moderation",  label: "Moderation & Staff" },
  { id: "review",      label: "Review & Publish" },
] as const;

export function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function validateForPublish(f: WizardForm): string[] {
  const errors: string[] = [];
  if (!f.name.trim()) errors.push("Tournament name is required");
  if (!f.slug.trim()) errors.push("Slug is required");
  if (!f.description.trim()) errors.push("Full description is required");
  if (!f.start_date) errors.push("Tournament start date is missing");
  if (f.registration_close_at && f.start_date && new Date(f.registration_close_at) > new Date(f.start_date))
    errors.push("Registration close date is after the tournament start date");
  if (!f.prize_pool.trim() && f.tournament_type !== "test") errors.push("Prize pool is empty");
  if (!f.maps.map_pool.length) errors.push("Map pool is empty");
  if (!f.rules.trim() && !f.rules_url.trim()) errors.push("Rules are missing");
  if (f.max_teams < f.min_teams) errors.push("Max teams is lower than min teams");
  if (f.visibility === "public" && f.status === "upcoming" && !f.start_date)
    errors.push("Visibility is public but tournament is incomplete");
  return errors;
}