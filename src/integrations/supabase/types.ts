export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          code: string
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          label: string
          rarity: string
        }
        Insert: {
          category?: string
          code: string
          color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          label: string
          rarity?: string
        }
        Update: {
          category?: string
          code?: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          label?: string
          rarity?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string | null
          target_resource: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          created_by: string
          id: string
          title: string
          urgent: boolean
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          urgent?: boolean
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          urgent?: boolean
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_mutes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          muted_by: string
          reason: string | null
          scope: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by: string
          reason?: string | null
          scope: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          muted_by?: string
          reason?: string | null
          scope?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clips: {
        Row: {
          created_at: string
          id: string
          player_id: string | null
          title: string
          video_url: string | null
          votes: number
          week: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_id?: string | null
          title: string
          video_url?: string | null
          votes?: number
          week?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string | null
          title?: string
          video_url?: string | null
          votes?: number
          week?: string | null
        }
        Relationships: []
      }
      coach_notes: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          match_id: string | null
          team_id: string
          title: string
          visibility: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          team_id: string
          title: string
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          match_id?: string | null
          team_id?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_queue_group_members: {
        Row: {
          accepted: boolean
          created_at: string
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_queue_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "competitive_queue_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_queue_groups: {
        Row: {
          created_at: string
          created_by: string
          current_party_size: number
          desired_team_size: number
          game: string
          id: string
          match_id: string | null
          mode: string
          permanent_team_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_party_size?: number
          desired_team_size: number
          game: string
          id?: string
          match_id?: string | null
          mode: string
          permanent_team_id?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_party_size?: number
          desired_team_size?: number
          game?: string
          id?: string
          match_id?: string | null
          mode?: string
          permanent_team_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_queue_groups_permanent_team_id_fkey"
            columns: ["permanent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      disposable_email_domains: {
        Row: {
          added_at: string
          domain: string
        }
        Insert: {
          added_at?: string
          domain: string
        }
        Update: {
          added_at?: string
          domain?: string
        }
        Relationships: []
      }
      elo_history: {
        Row: {
          created_at: string
          delta: number
          elo_after: number
          elo_before: number
          game: string
          id: string
          match_id: string | null
          new_rank: string | null
          old_rank: string | null
          reason: string
          source_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          elo_after: number
          elo_before: number
          game: string
          id?: string
          match_id?: string | null
          new_rank?: string | null
          old_rank?: string | null
          reason?: string
          source_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          elo_after?: number
          elo_before?: number
          game?: string
          id?: string
          match_id?: string | null
          new_rank?: string | null
          old_rank?: string | null
          reason?: string
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          export_url: string | null
          id: string
          notes: string | null
          scheduled_for: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          export_url?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          export_url?: string | null
          id?: string
          notes?: string | null
          scheduled_for?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      global_messages: {
        Row: {
          content: string
          created_at: string
          flag_reason: string | null
          flagged: boolean
          id: string
          report_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          report_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          report_count?: number
          user_id?: string
        }
        Relationships: []
      }
      league_divisions: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          season_id: string
          tier: number
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          season_id: string
          tier?: number
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          season_id?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_divisions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_not_found_events: {
        Row: {
          created_at: string
          id: string
          param: string
          param_type: string
          path: string | null
          referrer: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          param: string
          param_type: string
          path?: string | null
          referrer?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          param?: string
          param_type?: string
          path?: string | null
          referrer?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      league_registrations: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          division_id: string | null
          id: string
          season_id: string
          status: string
          submitted_by: string
          team_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          division_id?: string | null
          id?: string
          season_id: string
          status?: string
          submitted_by: string
          team_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          division_id?: string | null
          id?: string
          season_id?: string
          status?: string
          submitted_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_registrations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "league_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_registrations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_seasons: {
        Row: {
          champion_team_id: string | null
          created_at: string
          ends_at: string | null
          format: string
          id: string
          is_demo: boolean
          league_id: string
          name: string
          playoff_size: number
          playoffs_started_at: string | null
          registration_deadline: string | null
          season_number: number
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          champion_team_id?: string | null
          created_at?: string
          ends_at?: string | null
          format?: string
          id?: string
          is_demo?: boolean
          league_id: string
          name: string
          playoff_size?: number
          playoffs_started_at?: string | null
          registration_deadline?: string | null
          season_number?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          champion_team_id?: string | null
          created_at?: string
          ends_at?: string | null
          format?: string
          id?: string
          is_demo?: boolean
          league_id?: string
          name?: string
          playoff_size?: number
          playoffs_started_at?: string | null
          registration_deadline?: string | null
          season_number?: number
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_standings: {
        Row: {
          division_id: string
          draws: number
          form: string[]
          id: string
          losses: number
          played: number
          points: number
          position: number | null
          round_diff: number
          team_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          division_id: string
          draws?: number
          form?: string[]
          id?: string
          losses?: number
          played?: number
          points?: number
          position?: number | null
          round_diff?: number
          team_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          division_id?: string
          draws?: number
          form?: string[]
          id?: string
          losses?: number
          played?: number
          points?: number
          position?: number | null
          round_diff?: number
          team_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_standings_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "league_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          game: string
          id: string
          is_demo: boolean
          max_teams: number
          min_roster_size: number
          name: string
          reward_text: string | null
          rules_md: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          max_teams?: number
          min_roster_size?: number
          name: string
          reward_text?: string | null
          rules_md?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          max_teams?: number
          min_roster_size?: number
          name?: string
          reward_text?: string | null
          rules_md?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lfp_board: {
        Row: {
          created_at: string
          game: string
          id: string
          is_active: boolean
          message: string | null
          rank: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          is_active?: boolean
          message?: string | null
          rank?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          is_active?: boolean
          message?: string | null
          rank?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lfp_board_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system_message: boolean
          match_id: string
          sender_role: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          match_id: string
          sender_role?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          match_id?: string
          sender_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_disputes: {
        Row: {
          created_at: string
          evidence_url: string | null
          id: string
          match_id: string
          opened_by: string
          opened_by_team_id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          match_id: string
          opened_by: string
          opened_by_team_id: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          match_id?: string
          opened_by?: string
          opened_by_team_id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_map_veto: {
        Row: {
          banned_maps: Json
          completed_at: string | null
          created_at: string
          current_turn_signup_id: string | null
          current_turn_team_id: string | null
          id: string
          match_id: string
          mode: string
          pick_count: number
          picked_maps: Json
          selected_map: string | null
          started_at: string | null
          status: string
          tournament_id: string | null
          updated_at: string
          veto_log: Json
        }
        Insert: {
          banned_maps?: Json
          completed_at?: string | null
          created_at?: string
          current_turn_signup_id?: string | null
          current_turn_team_id?: string | null
          id?: string
          match_id: string
          mode?: string
          pick_count?: number
          picked_maps?: Json
          selected_map?: string | null
          started_at?: string | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
          veto_log?: Json
        }
        Update: {
          banned_maps?: Json
          completed_at?: string | null
          created_at?: string
          current_turn_signup_id?: string | null
          current_turn_team_id?: string | null
          id?: string
          match_id?: string
          mode?: string
          pick_count?: number
          picked_maps?: Json
          selected_map?: string | null
          started_at?: string | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
          veto_log?: Json
        }
        Relationships: [
          {
            foreignKeyName: "match_map_veto_current_turn_signup_id_fkey"
            columns: ["current_turn_signup_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_map_veto_current_turn_signup_id_fkey"
            columns: ["current_turn_signup_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_map_veto_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_map_veto_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      match_ready_checks: {
        Row: {
          id: string
          match_id: string
          ready: boolean
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          match_id: string
          ready?: boolean
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          match_id?: string
          ready?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          created_at: string
          id: string
          map: string | null
          match_id: string
          notes: string | null
          score_a: number
          score_b: number
          screenshot_url: string | null
          submitted_by: string
          submitted_by_team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          map?: string | null
          match_id: string
          notes?: string | null
          score_a: number
          score_b: number
          screenshot_url?: string | null
          submitted_by: string
          submitted_by_team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          map?: string | null
          match_id?: string
          notes?: string | null
          score_a?: number
          score_b?: number
          screenshot_url?: string | null
          submitted_by?: string
          submitted_by_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_rosters: {
        Row: {
          created_at: string
          id: string
          is_fill: boolean
          joined_from: string | null
          match_id: string
          queue_group_id: string | null
          role: string
          side: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_fill?: boolean
          joined_from?: string | null
          match_id: string
          queue_group_id?: string | null
          role?: string
          side?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_fill?: boolean
          joined_from?: string | null
          match_id?: string
          queue_group_id?: string | null
          role?: string
          side?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_rosters_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          admin_note: string | null
          bo_format: string | null
          bracket_position: number | null
          bracket_side: string | null
          chat_locked: boolean
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          dispute_reason: string | null
          dispute_status: string | null
          division_id: string | null
          elo_processed_at: string | null
          game: string
          id: string
          is_demo: boolean
          kind: string
          lobby_code: string | null
          map: string | null
          map_selection_mode: string
          matchday: number | null
          next_match_id: string | null
          next_match_slot: string | null
          played_at: string | null
          player_a_id: string | null
          player_b_id: string | null
          reported_by_user_id: string | null
          result_notes: string | null
          result_screenshot_url: string | null
          result_status: string | null
          round: number | null
          scheduled_at: string | null
          score_a: number | null
          score_b: number | null
          season_id: string | null
          selected_map: string | null
          server_info: string | null
          signup_a_id: string | null
          signup_b_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          team_a_id: string | null
          team_b_id: string | null
          tournament_id: string | null
          veto_status: string
          winner_id: string | null
        }
        Insert: {
          admin_note?: string | null
          bo_format?: string | null
          bracket_position?: number | null
          bracket_side?: string | null
          chat_locked?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dispute_reason?: string | null
          dispute_status?: string | null
          division_id?: string | null
          elo_processed_at?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          kind?: string
          lobby_code?: string | null
          map?: string | null
          map_selection_mode?: string
          matchday?: number | null
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          reported_by_user_id?: string | null
          result_notes?: string | null
          result_screenshot_url?: string | null
          result_status?: string | null
          round?: number | null
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          season_id?: string | null
          selected_map?: string | null
          server_info?: string | null
          signup_a_id?: string | null
          signup_b_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id?: string | null
          veto_status?: string
          winner_id?: string | null
        }
        Update: {
          admin_note?: string | null
          bo_format?: string | null
          bracket_position?: number | null
          bracket_side?: string | null
          chat_locked?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dispute_reason?: string | null
          dispute_status?: string | null
          division_id?: string | null
          elo_processed_at?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          kind?: string
          lobby_code?: string | null
          map?: string | null
          map_selection_mode?: string
          matchday?: number | null
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          reported_by_user_id?: string | null
          result_notes?: string | null
          result_screenshot_url?: string | null
          result_status?: string | null
          round?: number | null
          scheduled_at?: string | null
          score_a?: number | null
          score_b?: number | null
          season_id?: string | null
          selected_map?: string | null
          server_info?: string | null
          signup_a_id?: string | null
          signup_b_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id?: string | null
          veto_status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "league_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_a_id_fkey"
            columns: ["player_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player_b_id_fkey"
            columns: ["player_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_signup_a_id_fkey"
            columns: ["signup_a_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_signup_a_id_fkey"
            columns: ["signup_a_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_signup_b_id_fkey"
            columns: ["signup_b_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_signup_b_id_fkey"
            columns: ["signup_b_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          meta: Json
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          meta?: Json
          status?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          meta?: Json
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      open_cup_queue: {
        Row: {
          game: string
          id: string
          joined_at: string
          team_size: number
          user_id: string
        }
        Insert: {
          game: string
          id?: string
          joined_at?: string
          team_size?: number
          user_id: string
        }
        Update: {
          game?: string
          id?: string
          joined_at?: string
          team_size?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_cup_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      peak_coins_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peak_coins_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      player_reports: {
        Row: {
          auto_flagged: boolean
          created_at: string
          flag_type: string | null
          id: string
          player_id: string
          reason: string
          resolved: boolean
        }
        Insert: {
          auto_flagged?: boolean
          created_at?: string
          flag_type?: string | null
          id?: string
          player_id: string
          reason: string
          resolved?: boolean
        }
        Update: {
          auto_flagged?: boolean
          created_at?: string
          flag_type?: string | null
          id?: string
          player_id?: string
          reason?: string
          resolved?: boolean
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          best_win_streak: number
          created_at: string
          elo: number
          game: string
          id: string
          losses: number
          matches_played: number
          peak_elo: number
          peak_rank: string
          updated_at: string
          user_id: string
          win_streak: number
          wins: number
        }
        Insert: {
          best_win_streak?: number
          created_at?: string
          elo?: number
          game: string
          id?: string
          losses?: number
          matches_played?: number
          peak_elo?: number
          peak_rank?: string
          updated_at?: string
          user_id: string
          win_streak?: number
          wins?: number
        }
        Update: {
          best_win_streak?: number
          created_at?: string
          elo?: number
          game?: string
          id?: string
          losses?: number
          matches_played?: number
          peak_elo?: number
          peak_rank?: string
          updated_at?: string
          user_id?: string
          win_streak?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_season_badges: {
        Row: {
          badge_color: string
          badge_label: string
          created_at: string
          id: string
          season_id: string
          user_id: string
        }
        Insert: {
          badge_color?: string
          badge_label: string
          created_at?: string
          id?: string
          season_id: string
          user_id: string
        }
        Update: {
          badge_color?: string
          badge_label?: string
          created_at?: string
          id?: string
          season_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_season_badges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_verified: boolean
          avatar_url: string | null
          ban_expires_at: string | null
          ban_reason: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          discord_username: string | null
          display_name: string | null
          email: string | null
          fast_track: boolean
          fast_track_wins: number
          game: string | null
          id: string
          ip_address: string | null
          is_banned: boolean
          language: string
          last_active_at: string
          looking_for_team: boolean
          peak_coins: number
          preferred_game: string | null
          rank: string | null
          region: string | null
          reputation_score: number
          role: string | null
          smurf_risk_score: number
          trophies: number
          updated_at: string
          username: string
          warn_count: number
        }
        Insert: {
          account_verified?: boolean
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          email?: string | null
          fast_track?: boolean
          fast_track_wins?: number
          game?: string | null
          id: string
          ip_address?: string | null
          is_banned?: boolean
          language?: string
          last_active_at?: string
          looking_for_team?: boolean
          peak_coins?: number
          preferred_game?: string | null
          rank?: string | null
          region?: string | null
          reputation_score?: number
          role?: string | null
          smurf_risk_score?: number
          trophies?: number
          updated_at?: string
          username: string
          warn_count?: number
        }
        Update: {
          account_verified?: boolean
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          email?: string | null
          fast_track?: boolean
          fast_track_wins?: number
          game?: string | null
          id?: string
          ip_address?: string | null
          is_banned?: boolean
          language?: string
          last_active_at?: string
          looking_for_team?: boolean
          peak_coins?: number
          preferred_game?: string | null
          rank?: string | null
          region?: string | null
          reputation_score?: number
          role?: string | null
          smurf_risk_score?: number
          trophies?: number
          updated_at?: string
          username?: string
          warn_count?: number
        }
        Relationships: []
      }
      rank_definitions: {
        Row: {
          color_token: string | null
          created_at: string
          description: string | null
          emblem_url: string | null
          id: string
          is_active: boolean
          max_elo: number | null
          min_elo: number
          rank_key: string
          rank_name: string
          short_description: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color_token?: string | null
          created_at?: string
          description?: string | null
          emblem_url?: string | null
          id?: string
          is_active?: boolean
          max_elo?: number | null
          min_elo: number
          rank_key: string
          rank_name: string
          short_description?: string | null
          sort_order: number
          updated_at?: string
        }
        Update: {
          color_token?: string | null
          created_at?: string
          description?: string | null
          emblem_url?: string | null
          id?: string
          is_active?: boolean
          max_elo?: number | null
          min_elo?: number
          rank_key?: string
          rank_name?: string
          short_description?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      recruitment_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      reputation_votes: {
        Row: {
          communication: number
          created_at: string
          fairplay: number
          id: string
          match_id: string
          player_id: string
          punctuality: number
          voter_id: string
        }
        Insert: {
          communication: number
          created_at?: string
          fairplay: number
          id?: string
          match_id: string
          player_id: string
          punctuality: number
          voter_id: string
        }
        Update: {
          communication?: number
          created_at?: string
          fairplay?: number
          id?: string
          match_id?: string
          player_id?: string
          punctuality?: number
          voter_id?: string
        }
        Relationships: []
      }
      scrim_requests: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          challenger_team_id: string
          created_at: string
          format: string
          game: string
          id: string
          match_id: string | null
          notes: string | null
          scheduled_date: string
          status: string
          target_team_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          challenger_team_id: string
          created_at?: string
          format?: string
          game?: string
          id?: string
          match_id?: string | null
          notes?: string | null
          scheduled_date: string
          status?: string
          target_team_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          challenger_team_id?: string
          created_at?: string
          format?: string
          game?: string
          id?: string
          match_id?: string | null
          notes?: string | null
          scheduled_date?: string
          status?: string
          target_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrim_requests_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          accepted_by_team_id: string | null
          accepted_team_id: string | null
          challenger_team_id: string | null
          contact_info: string | null
          created_at: string
          format: string
          game: string
          id: string
          notes: string | null
          posted_by: string
          rank_max: number | null
          rank_min: number | null
          scheduled_date: string
          scheduled_time: string
          status: string
          target_team_id: string | null
          team_id: string
        }
        Insert: {
          accepted_by_team_id?: string | null
          accepted_team_id?: string | null
          challenger_team_id?: string | null
          contact_info?: string | null
          created_at?: string
          format?: string
          game?: string
          id?: string
          notes?: string | null
          posted_by: string
          rank_max?: number | null
          rank_min?: number | null
          scheduled_date: string
          scheduled_time: string
          status?: string
          target_team_id?: string | null
          team_id: string
        }
        Update: {
          accepted_by_team_id?: string | null
          accepted_team_id?: string | null
          challenger_team_id?: string | null
          contact_info?: string | null
          created_at?: string
          format?: string
          game?: string
          id?: string
          notes?: string | null
          posted_by?: string
          rank_max?: number | null
          rank_min?: number | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          target_team_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrims_accepted_by_team_id_fkey"
            columns: ["accepted_by_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrims_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrims_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      season_results: {
        Row: {
          created_at: string
          final_elo: number
          final_rank: string | null
          game: string
          id: string
          peak_coins_awarded: number
          placement: number
          season_id: string
          trophies_awarded: number
          user_id: string
        }
        Insert: {
          created_at?: string
          final_elo: number
          final_rank?: string | null
          game: string
          id?: string
          peak_coins_awarded?: number
          placement: number
          season_id: string
          trophies_awarded?: number
          user_id: string
        }
        Update: {
          created_at?: string
          final_elo?: number
          final_rank?: string | null
          game?: string
          id?: string
          peak_coins_awarded?: number
          placement?: number
          season_id?: string
          trophies_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          active: boolean
          closed_at: string | null
          created_at: string
          ends_at: string
          id: string
          name: string
          slug: string
          soft_reset_factor: number
          starts_at: string
        }
        Insert: {
          active?: boolean
          closed_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          name: string
          slug: string
          soft_reset_factor?: number
          starts_at: string
        }
        Update: {
          active?: boolean
          closed_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          name?: string
          slug?: string
          soft_reset_factor?: number
          starts_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_chat_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          role: string | null
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          role?: string | null
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          role?: string | null
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          flag_reason: string | null
          flagged: boolean
          id: string
          report_count: number
          team_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          report_count?: number
          team_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          report_count?: number
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          avatar_url: string | null
          avg_elo: number
          color: string
          created_at: string
          description: string | null
          game: string
          id: string
          is_demo: boolean
          is_founding: boolean
          looking_for_players: boolean
          name: string
          owner_id: string
          rank: string | null
          region: string | null
          slots: number
          tag: string
          trophies: number
        }
        Insert: {
          avatar_url?: string | null
          avg_elo?: number
          color?: string
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          is_founding?: boolean
          looking_for_players?: boolean
          name: string
          owner_id: string
          rank?: string | null
          region?: string | null
          slots?: number
          tag: string
          trophies?: number
        }
        Update: {
          avatar_url?: string | null
          avg_elo?: number
          color?: string
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          is_demo?: boolean
          is_founding?: boolean
          looking_for_players?: boolean
          name?: string
          owner_id?: string
          rank?: string | null
          region?: string | null
          slots?: number
          tag?: string
          trophies?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          match_id: string | null
          reported_player_id: string | null
          reporter_id: string
          resolved_by: string | null
          screenshot_url: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          match_id?: string | null
          reported_player_id?: string | null
          reporter_id: string
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          match_id?: string | null
          reported_player_id?: string | null
          reporter_id?: string
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_entries: {
        Row: {
          id: string
          placement: number | null
          points_earned: number | null
          registered_at: string
          status: string
          team_id: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          placement?: number | null
          points_earned?: number | null
          registered_at?: string
          status?: string
          team_id?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          placement?: number | null
          points_earned?: number | null
          registered_at?: string
          status?: string
          team_id?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_entries_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_map_pool: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          map_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          map_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          map_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_map_pool_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          id: string
          registered_at: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_roster_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          id: string
          invited_by: string
          role: string
          signup_id: string
          status: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          id?: string
          invited_by: string
          role?: string
          signup_id: string
          status?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          signup_id?: string
          status?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_roster_members_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_roster_members_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_signups_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_roster_members_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_settings: {
        Row: {
          admin_notes: string | null
          created_at: string
          eligibility_settings: Json
          format_settings: Json
          id: string
          map_settings: Json
          moderation_settings: Json
          registration_settings: Json
          reward_settings: Json
          schedule_settings: Json
          staff_settings: Json
          tournament_id: string
          updated_at: string
          visibility_settings: Json
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          eligibility_settings?: Json
          format_settings?: Json
          id?: string
          map_settings?: Json
          moderation_settings?: Json
          registration_settings?: Json
          reward_settings?: Json
          schedule_settings?: Json
          staff_settings?: Json
          tournament_id: string
          updated_at?: string
          visibility_settings?: Json
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          eligibility_settings?: Json
          format_settings?: Json
          id?: string
          map_settings?: Json
          moderation_settings?: Json
          registration_settings?: Json
          reward_settings?: Json
          schedule_settings?: Json
          staff_settings?: Json
          tournament_id?: string
          updated_at?: string
          visibility_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tournament_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_team_signups: {
        Row: {
          admin_note: string | null
          agreement_available: boolean
          agreement_discord: boolean
          agreement_forfeit: boolean
          agreement_rules: boolean
          average_rank: string | null
          captain_discord: string
          captain_email: string
          captain_name: string
          captain_riot_id: string
          captain_user_id: string | null
          checked_in_at: string | null
          community_discord_url: string | null
          community_name: string
          country_language: string
          created_at: string
          id: string
          notes: string | null
          permanent_team_request_note: string | null
          player_1_riot_id: string
          player_2_riot_id: string
          player_3_riot_id: string
          player_4_riot_id: string
          player_5_riot_id: string
          ready_at: string | null
          roster_locked_at: string | null
          status: string
          substitute_1_riot_id: string | null
          substitute_2_riot_id: string | null
          team_logo_url: string | null
          team_name: string
          team_tag: string | null
          tournament_id: string
          updated_at: string
          wants_permanent_team: boolean
        }
        Insert: {
          admin_note?: string | null
          agreement_available?: boolean
          agreement_discord?: boolean
          agreement_forfeit?: boolean
          agreement_rules?: boolean
          average_rank?: string | null
          captain_discord: string
          captain_email: string
          captain_name: string
          captain_riot_id: string
          captain_user_id?: string | null
          checked_in_at?: string | null
          community_discord_url?: string | null
          community_name: string
          country_language: string
          created_at?: string
          id?: string
          notes?: string | null
          permanent_team_request_note?: string | null
          player_1_riot_id: string
          player_2_riot_id: string
          player_3_riot_id: string
          player_4_riot_id: string
          player_5_riot_id: string
          ready_at?: string | null
          roster_locked_at?: string | null
          status?: string
          substitute_1_riot_id?: string | null
          substitute_2_riot_id?: string | null
          team_logo_url?: string | null
          team_name: string
          team_tag?: string | null
          tournament_id: string
          updated_at?: string
          wants_permanent_team?: boolean
        }
        Update: {
          admin_note?: string | null
          agreement_available?: boolean
          agreement_discord?: boolean
          agreement_forfeit?: boolean
          agreement_rules?: boolean
          average_rank?: string | null
          captain_discord?: string
          captain_email?: string
          captain_name?: string
          captain_riot_id?: string
          captain_user_id?: string | null
          checked_in_at?: string | null
          community_discord_url?: string | null
          community_name?: string
          country_language?: string
          created_at?: string
          id?: string
          notes?: string | null
          permanent_team_request_note?: string | null
          player_1_riot_id?: string
          player_2_riot_id?: string
          player_3_riot_id?: string
          player_4_riot_id?: string
          player_5_riot_id?: string
          ready_at?: string | null
          roster_locked_at?: string | null
          status?: string
          substitute_1_riot_id?: string | null
          substitute_2_riot_id?: string | null
          team_logo_url?: string | null
          team_name?: string
          team_tag?: string | null
          tournament_id?: string
          updated_at?: string
          wants_permanent_team?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_signups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_waitlist: {
        Row: {
          created_at: string
          id: string
          position: number
          team_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          team_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          team_id?: string
          tournament_id?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          banner_url: string | null
          bo: string
          bracket_type: string
          checkin_close_at: string | null
          checkin_open_at: string | null
          countdown_enabled: boolean
          created_at: string
          created_by: string | null
          description: string | null
          discord_url: string | null
          end_date: string | null
          entry_cost_coins: number
          entry_type: string
          featured: boolean
          fixed_map: string | null
          forfeit_grace_minutes: number
          format: string
          game: string
          id: string
          language: string | null
          logo_url: string | null
          map_mode: string
          map_pool: string[] | null
          map_selection_mode: string
          match_format_default: string
          match_format_final: string
          max_teams: number
          min_elo: number | null
          min_teams: number | null
          name: string
          organizer_discord: string | null
          organizer_name: string | null
          prize_currency: string | null
          prize_pool: string | null
          rank_max: number | null
          registration_close_at: string | null
          registration_open_at: string | null
          result_confirmation_mode: string
          reward_badge: string | null
          reward_banner: string | null
          reward_trophies: number
          rules: string | null
          rules_url: string | null
          seeding_enabled: boolean
          short_description: string | null
          slug: string | null
          start_date: string | null
          status: string
          tagline: string | null
          team_size: string | null
          third_place_enabled: boolean
          tier: number
          tier_label: string | null
          timezone: string | null
          tournament_type: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          banner_url?: string | null
          bo?: string
          bracket_type?: string
          checkin_close_at?: string | null
          checkin_open_at?: string | null
          countdown_enabled?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          discord_url?: string | null
          end_date?: string | null
          entry_cost_coins?: number
          entry_type?: string
          featured?: boolean
          fixed_map?: string | null
          forfeit_grace_minutes?: number
          format?: string
          game?: string
          id?: string
          language?: string | null
          logo_url?: string | null
          map_mode?: string
          map_pool?: string[] | null
          map_selection_mode?: string
          match_format_default?: string
          match_format_final?: string
          max_teams?: number
          min_elo?: number | null
          min_teams?: number | null
          name: string
          organizer_discord?: string | null
          organizer_name?: string | null
          prize_currency?: string | null
          prize_pool?: string | null
          rank_max?: number | null
          registration_close_at?: string | null
          registration_open_at?: string | null
          result_confirmation_mode?: string
          reward_badge?: string | null
          reward_banner?: string | null
          reward_trophies?: number
          rules?: string | null
          rules_url?: string | null
          seeding_enabled?: boolean
          short_description?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string
          tagline?: string | null
          team_size?: string | null
          third_place_enabled?: boolean
          tier?: number
          tier_label?: string | null
          timezone?: string | null
          tournament_type?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner_url?: string | null
          bo?: string
          bracket_type?: string
          checkin_close_at?: string | null
          checkin_open_at?: string | null
          countdown_enabled?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          discord_url?: string | null
          end_date?: string | null
          entry_cost_coins?: number
          entry_type?: string
          featured?: boolean
          fixed_map?: string | null
          forfeit_grace_minutes?: number
          format?: string
          game?: string
          id?: string
          language?: string | null
          logo_url?: string | null
          map_mode?: string
          map_pool?: string[] | null
          map_selection_mode?: string
          match_format_default?: string
          match_format_final?: string
          max_teams?: number
          min_elo?: number | null
          min_teams?: number | null
          name?: string
          organizer_discord?: string | null
          organizer_name?: string | null
          prize_currency?: string | null
          prize_pool?: string | null
          rank_max?: number | null
          registration_close_at?: string | null
          registration_open_at?: string | null
          result_confirmation_mode?: string
          reward_badge?: string | null
          reward_banner?: string | null
          reward_trophies?: number
          rules?: string | null
          rules_url?: string | null
          seeding_enabled?: boolean
          short_description?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string
          tagline?: string | null
          team_size?: string | null
          third_place_enabled?: boolean
          tier?: number
          tier_label?: string | null
          timezone?: string | null
          tournament_type?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trophies: {
        Row: {
          awarded_at: string
          id: string
          kind: string
          label: string | null
          season_id: string | null
          team_id: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          kind: string
          label?: string | null
          season_id?: string | null
          team_id: string
        }
        Update: {
          awarded_at?: string
          id?: string
          kind?: string
          label?: string | null
          season_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trophies_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          position: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          position?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          position?: number
        }
        Relationships: []
      }
    }
    Views: {
      tournament_team_signups_public: {
        Row: {
          average_rank: string | null
          checked_in_at: string | null
          community_name: string | null
          country_language: string | null
          created_at: string | null
          id: string | null
          status: string | null
          team_logo_url: string | null
          team_name: string | null
          team_tag: string | null
          tournament_id: string | null
        }
        Insert: {
          average_rank?: string | null
          checked_in_at?: string | null
          community_name?: string | null
          country_language?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          team_logo_url?: string | null
          team_name?: string | null
          team_tag?: string | null
          tournament_id?: string | null
        }
        Update: {
          average_rank?: string | null
          checked_in_at?: string | null
          community_name?: string | null
          country_language?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          team_logo_url?: string | null
          team_name?: string | null
          team_tag?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_signups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _cup_finalize_bo1_remaining: {
        Args: { _match_id: string }
        Returns: undefined
      }
      _cup_random_pick_map: { Args: { _match_id: string }; Returns: undefined }
      _post_match_system_message: {
        Args: { _match_id: string; _msg: string }
        Returns: undefined
      }
      accept_scrim_request: { Args: { _request_id: string }; Returns: string }
      admin_cleanup_sandbox: { Args: never; Returns: undefined }
      admin_confirm_cup_match_result: {
        Args: { _match_id: string; _score_a?: number; _score_b?: number }
        Returns: undefined
      }
      admin_create_sandbox_match: { Args: { _mode?: string }; Returns: string }
      admin_resolve_match: {
        Args: { _match_id: string; _score_a: number; _score_b: number }
        Returns: undefined
      }
      admin_resolve_open_cup_match:
        | {
            Args: { _match_id: string; _score_a: number; _score_b: number }
            Returns: undefined
          }
        | {
            Args: {
              _match_id: string
              _notes?: string
              _reason?: string
              _score_a: number
              _score_b: number
              _winner_user_id?: string
            }
            Returns: undefined
          }
      admin_simulate_cup_match_dispute: {
        Args: { _as_side?: string; _match_id: string; _reason: string }
        Returns: undefined
      }
      admin_simulate_cup_match_result: {
        Args: {
          _as_side?: string
          _match_id: string
          _score_a: number
          _score_b: number
        }
        Returns: undefined
      }
      apply_elo_decay: {
        Args: never
        Returns: {
          affected_users: number
          total_decay: number
        }[]
      }
      approve_league_registration: {
        Args: { _registration_id: string }
        Returns: undefined
      }
      award_league_champion: {
        Args: { _season_id: string; _team_id: string }
        Returns: undefined
      }
      award_season_trophies: {
        Args: { _season_id: string }
        Returns: undefined
      }
      award_tournament_prizes: {
        Args: { _tournament_id: string }
        Returns: undefined
      }
      calculate_dynamic_elo_delta: {
        Args: { _opponent_elo: number; _player_elo: number; _won: boolean }
        Returns: number
      }
      can_access_match_chat: {
        Args: { _match_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_open_cup_queue: { Args: never; Returns: undefined }
      cancel_queue_group: { Args: { _group_id: string }; Returns: undefined }
      captain_ban_map: {
        Args: { _map: string; _match_id: string }
        Returns: undefined
      }
      captain_pick_map: {
        Args: { _map: string; _match_id: string }
        Returns: undefined
      }
      claim_match_for_elo: { Args: { _match_id: string }; Returns: boolean }
      close_season: { Args: { _season_id: string }; Returns: undefined }
      community_cup_checkin: {
        Args: { _signup_id: string }
        Returns: undefined
      }
      complete_match_veto: {
        Args: { _match_id: string; _selected_map?: string }
        Returns: undefined
      }
      confirm_match_result: { Args: { _match_id: string }; Returns: undefined }
      confirm_open_cup_result: {
        Args: { _match_id: string }
        Returns: undefined
      }
      cup_admin_lock_roster: {
        Args: { _signup_id: string }
        Returns: undefined
      }
      cup_admin_unlock_roster: {
        Args: { _signup_id: string }
        Returns: undefined
      }
      cup_cancel_invite: { Args: { _member_id: string }; Returns: undefined }
      cup_invite_player: {
        Args: { _role?: string; _signup_id: string; _user_id: string }
        Returns: string
      }
      cup_mark_team_ready: { Args: { _signup_id: string }; Returns: undefined }
      cup_remove_member: { Args: { _member_id: string }; Returns: undefined }
      cup_respond_invite: {
        Args: { _accept: boolean; _member_id: string }
        Returns: undefined
      }
      decline_scrim_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      dispute_match_result: {
        Args: { _evidence?: string; _match_id: string; _reason: string }
        Returns: undefined
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_full_team: {
        Args: {
          _game: string
          _mode: string
          _team_id: string
          _user_ids: string[]
        }
        Returns: Json
      }
      enqueue_party: {
        Args: { _game: string; _mode: string; _user_ids: string[] }
        Returns: Json
      }
      enqueue_solo: { Args: { _game: string; _mode: string }; Returns: Json }
      generate_bracket: { Args: { _tournament_id: string }; Returns: undefined }
      generate_community_cup_bracket: {
        Args: { _tournament_id: string }
        Returns: number
      }
      generate_round_robin_fixtures: {
        Args: {
          _days_between?: number
          _season_id: string
          _start_date: string
        }
        Returns: number
      }
      get_my_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cup_match_captain: {
        Args: { _match_id: string; _user_id: string }
        Returns: string
      }
      is_disposable_email: { Args: { _email: string }; Returns: boolean }
      is_muted: {
        Args: { _scope: string; _team_id?: string; _user_id: string }
        Returns: boolean
      }
      is_signup_captain: {
        Args: { _signup_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_captain: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      join_open_cup_queue: {
        Args: { _game: string; _team_size?: number }
        Returns: Json
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      open_cup_match_dispute: {
        Args: {
          _description?: string
          _evidence?: string
          _match_id: string
          _reason: string
        }
        Returns: undefined
      }
      rank_name_from_elo: { Args: { _elo: number }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_smurf_risk: { Args: { _user_id: string }; Returns: number }
      recompute_standings_for_division: {
        Args: { _division_id: string }
        Returns: undefined
      }
      register_team_for_season: {
        Args: { _season_id: string; _team_id: string }
        Returns: string
      }
      reject_league_registration: {
        Args: { _registration_id: string }
        Returns: undefined
      }
      reset_match_veto: { Args: { _match_id: string }; Returns: undefined }
      resolve_notification: { Args: { _id: string }; Returns: undefined }
      seed_demo_teams_for_league: {
        Args: { _count?: number; _league_id: string }
        Returns: number
      }
      set_cup_match_chat_locked: {
        Args: { _locked: boolean; _match_id: string }
        Returns: undefined
      }
      set_match_ready: {
        Args: { _match_id: string; _ready: boolean }
        Returns: undefined
      }
      start_match_veto: {
        Args: { _match_id: string; _mode: string }
        Returns: undefined
      }
      start_playoffs: { Args: { _season_id: string }; Returns: undefined }
      submit_cup_match_result: {
        Args: {
          _match_id: string
          _notes?: string
          _score_a: number
          _score_b: number
          _screenshot?: string
        }
        Returns: undefined
      }
      submit_match_result: {
        Args: {
          _map?: string
          _match_id: string
          _notes?: string
          _score_a: number
          _score_b: number
          _screenshot?: string
        }
        Returns: undefined
      }
      submit_open_cup_result: {
        Args: { _match_id: string; _score_a: number; _score_b: number }
        Returns: undefined
      }
      wipe_demo_teams: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "organizer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "organizer"],
    },
  },
} as const
