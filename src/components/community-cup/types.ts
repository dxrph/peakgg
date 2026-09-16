export type RosterRole = "captain" | "player" | "substitute";
export type RosterStatus = "invited" | "accepted" | "declined" | "removed" | "locked";

export interface RosterMember {
  id: string;
  tournament_id: string;
  signup_id: string;
  user_id: string;
  invited_by: string;
  role: RosterRole;
  status: RosterStatus;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    rank: string | null;
  } | null;
}

export interface RosterSignup {
  id: string;
  tournament_id: string;
  captain_user_id: string | null;
  team_name: string;
  team_tag: string | null;
  team_logo_url: string | null;
  status: string;
  ready_at: string | null;
  roster_locked_at: string | null;
}