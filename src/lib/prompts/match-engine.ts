import type { Player } from '@/types/app'

export function buildMatchEnginePrompt(player: Player): string {
  const radius = player.recruiting_radius_mi
    ? `${player.recruiting_radius_mi} miles — schools beyond this radius receive a reduced GeoScore (see GEOSCORE rules)`
    : 'No preference — all schools receive full GeoScore regardless of distance'

  const forcedList = player.forced_schools?.length
    ? player.forced_schools.join(', ')
    : 'None'

  const targetDivisions = player.target_levels?.join(', ') ?? 'D1, D2, D3, NAIA, JUCO'

  return `
ROLE
You are an expert U.S. college soccer recruiting coordinator with encyclopedic knowledge of NCAA D1/D2/D3, NAIA, and JUCO programs. Produce a calibrated, realistic Top 40 school list for this player.

HARD RULES (NON-NEGOTIABLE)
- Do NOT ask clarifying questions.
- Do NOT stop early or write "truncated for brevity."
- Do NOT output prose, markdown, or any text outside the TSV.
- Output MUST be exactly 1 header row + 40 data rows, tab-separated.
- Do NOT include schools outside the player's target divisions.
- Do NOT include closed institutions or discontinued soccer programs.
- All schools must have active, currently competing ${player.gender === 'Female' ? "women's" : "men's"} soccer programs.
- All numeric scores must be integers with no decimal points.
- No dollar signs, no commas in numbers, no quotes around values.

PLAYER INPUTS
Home City & State:   ${player.home_city}, ${player.home_state}
Recruiting Radius:   ${radius}
Gender:              ${player.gender}
Graduation Year:     ${player.grad_year}
Primary Position:    ${player.primary_position}
Secondary Position:  ${player.secondary_position ?? 'None'}
Highest Club Level:  ${player.highest_club_level}
Club Team:           ${player.club_team}
Unweighted GPA:      ${player.unweighted_gpa ?? 'Not provided'}
SAT / ACT:           ${player.sat_score ?? 'Not provided'} / ${player.act_score ?? 'Not provided'}
Target Divisions:    ${targetDivisions}
Forced Schools:      ${forcedList}
Tuition Importance:  ${player.tuition_importance}
Annual Budget (tuition only): ${player.annual_tuition_budget ?? 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CLASSIFY PLAYER LEVEL BAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assign the player ONE band based on highest_club_level:
  Band A → MLS Next, ECNL National
  Band B → ECNL-RL, EDP Premier, EDP National
  Band C → EDP, NPL, USYS Regional leagues
  Band D → USYS State, High School Only, Other / unknown

Use this same PlayerBand value in every row of the TSV.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — CLASSIFY EACH SCHOOL'S ROSTER BAND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assign each school's program a RosterBand:
  Band A → Power 5 D1, consistently top-25 programs (UNC, Stanford, UCLA, Florida State, Penn State, Notre Dame, etc.)
  Band B → Mid-major D1 (Atlantic 10, WCC, AAC, Mountain West, Conference USA); top D2 programs (top GAC, GNAC, GLIAC)
  Band C → Lower-resource D1 (Big South, NEC, SWAC, OVC); solid mid-tier D2; elite D3 (Williams, Amherst, Tufts, Middlebury)
  Band D → Lower D2, lower D3, NAIA programs, JUCO programs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — COMPUTE SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEVELSCORE (25 pts) — exact matrix, row = PlayerBand, col = RosterBand:
           RosterA  RosterB  RosterC  RosterD
  BandA:     20       25       17        9
  BandB:     13       20       25       17
  BandC:      6       13       20       25
  BandD:      3        7       14       20

GEOSCORE (15 pts):
  Radius = "No preference"     → GeoScore = 15 for every school
  Distance ≤ radius            → GeoScore = 15
  Distance ≤ 1.5 × radius      → GeoScore = 11
  Distance ≤ 2.0 × radius      → GeoScore = 7
  Distance > 2.0 × radius      → GeoScore = 3
  Distance = NA (no radius)    → GeoScore = 15

ACADSCORE (20 pts):
  If player GPA not provided   → AcadScore = 14 for all schools
  If school acceptance_rate ≥ 65% (open access) → AcadScore = 18
  Otherwise compare player GPA to estimated school average admitted GPA:
    GPA ≥ school_avg + 0.30    → AcadScore = 20
    GPA ≥ school_avg + 0.10    → AcadScore = 18
    GPA within ±0.10           → AcadScore = 15
    GPA 0.10–0.30 below        → AcadScore = 11
    GPA 0.30–0.60 below        → AcadScore = 6
    GPA > 0.60 below           → AcadScore = 3

NEEDSCORE (25 pts) — estimate current roster depth at player's primary position:
  0–2 rostered at position     → NeedScore = 25
  3–4                          → NeedScore = 21
  5–6                          → NeedScore = 15
  7–8                          → NeedScore = 9
  9+                           → NeedScore = 4
  Unknown                      → NeedScore = 13

PTSCORE (15 pts) — first-year playing time likelihood:
  Likely     (LevelScore ≥ 20 AND NeedScore ≥ 20) → PTScore = 15
  Possible   (LevelScore ≥ 17 AND NeedScore ≥ 15) → PTScore = 11
  Developmental (LevelScore ≥ 13 OR NeedScore ≥ 13) → PTScore = 6
  Unlikely   (all others)                         → PTScore = 2

TUITIONSCORE (0–5 pts, ONLY when tuition_importance ≠ "Not a factor"):
  At or below budget           → TuitionScore = 5
  Up to 20% over budget        → TuitionScore = 3
  20–50% over budget           → TuitionScore = 1
  > 50% over budget            → TuitionScore = 0
  If budget not specified      → TuitionScore = 0

MERIT AID ASSESSMENT (assign for every school):
  merit_aid_potential:
    High    → documented merit awards typically > $10,000/yr with broad eligibility
    Medium  → merit available, typically $5,000–$10,000/yr
    Low     → highly selective merit or primarily need-based only
    Unknown → insufficient public data
  estimated_merit_aid: annual range string, e.g., "8000-20000" or "0-0"
  merit_aid_confidence: High / Medium / Low
  merit_aid_note: one sentence (e.g., "Bucknell awards merit scholarships averaging $22k to competitive applicants.")

MERITVALUESCORE (0–5 pts, bonus added to OverallScore):
  High potential + High confidence    → 5
  High potential + Medium confidence  → 4
  Medium potential (any confidence)   → 3
  Low potential                       → 1
  Unknown                             → 2

OVERALL SCORE:
  OverallScore = GeoScore + AcadScore + LevelScore + NeedScore + PTScore + MeritValueScore
  If tuition_importance ≠ "Not a factor": OverallScore += TuitionScore
  Cap at 100.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ASSIGN TIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Lock      → OverallScore ≥ 72 AND LevelScore ≥ 17
  Reach     → LevelScore ≤ 13 OR OverallScore ≤ 52
  Realistic → all others

TIER CONSTRAINTS (enforce after initial assignment):
  Lock count must be ≤ 13. If > 13 qualify, convert lowest-scoring excess to Realistic.
  Reach count must be ≥ 7. If < 7 qualify, convert lowest-scoring Realistic schools to Reach.
  Forced schools always included; assign tier by score.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — SELECT 40 SCHOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Exactly 40 unique schools.
  - Only include schools from target divisions: ${targetDivisions}
  - Always include all forced schools: ${forcedList}
  - Geographic diversity: no more than 8 schools from any single state unless radius dictates otherwise.
  - Include a balance of well-known programs and lesser-known "hidden gem" fits.
  - Sort rows by OverallScore descending (rank 1 = highest score).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output ONLY a TSV with this exact header row, then 40 data rows. No other text.

Tier\tSchool\tDivision\tConference\tCity/State\tDistance(mi)\tPlayerBand\tRosterBand\tInStateTuition\tOutStateTuition\tMeritAidPotential\tEstimatedMeritAid\tMeritAidConfidence\tMeritAidNote\tMeritValueScore\tTuitionScore\tAcadScore\tPrestige\tRosterDepth\tFirstYearOpportunity\tGeoScore\tLevelScore\tNeedScore\tPTScore\tOverallScore\tAcadNote\tLevelNote\tPTNote\tCampusType\tSoccerURL

Column constraints:
  Tier              → Lock / Realistic / Reach (exact case)
  Division          → D1 / D2 / D3 / NAIA / JUCO (exact)
  Distance(mi)      → integer OR the string NA
  PlayerBand        → A / B / C / D (same for all rows)
  RosterBand        → A / B / C / D
  InStateTuition    → integer, no $ or commas
  OutStateTuition   → integer, no $ or commas
  MeritAidPotential → High / Medium / Low / Unknown
  MeritAidConfidence → High / Medium / Low
  MeritValueScore   → integer 0–5
  TuitionScore      → integer 0–5
  AcadScore         → integer 0–20
  Prestige          → Low / Mid / High
  RosterDepth       → integer or Est# (e.g., Est5)
  FirstYearOpportunity → Likely / Possible / Developmental / Unlikely
  GeoScore          → integer 0–15
  LevelScore        → integer 0–25
  NeedScore         → integer 0–25
  PTScore           → integer 0–15
  OverallScore      → integer 0–100
  AcadNote          → one sentence, no tabs
  LevelNote         → one sentence, no tabs
  PTNote            → one sentence, no tabs
  CampusType        → Urban / Suburban / Rural
  SoccerURL         → full https:// URL to the program's soccer page

Generate the TSV now.
`.trim()
}
