/**
 * PlayerPulse Multi-Sport Configuration Types
 * ------------------------------------------------------------
 * Every sport supported by the platform is described by a
 * SportConfig object. Adding a new sport should require only
 * creating a new file in this directory and registering it in
 * ./index.ts — no migrations, no UI changes, no route changes.
 * ------------------------------------------------------------
 */

export type GoverningBody = 'NCAA' | 'NAIA' | 'NJCAA' | 'Other'

export type DivisionConfig = {
  /** unique slug within the sport, e.g. 'd1', 'd2', 'naia', 'njcaa-d1' */
  id: string
  /** display name, e.g. 'NCAA D1' */
  name: string
  governingBody: GoverningBody
  /** approximate number of programs at this level */
  programCount?: number
  /**
   * Equivalency scholarships available per program.
   * `null` explicitly means "no athletic scholarships offered at this level"
   * (e.g. NCAA D3). `undefined` means "varies / not yet populated".
   */
  mensScholarships?: number | null
  womensScholarships?: number | null
  /** freeform note, e.g. headcount vs equivalency nuance or JUCO splits */
  notes?: string
}

export type ScholarshipType = 'equivalency' | 'headcount' | 'mixed' | 'none'

export type ScholarshipConfig = {
  /**
   * How scholarships are awarded for this sport across NCAA.
   * - equivalency: split across many players (soccer, lacrosse, baseball)
   * - headcount:   each scholarship is a full ride to one player (basketball D1)
   * - mixed:       depends on division/gender
   * - none:        sport does not offer athletic scholarships
   */
  type: ScholarshipType
  /** short summary to surface in UI and AI prompts */
  summary: string
  /** optional longer-form notes */
  notes?: string
}

export type TimelineConfig = {
  /**
   * Grade when most programs start tracking recruits,
   * e.g. '9th', '10th', '11th'.
   */
  earlyContactGrade?: string
  /**
   * Earliest date NCAA rules allow direct coach-initiated contact,
   * expressed relative to grade year, e.g. 'June 15 after sophomore year'.
   */
  officialContactDate?: string
  /** Quiet / dead periods the sport observes */
  deadPeriods?: string[]
  /** Free-form additional context */
  notes?: string
}

export type StatConfig = {
  /** machine id, e.g. 'goals', 'assists', 'save_pct' */
  id: string
  /** display label */
  name: string
  /** optional unit, e.g. '%', 'min' */
  unit?: string
  /**
   * Which positions this stat applies to. Empty / undefined means
   * all positions. Values should match entries in `positions`.
   */
  positionScope?: string[]
}

export type EmailTemplateConfig = {
  /** machine id shared with the ai_drafts.draft_type enum */
  id: string
  /** human name shown in UI */
  name: string
  /** default subject suggestion (AI may override) */
  subject: string
  /**
   * Prompt-side context describing when and how this template is used.
   * This is what gets injected into the LLM prompt to produce the draft.
   */
  body: string
}

/**
 * Sport-specific context injected into the match engine prompt.
 * Required for any sport that uses the in-app match engine.
 * Sports with active: false do not need this populated until launch.
 */
export type MatchEngineContext = {
  /** Band A/B/C/D player level definitions for this sport (club pipeline, exposure level) */
  playerBandDefinitions: string
  /** Band A/B/C/D roster level definitions with conference/program examples */
  rosterBandDefinitions: string
  /** Typical healthy roster counts by position + NeedScore guidance */
  positionDepths: string
  /** Prestige tier examples (High/Mid/Low) per division, gender-aware */
  prestigeExamples: string
  /** Name of the authoritative national ranking poll (e.g. "United Soccer Coaches", "AVCA") */
  rankingPollName: string
  /** Final TSV column name for the program URL (e.g. "SoccerURL", "VolleyballURL") */
  programUrlColumn: string
  /** Optional: GK/Libero/positional PT note appended to PTScore rules */
  ptScoreNote?: string
  /** Optional: club-level uplift rule for high-level players → more D1 schools */
  clubUpliftRule?: string
}

export type SportConfig = {
  /** unique slug e.g. 'soccer', 'basketball' */
  id: string
  /** display name e.g. 'Soccer', 'Basketball' */
  name: string
  /** lucide-react icon name */
  icon: string
  /** Divisions / levels within this sport */
  divisions: DivisionConfig[]
  scholarshipRules: ScholarshipConfig
  recruitingTimeline: TimelineConfig
  /** Player positions for this sport (ordered roughly back-to-front) */
  positions: string[]
  /** Club/pipeline level options shown in the onboarding wizard dropdown */
  clubLevels: string[]
  /** Trackable stats for this sport */
  stats: StatConfig[]
  /** Event types relevant to this sport */
  showcaseTypes: string[]
  /** Email templates / draft flows available for this sport */
  emailTemplates: EmailTemplateConfig[]
  /** Short sport context injected into all AI prompts (email, tips, etc.) */
  aiPromptContext: string
  /** Full match engine prompt context. Required before setting active: true. */
  matchEngineContext?: MatchEngineContext
  /** Whether this sport is live in the app */
  active: boolean
}
