export type Json = string | number | boolean | null | {[key: string]: Json | undefined} | Json[];
type Row = Record<string, unknown>;
type Table = {Row: Row; Insert: Row; Update: Row; Relationships: []};

export type Database = {
  public: {
    Tables: {
      profiles: Table; user_roles: Table; teams: Table; team_members: Table; team_invites: Table; team_applications: Table;
      seasons: Table; tournaments: Table; tournament_registrations: Table; tournament_roster_members: Table; matches: Table;
      match_ready_states: Table; match_player_participation: Table; match_result_submissions: Table; match_room_messages: Table;
      disputes: Table; dispute_evidence: Table; tournament_point_events: Table; notifications: Table; admin_announcements: Table; admin_audit_logs: Table;
    };
    Views: Record<string, never>;
    Functions: {
      create_team: {Args:{p_name:string;p_tag:string;p_region:string;p_description:string;p_recruiting:boolean};Returns:string};
      apply_to_team: {Args:{p_team:string;p_role:string;p_message:string};Returns:string};
      set_match_ready: {Args:{p_match:string;p_team:string};Returns:undefined};
      submit_match_result: {Args:{p_match:string;p_team_a_score:number;p_team_b_score:number;p_players:string[];p_evidence?:string|null};Returns:string};
      register_tournament_team: {Args:{p_tournament:string;p_team:string;p_roster:Json};Returns:string};
      check_in_tournament_team: {Args:{p_registration:string};Returns:undefined};
      confirm_match_result: {Args:{p_submission:string};Returns:undefined};
      open_match_dispute: {Args:{p_submission:string;p_reason:string};Returns:string};
      transition_tournament: {Args:{p_tournament:string;p_next:string};Returns:undefined};
      promote_waitlisted_team: {Args:{p_registration:string};Returns:undefined};
    };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};
