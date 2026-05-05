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
          reason: string
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
          reason?: string
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
          reason?: string
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
      matches: {
        Row: {
          bracket_position: number | null
          bracket_side: string | null
          created_at: string
          game: string
          id: string
          map: string | null
          next_match_id: string | null
          next_match_slot: string | null
          played_at: string | null
          player_a_id: string | null
          player_b_id: string | null
          round: number | null
          score_a: number | null
          score_b: number | null
          status: string
          team_a_id: string | null
          team_b_id: string | null
          tournament_id: string | null
          winner_id: string | null
        }
        Insert: {
          bracket_position?: number | null
          bracket_side?: string | null
          created_at?: string
          game?: string
          id?: string
          map?: string | null
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          round?: number | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id?: string | null
          winner_id?: string | null
        }
        Update: {
          bracket_position?: number | null
          bracket_side?: string | null
          created_at?: string
          game?: string
          id?: string
          map?: string | null
          next_match_id?: string | null
          next_match_slot?: string | null
          played_at?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          round?: number | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          tournament_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
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
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
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
          challenger_team_id: string
          created_at: string
          format: string
          game: string
          id: string
          notes: string | null
          scheduled_date: string
          status: string
          target_team_id: string | null
        }
        Insert: {
          challenger_team_id: string
          created_at?: string
          format?: string
          game?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          status?: string
          target_team_id?: string | null
        }
        Update: {
          challenger_team_id?: string
          created_at?: string
          format?: string
          game?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          target_team_id?: string | null
        }
        Relationships: []
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
          bo: string
          bracket_type: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          entry_cost_coins: number
          entry_type: string
          fixed_map: string | null
          format: string
          game: string
          id: string
          map_mode: string
          map_pool: string[] | null
          max_teams: number
          min_elo: number | null
          name: string
          prize_pool: string | null
          rank_max: number | null
          reward_badge: string | null
          reward_banner: string | null
          reward_trophies: number
          rules: string | null
          seeding_enabled: boolean
          start_date: string | null
          status: string
          tier: number
        }
        Insert: {
          bo?: string
          bracket_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_cost_coins?: number
          entry_type?: string
          fixed_map?: string | null
          format?: string
          game?: string
          id?: string
          map_mode?: string
          map_pool?: string[] | null
          max_teams?: number
          min_elo?: number | null
          name: string
          prize_pool?: string | null
          rank_max?: number | null
          reward_badge?: string | null
          reward_banner?: string | null
          reward_trophies?: number
          rules?: string | null
          seeding_enabled?: boolean
          start_date?: string | null
          status?: string
          tier?: number
        }
        Update: {
          bo?: string
          bracket_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_cost_coins?: number
          entry_type?: string
          fixed_map?: string | null
          format?: string
          game?: string
          id?: string
          map_mode?: string
          map_pool?: string[] | null
          max_teams?: number
          min_elo?: number | null
          name?: string
          prize_pool?: string | null
          rank_max?: number | null
          reward_badge?: string | null
          reward_banner?: string | null
          reward_trophies?: number
          rules?: string | null
          seeding_enabled?: boolean
          start_date?: string | null
          status?: string
          tier?: number
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
      [_ in never]: never
    }
    Functions: {
      apply_elo_decay: {
        Args: never
        Returns: {
          affected_users: number
          total_decay: number
        }[]
      }
      award_tournament_prizes: {
        Args: { _tournament_id: string }
        Returns: undefined
      }
      calculate_dynamic_elo_delta: {
        Args: { _opponent_elo: number; _player_elo: number; _won: boolean }
        Returns: number
      }
      close_season: { Args: { _season_id: string }; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_bracket: { Args: { _tournament_id: string }; Returns: undefined }
      get_my_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_disposable_email: { Args: { _email: string }; Returns: boolean }
      is_muted: {
        Args: { _scope: string; _team_id?: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_smurf_risk: { Args: { _user_id: string }; Returns: number }
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
