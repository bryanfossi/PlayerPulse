import type { Division, CampusType, Tier, MeritAidPotential, MeritAidConfidence, FirstYearOpportunity, Prestige, PlayerLevelBand, RosterLevelBand } from './match-engine'

export type { Division, CampusType, Tier, MeritAidPotential, MeritAidConfidence, FirstYearOpportunity, Prestige, PlayerLevelBand, RosterLevelBand }

export type TuitionImportance = 'Not a factor' | 'Somewhat important' | 'Very important' | 'Critical'
export type TargetLevel = 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO'
export type Gender = 'Male' | 'Female'

export type PlayerSchoolStatus =
  | 'researching'
  | 'contacted'
  | 'interested'
  | 'campus_visit'
  | 'offer_received'
  | 'committed'
  | 'declined'

export type ContactType =
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'text'
  | 'campus_visit'
  | 'official_visit'
  | 'unofficial_visit'
  | 'coach_at_game'
  | 'questionnaire'

export type EmailDraftType =
  | 'initial_outreach'
  | 'follow_up'
  | 'thank_you'
  | 'campus_visit_request'
  | 'offer_response'

export interface Player {
  id: string
  user_id: string
  first_name: string
  last_name: string
  grad_year: number
  gender: Gender
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
  target_levels: TargetLevel[] | null
  forced_schools: string[] | null
  tuition_importance: TuitionImportance
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
  stats_json: Record<string, string> | null
  awards_json: PlayerAward[] | null
  upcoming_events_json: PlayerEvent[] | null
  match_schedule_json: ScheduleEntry[] | null
  highlight_clips_json: HighlightClip[] | null
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  name: string
  verified_division: Division | null
  conference: string | null
  city: string | null
  state: string | null
  campus_type: CampusType | null
  enrollment: number | null
  avg_gpa: number | null
  acceptance_rate: number | null
  in_state_tuition: number | null
  out_state_tuition: number | null
  has_scholarship: boolean
  soccer_url: string | null
  logo_url: string | null
  usc_top25_seasons: number
  prestige: Prestige | null
  created_at: string
  updated_at: string
}

export interface PlayerSchool {
  id: string
  player_id: string
  school_id: string
  rank_order: number
  tier: Tier | null
  status: PlayerSchoolStatus
  overall_score: number | null
  geo_score: number | null
  acad_score: number | null
  level_score: number | null
  need_score: number | null
  pt_score: number | null
  tuition_score: number | null
  merit_value_score: number | null
  player_level_band: PlayerLevelBand | null
  roster_level_band: RosterLevelBand | null
  roster_depth: string | null
  first_year_opportunity: FirstYearOpportunity | null
  merit_aid_potential: MeritAidPotential | null
  estimated_merit_aid: string | null
  merit_aid_confidence: MeritAidConfidence | null
  merit_aid_note: string | null
  distance_miles: number | null
  acad_note: string | null
  level_note: string | null
  pt_note: string | null
  notes: string | null
  added_at: string
  updated_at: string
  source: 'match_engine' | 'manual'
}

export interface Contact {
  id: string
  player_id: string
  school_id: string
  contact_type: ContactType
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

// Public profile structured data types
export interface PlayerAward {
  year: string
  title: string
  body: string
  type: 'soccer' | 'academic'
}

export interface PlayerEvent {
  name: string
  type: string
  date: string
  location: string
  description: string
  url: string
}

export interface ScheduleEntry {
  date: string
  opponent: string
  competition: string
  location: string
  time: string
  result: string
}

export interface HighlightClip {
  title: string
  url: string
  date: string
  tags: string[]
  thumb: string
}

export type OfferStatus = 'evaluating' | 'accepted' | 'declined'

export interface Offer {
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
  status: OfferStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AiDraft {
  id: string
  player_id: string
  school_id: string | null
  draft_type: EmailDraftType
  subject: string | null
  body: string | null
  used: boolean
  contact_id: string | null
  created_at: string
}
