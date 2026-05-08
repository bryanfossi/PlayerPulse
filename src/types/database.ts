export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'player' | 'parent'
          player_id: string | null
          subscription_active: boolean | null
          subscription_id: string | null
          subscription_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'player' | 'parent'
          player_id?: string | null
          subscription_active?: boolean | null
          subscription_id?: string | null
          subscription_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'player' | 'parent'
          player_id?: string | null
          subscription_active?: boolean | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          user_id: string
          sport_id: string
          first_name: string
          last_name: string
          grad_year: number
          gender: 'Male' | 'Female'
          primary_position: string
          secondary_position: string | null
          height_inches: number | null
          weight_lbs: number | null
          unweighted_gpa: number | null
          sat_score: number | null
          act_score: number | null
          club_team: string
          highest_club_level: string
          high_school: string | null
          home_city: string
          home_state: string
          recruiting_radius_mi: number | null
          target_levels: string[] | null
          forced_schools: string[] | null
          tuition_importance: string
          annual_tuition_budget: string | null
          bio: string | null
          profile_photo: string | null
          highlight_url: string | null
          onboarding_complete: boolean
          match_engine_run_at: string | null
          subscription_active: boolean
          subscription_id: string | null
          subscription_status: string | null
          rerun_tokens: number
          rerun_tokens_used: number
          rerun_tokens_reset_at: string | null
          email_drafts_this_month: number
          email_drafts_reset_at: string | null
          allowance_tokens: number
          pack_tokens: number
          public_profile_slug: string | null
          public_profile_enabled: boolean
          jersey_number: string | null
          hero_image_url: string | null
          contact_phone: string | null
          contact_twitter: string | null
          contact_instagram: string | null
          contact_hudl: string | null
          contact_tiktok: string | null
          contact_youtube: string | null
          coach_name: string | null
          coach_email: string | null
          coach_phone: string | null
          class_rank: string | null
          intended_major: string | null
          academic_honors: string[] | null
          stats_json: Json | null
          awards_json: Json | null
          upcoming_events_json: Json | null
          match_schedule_json: Json | null
          highlight_clips_json: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sport_id?: string
          first_name: string
          last_name: string
          grad_year: number
          gender: 'Male' | 'Female'
          primary_position: string
          secondary_position?: string | null
          height_inches?: number | null
          weight_lbs?: number | null
          unweighted_gpa?: number | null
          sat_score?: number | null
          act_score?: number | null
          club_team: string
          highest_club_level: string
          high_school?: string | null
          home_city: string
          home_state: string
          recruiting_radius_mi?: number | null
          target_levels?: string[] | null
          forced_schools?: string[] | null
          tuition_importance?: string
          annual_tuition_budget?: string | null
          bio?: string | null
          profile_photo?: string | null
          highlight_url?: string | null
          onboarding_complete?: boolean
          match_engine_run_at?: string | null
          subscription_active?: boolean
          subscription_id?: string | null
          subscription_status?: string | null
          rerun_tokens?: number
          rerun_tokens_used?: number
          rerun_tokens_reset_at?: string | null
          email_drafts_this_month?: number
          email_drafts_reset_at?: string | null
          allowance_tokens?: number
          pack_tokens?: number
          public_profile_slug?: string | null
          public_profile_enabled?: boolean
          jersey_number?: string | null
          hero_image_url?: string | null
          contact_phone?: string | null
          contact_twitter?: string | null
          contact_instagram?: string | null
          contact_hudl?: string | null
          contact_tiktok?: string | null
          contact_youtube?: string | null
          coach_name?: string | null
          coach_email?: string | null
          coach_phone?: string | null
          class_rank?: string | null
          intended_major?: string | null
          academic_honors?: string[] | null
          stats_json?: Json | null
          awards_json?: Json | null
          upcoming_events_json?: Json | null
          match_schedule_json?: Json | null
          highlight_clips_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          grad_year?: number
          gender?: 'Male' | 'Female'
          primary_position?: string
          secondary_position?: string | null
          height_inches?: number | null
          weight_lbs?: number | null
          unweighted_gpa?: number | null
          sat_score?: number | null
          act_score?: number | null
          club_team?: string
          highest_club_level?: string
          high_school?: string | null
          home_city?: string
          home_state?: string
          recruiting_radius_mi?: number | null
          target_levels?: string[] | null
          forced_schools?: string[] | null
          tuition_importance?: string
          annual_tuition_budget?: string | null
          bio?: string | null
          profile_photo?: string | null
          highlight_url?: string | null
          onboarding_complete?: boolean
          match_engine_run_at?: string | null
          subscription_active?: boolean
          subscription_id?: string | null
          subscription_status?: string | null
          rerun_tokens?: number
          rerun_tokens_used?: number
          rerun_tokens_reset_at?: string | null
          email_drafts_this_month?: number
          email_drafts_reset_at?: string | null
          allowance_tokens?: number
          pack_tokens?: number
          public_profile_slug?: string | null
          public_profile_enabled?: boolean
          jersey_number?: string | null
          hero_image_url?: string | null
          contact_phone?: string | null
          contact_twitter?: string | null
          contact_instagram?: string | null
          contact_hudl?: string | null
          contact_tiktok?: string | null
          contact_youtube?: string | null
          coach_name?: string | null
          coach_email?: string | null
          coach_phone?: string | null
          class_rank?: string | null
          intended_major?: string | null
          academic_honors?: string[] | null
          stats_json?: Json | null
          awards_json?: Json | null
          upcoming_events_json?: Json | null
          match_schedule_json?: Json | null
          highlight_clips_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          id: string
          name: string
          verified_division: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO' | null
          conference: string | null
          city: string | null
          state: string | null
          campus_type: 'Urban' | 'Suburban' | 'Rural' | null
          enrollment: number | null
          avg_gpa: number | null
          acceptance_rate: number | null
          in_state_tuition: number | null
          out_state_tuition: number | null
          has_scholarship: boolean
          soccer_url: string | null
          sport_urls: Record<string, string | null>
          logo_url: string | null
          usc_top25_seasons: number
          prestige: 'Low' | 'Mid' | 'High' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          verified_division?: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO' | null
          conference?: string | null
          city?: string | null
          state?: string | null
          campus_type?: 'Urban' | 'Suburban' | 'Rural' | null
          enrollment?: number | null
          avg_gpa?: number | null
          acceptance_rate?: number | null
          in_state_tuition?: number | null
          out_state_tuition?: number | null
          has_scholarship?: boolean
          soccer_url?: string | null
          sport_urls?: Record<string, string | null>
          logo_url?: string | null
          usc_top25_seasons?: number
          prestige?: 'Low' | 'Mid' | 'High' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          verified_division?: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO' | null
          conference?: string | null
          city?: string | null
          state?: string | null
          campus_type?: 'Urban' | 'Suburban' | 'Rural' | null
          enrollment?: number | null
          avg_gpa?: number | null
          acceptance_rate?: number | null
          in_state_tuition?: number | null
          out_state_tuition?: number | null
          has_scholarship?: boolean
          soccer_url?: string | null
          sport_urls?: Record<string, string | null>
          logo_url?: string | null
          prestige?: 'Low' | 'Mid' | 'High' | null
          updated_at?: string
        }
        Relationships: []
      }
      player_schools: {
        Row: {
          id: string
          player_id: string
          school_id: string
          rank_order: number
          tier: 'Lock' | 'Realistic' | 'Reach' | null
          status: 'researching' | 'contacted' | 'interested' | 'campus_visit' | 'offer_received' | 'committed' | 'declined'
          overall_score: number | null
          geo_score: number | null
          acad_score: number | null
          level_score: number | null
          need_score: number | null
          pt_score: number | null
          tuition_score: number | null
          merit_value_score: number | null
          player_level_band: 'A' | 'B' | 'C' | 'D' | null
          roster_level_band: 'A' | 'B' | 'C' | 'D' | null
          roster_depth: string | null
          first_year_opportunity: 'Likely' | 'Possible' | 'Developmental' | 'Unlikely' | null
          merit_aid_potential: 'High' | 'Medium' | 'Low' | 'Unknown' | null
          estimated_merit_aid: string | null
          merit_aid_confidence: 'High' | 'Medium' | 'Low' | null
          merit_aid_note: string | null
          distance_miles: number | null
          acad_note: string | null
          level_note: string | null
          pt_note: string | null
          notes: string | null
          momentum: 'hot' | 'neutral' | 'cold' | null
          momentum_updated_at: string | null
          added_at: string
          updated_at: string
          source: 'match_engine' | 'manual'
        }
        Insert: {
          id?: string
          player_id: string
          school_id: string
          rank_order: number
          tier?: 'Lock' | 'Realistic' | 'Reach' | null
          status?: 'researching' | 'contacted' | 'interested' | 'campus_visit' | 'offer_received' | 'committed' | 'declined'
          overall_score?: number | null
          geo_score?: number | null
          acad_score?: number | null
          level_score?: number | null
          need_score?: number | null
          pt_score?: number | null
          tuition_score?: number | null
          merit_value_score?: number | null
          player_level_band?: 'A' | 'B' | 'C' | 'D' | null
          roster_level_band?: 'A' | 'B' | 'C' | 'D' | null
          roster_depth?: string | null
          first_year_opportunity?: 'Likely' | 'Possible' | 'Developmental' | 'Unlikely' | null
          merit_aid_potential?: 'High' | 'Medium' | 'Low' | 'Unknown' | null
          estimated_merit_aid?: string | null
          merit_aid_confidence?: 'High' | 'Medium' | 'Low' | null
          merit_aid_note?: string | null
          distance_miles?: number | null
          acad_note?: string | null
          level_note?: string | null
          pt_note?: string | null
          notes?: string | null
          momentum?: 'hot' | 'neutral' | 'cold' | null
          momentum_updated_at?: string | null
          added_at?: string
          updated_at?: string
          source?: 'match_engine' | 'manual'
        }
        Update: {
          rank_order?: number
          tier?: 'Lock' | 'Realistic' | 'Reach' | null
          status?: 'researching' | 'contacted' | 'interested' | 'campus_visit' | 'offer_received' | 'committed' | 'declined'
          notes?: string | null
          momentum?: 'hot' | 'neutral' | 'cold' | null
          momentum_updated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_schools_school_id_fkey'
            columns: ['school_id']
            isOneToOne: false
            referencedRelation: 'schools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'player_schools_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      contacts: {
        Row: {
          id: string
          player_id: string
          school_id: string
          contact_type: string
          direction: 'outbound' | 'inbound'
          contact_date: string
          subject: string | null
          notes: string | null
          email_body: string | null
          coach_name: string | null
          coach_email: string | null
          follow_up_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          school_id: string
          contact_type: string
          direction: 'outbound' | 'inbound'
          contact_date: string
          subject?: string | null
          notes?: string | null
          email_body?: string | null
          coach_name?: string | null
          coach_email?: string | null
          follow_up_date?: string | null
          created_at?: string
        }
        Update: {
          contact_type?: string
          direction?: 'outbound' | 'inbound'
          contact_date?: string
          subject?: string | null
          notes?: string | null
          email_body?: string | null
          coach_name?: string | null
          coach_email?: string | null
          follow_up_date?: string | null
        }
        Relationships: []
      }
      ai_drafts: {
        Row: {
          id: string
          player_id: string
          school_id: string | null
          draft_type: string
          subject: string | null
          body: string | null
          used: boolean
          contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          school_id?: string | null
          draft_type: string
          subject?: string | null
          body?: string | null
          used?: boolean
          contact_id?: string | null
          created_at?: string
        }
        Update: {
          subject?: string | null
          body?: string | null
          used?: boolean
          contact_id?: string | null
        }
        Relationships: []
      }
      match_engine_runs: {
        Row: {
          id: string
          player_id: string
          raw_tsv: string
          parsed_count: number | null
          error_rows: Json | null
          run_at: string
          player_snapshot: Json | null
        }
        Insert: {
          id?: string
          player_id: string
          raw_tsv: string
          parsed_count?: number | null
          error_rows?: Json | null
          run_at?: string
          player_snapshot?: Json | null
        }
        Update: {
          parsed_count?: number | null
          error_rows?: Json | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          id: string
          player_id: string
          player_school_id: string | null
          school_id: string
          tuition_per_year: number | null
          athletic_scholarship: number
          merit_aid: number
          need_based_aid: number
          other_aid: number
          offer_date: string | null
          decision_deadline: string | null
          status: 'evaluating' | 'accepted' | 'declined'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          player_school_id?: string | null
          school_id: string
          tuition_per_year?: number | null
          athletic_scholarship?: number
          merit_aid?: number
          need_based_aid?: number
          other_aid?: number
          offer_date?: string | null
          decision_deadline?: string | null
          status?: 'evaluating' | 'accepted' | 'declined'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tuition_per_year?: number | null
          athletic_scholarship?: number
          merit_aid?: number
          need_based_aid?: number
          other_aid?: number
          offer_date?: string | null
          decision_deadline?: string | null
          status?: 'evaluating' | 'accepted' | 'declined'
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parent_invites: {
        Row: {
          id: string
          player_id: string
          email: string
          token: string
          accepted: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          email: string
          token: string
          accepted?: boolean
          expires_at: string
          created_at?: string
        }
        Update: {
          accepted?: boolean
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          page_url: string | null
          user_agent: string | null
          message: string
          status: 'new' | 'read' | 'responded' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          page_url?: string | null
          user_agent?: string | null
          message: string
          status?: 'new' | 'read' | 'responded' | 'archived'
          created_at?: string
        }
        Update: {
          status?: 'new' | 'read' | 'responded' | 'archived'
        }
        Relationships: []
      }
      actions: {
        Row: {
          id: string
          player_id: string
          title: string
          description: string | null
          status: 'open' | 'completed' | 'snoozed' | 'archived'
          due_date: string | null
          completed_at: string | null
          player_school_id: string | null
          contact_id: string | null
          source: 'manual' | 'profile_tip' | 'follow_up' | 'system'
          source_payload: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          title: string
          description?: string | null
          status?: 'open' | 'completed' | 'snoozed' | 'archived'
          due_date?: string | null
          completed_at?: string | null
          player_school_id?: string | null
          contact_id?: string | null
          source?: 'manual' | 'profile_tip' | 'follow_up' | 'system'
          source_payload?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'open' | 'completed' | 'snoozed' | 'archived'
          due_date?: string | null
          completed_at?: string | null
          player_school_id?: string | null
          contact_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      grant_rerun_tokens: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      activate_subscription: {
        Args: {
          p_user_id: string
          p_subscription_id: string
          p_initial_tokens: number
        }
        Returns: undefined
      }
      consume_tokens: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: boolean
      }
      refund_tokens: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      refresh_subscription_allowance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      cancel_subscription_allowance: {
        Args: {
          p_subscription_id: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
