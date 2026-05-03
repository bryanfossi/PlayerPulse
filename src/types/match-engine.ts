export type PlayerLevelBand = 'A' | 'B' | 'C' | 'D'
export type RosterLevelBand = 'A' | 'B' | 'C' | 'D'
export type Tier = 'Lock' | 'Realistic' | 'Reach'
export type MeritAidPotential = 'High' | 'Medium' | 'Low' | 'Unknown'
export type MeritAidConfidence = 'High' | 'Medium' | 'Low'
export type FirstYearOpportunity = 'Likely' | 'Possible' | 'Developmental' | 'Unlikely'
export type Prestige = 'Low' | 'Mid' | 'High'
export type Division = 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO'
export type CampusType = 'Urban' | 'Suburban' | 'Rural'

export interface ParsedMatchResult {
  tier: Tier
  school: string
  verified_division: Division
  conference: string
  city_state: string
  distance_miles: number | null
  player_level_band: PlayerLevelBand
  roster_level_band: RosterLevelBand
  in_state_tuition: number
  out_state_tuition: number
  merit_aid_potential: MeritAidPotential
  estimated_merit_aid: string
  merit_aid_confidence: MeritAidConfidence
  merit_aid_note: string
  merit_value_score: number
  tuition_score: number
  acad_score: number
  prestige: Prestige
  roster_depth: string
  first_year_opportunity: FirstYearOpportunity
  geo_score: number
  level_score: number
  need_score: number
  pt_score: number
  overall_score: number
  acad_note: string
  level_note: string
  pt_note: string
  campus_type: CampusType
  program_url: string
}

export interface MatchEngineResponse {
  success: boolean
  schools_generated: number
  results: ParsedMatchResult[]
  run_id: string
  error?: string
}
