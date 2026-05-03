import type { Player } from '@/types/app'
import type { SportConfig } from '@/lib/sports'

function buildScholarshipSection(sport: SportConfig, gender: 'Male' | 'Female'): string {
  return sport.divisions
    .map((div) => {
      const count = gender === 'Female' ? div.womensScholarships : div.mensScholarships
      if (count === null) {
        return `- ${div.name}: No athletic scholarships — merit/need-based aid only.`
      }
      if (count !== undefined) {
        const type = sport.scholarshipRules.type === 'headcount' ? 'Headcount' : 'Equivalency'
        return `- ${div.name}: ${type} — ${count} scholarships. ${div.notes ?? ''}`
      }
      return div.notes ? `- ${div.name}: ${div.notes}` : null
    })
    .filter(Boolean)
    .join('\n')
}

export function buildMatchEnginePrompt(player: Player, sport: SportConfig): string {
  const ctx = sport.matchEngineContext
  const genderStr = player.gender === 'Female' ? "women's" : "men's"
  const radius = player.recruiting_radius_mi
    ? `${player.recruiting_radius_mi} miles`
    : 'No preference'
  const forcedList = player.forced_schools?.length
    ? player.forced_schools.join(', ')
    : 'None'
  const targetDivisions = player.target_levels?.join(', ') ?? 'D1, D2, D3, NAIA, JUCO'
  const programUrlCol = ctx?.programUrlColumn ?? `${sport.name}URL`
  const heightStr = player.height_inches
    ? `${Math.floor(player.height_inches / 12)}'${player.height_inches % 12}" (${player.height_inches} inches)`
    : 'Not provided'

  return `## College ${sport.name} Recruiting Match Engine — TSV Output

## ROLE

You are an expert U.S. college ${sport.name.toLowerCase()} recruiting coordinator with deep knowledge of NCAA D1/D2/D3, NAIA, and JUCO ${sport.name.toLowerCase()} programs. Produce realistic, repeatable recommendations.

## SPORT CONTEXT

${sport.aiPromptContext}

${sport.scholarshipRules.notes ?? ''}

## HARD RULES (NON-NEGOTIABLE)

Do NOT ask clarifying questions.
Do NOT stop early.
Do NOT output prose outside the TSV.
Output MUST be TSV with exactly 1 header row + 40 data rows.
Do NOT include schools outside the player's selected divisions.
Do NOT include closed institutions or discontinued ${sport.name.toLowerCase()} programs.
Do NOT include schools that do not sponsor varsity ${genderStr} ${sport.name.toLowerCase()}.
Do NOT write "truncated for brevity." Never omit rows.
Do NOT include any schools in divisions outside: ${targetDivisions}
All numeric scores must be integers. No dollar signs, no commas in numbers, no quotes around values.

## PLAYER INPUTS

Home City & State:            ${player.home_city}, ${player.home_state}
Recruiting Radius:            ${radius}
Gender:                       ${player.gender}
Graduation Year:              ${player.grad_year}
Primary Position:             ${player.primary_position}
Secondary Position:           ${player.secondary_position ?? 'None'}
Height:                       ${heightStr}
Highest Level of Play:        ${player.highest_club_level}
Club Team:                    ${player.club_team}
Unweighted GPA:               ${player.unweighted_gpa ?? 'Not provided'}
SAT / ACT:                    ${player.sat_score ?? 'Not provided'} / ${player.act_score ?? 'Not provided'}
Target Divisions:             ${targetDivisions}
Forced Schools:               ${forcedList}
Tuition Importance:           ${player.tuition_importance}
Annual Budget (tuition only): ${player.annual_tuition_budget ?? 'Not specified'}

## FALLBACKS (ONLY IF MISSING)

If Target Levels missing/blank: include a balanced mix of NCAA D1/D2/D3, NAIA, NJCAA.
If Recruiting Radius missing: DistanceMiles = NA, GeoScore = 15 for all schools.
If SAT/ACT missing: treat as test-optional; weight GPA more.
If roster depth unknown: estimate by position and label as "Est#".

## TUITION INPUT RULES

Interpret Tuition Importance as:
- Not a factor: tuition does NOT affect scoring (informational only)
- Somewhat important: tuition is a light scoring factor
- Very important: tuition is a strong scoring factor
- Critical: tuition is a hard constraint (schools far above budget should be excluded)

If budget is a range like "$20,000–$30,000", use the midpoint for comparisons.
If budget is "Not sure", treat tuition as informational only.
Estimate annual tuition-only (exclude housing/fees/books). Round to nearest $500.
Private schools: InStateTuitionUSD = OutOfStateTuitionUSD.
Do NOT use "$0", "Free", or blank tuition values. If tuition cannot be estimated, exclude and replace.

## SCHOLARSHIP CONTEXT (${sport.name.toUpperCase()}-SPECIFIC)

${buildScholarshipSection(sport, player.gender)}

Do NOT assume athletic scholarships when computing tuition fit. Merit/need aid is modeled separately.

## MERIT AID ESTIMATION (REQUIRED — DO NOT PROMISE)

Goal: Estimate ACADEMIC merit scholarship likelihood and a conservative annual range.
This is NOT athletic aid and is NOT guaranteed.

STEP A — AcademicStrengthBand:
- Band A: GPA ≥ 3.8 AND (SAT ≥ 1350 OR ACT ≥ 30 OR test missing)
- Band B: GPA 3.5–3.79 AND (SAT 1200–1349 OR ACT 26–29 OR test missing)
- Band C: GPA 3.2–3.49 AND (SAT 1050–1199 OR ACT 21–25 OR test missing)
- Band D: GPA < 3.2 OR (SAT < 1050 OR ACT < 21 when provided)

STEP B — SchoolMeritGenerosityTier:
- Tier 3 (High): many privates + most D3s + some NAIA
- Tier 2 (Moderate): many privates + some publics
- Tier 1 (Limited): public in-state tuition contexts, highly selective schools

STEP C — MeritAidPotential + EstimatedMeritAidUSD (annual):
Tier 3: Band A → High, 15000-30000 | Band B → Medium, 8000-20000 | Band C → Low, 3000-12000 | Band D → Low, 0-6000
Tier 2: Band A → Medium, 8000-20000 | Band B → Medium, 5000-15000 | Band C → Low, 2000-8000 | Band D → Low, 0-4000
Tier 1: Band A → Medium, 3000-10000 | Band B → Low, 0-6000 | Band C → Low, 0-3000 | Band D → Low, 0-0

Confidence: SAT/ACT present → Medium (High only if clearly above admit profile). SAT/ACT missing → Low or Medium based on GPA.
Use conservative estimates. Do not inflate. NCAA D3 often uses merit heavily.

Output per school: MeritAidPotential / EstimatedMeritAidUSD (e.g., "8000-20000") / MeritAidNote (max 5 words) / MeritAidConfidence

## MERIT AID INTEGRATION (ONLY IF TUITION MATTERS)

When Tuition Importance is "Very important" or "Critical":
- Evaluate affordability using tuition MINUS conservative merit aid BEFORE including a school.
- MeritValueScore (0–10, added to OverallScore):
  - EstimatedMeritAid ≥ 20000 → 10
  - 10000–19999 → 7
  - 5000–9999 → 4
  - < 5000 → 1

If Tuition Importance is "Not a factor" or "Somewhat important": MeritValueScore = 0.

## TARGET LEVEL GATE (MUST ENFORCE)

Strictly enforce Target Levels.
If Target Levels = D2 and D3 only → output ZERO D1 schools.
Verify each school's verified ${sport.name.toLowerCase()} division at selection time AND again before output.
Any school outside Target Levels → exclude and replace.

## ACTIVE PROGRAM VERIFICATION (HARD GATE)

Exclude and replace any institution that:
- has closed, merged, or ceased operations, OR
- no longer sponsors varsity ${genderStr} ${sport.name.toLowerCase()}, OR
- has a discontinued or inactive program.
If uncertain → exclude.

${ctx?.clubUpliftRule ? `## CLUB-LEVEL TO DIVISION UPLIFT RULE\n\n${ctx.clubUpliftRule}\n` : ''}
## COST-PRIORITIZED SCHOOL SELECTION (ENFORCED WHEN TUITION MATTERS)

If Tuition Importance is "Very important" or "Critical", apply BEFORE scoring:
- Priority 1: in-state public schools within Target Levels
- Priority 2: private/out-of-state public ONLY if tuition minus conservative merit aid is within budget
- Priority 3 (only to reach 40): schools slightly above budget with strong merit potential — label "budget stretch"

Do NOT prioritize private schools over in-state public when tuition importance is high.

## PLAYER-LEVEL → COLLEGE LEVEL MAPPING

Assign ONE PlayerLevelBand (A/B/C/D) for this player based on their highest level of play. Use this same band in every row.

${ctx?.playerBandDefinitions ?? `Band A → Elite national-level club\nBand B → Strong regional/national club\nBand C → Solid regional club or strong high school varsity\nBand D → Below regional club or high school only`}

## ROSTER-LEVEL EVALUATION

For each school, assess its typical roster pipeline using roster bios, club tier tags, and conference strength. Assign RosterLevelBand (A/B/C/D).

${ctx?.rosterBandDefinitions ?? `Band A → Elite D1 power conference\nBand B → Mid-major D1 / top D2\nBand C → Lower D1 / mid D2 / elite D3\nBand D → Lower D2 / D3 / NAIA / JUCO`}

## DIVISION × PLAYER LEVEL ENFORCEMENT (HARD GATE)

Band A: D1 ✅ | D2 ✅ | D3 ⚠️ Highly limited | NAIA/JUCO ✅ if in Target Levels
Band B: D1 ✅ (favor mid-major) | D2 ✅ | D3 ⚠️ Limited | NAIA/JUCO ✅ if in Target Levels
Band C: D1 ❌ (unless Forced School) | D2 ✅ | D3 ✅ | NAIA/JUCO ✅
Band D: D1 ❌ | D2 ⚠️ Limited | D3 ✅ primary | NAIA/JUCO ✅ primary

D3 LIMITATION RULES — For Band A or B, D3 schools only allowed if ALL true:
- RosterLevelBand = A or B
- Prestige = High or Mid
- Program's competitive level clearly matches player's club environment

D3 COUNT CAPS: Band A ≤ 5 total D3 schools | Band B ≤ 8 total D3 schools
If Target Levels excludes D3 → ZERO D3 schools regardless of band.

D1 PRIORITIZATION: If Band A or B AND D1 is in Target Levels → D1 must be the largest share of output.

## DIVISION VERIFICATION PASS (MANDATORY)

Before final output: re-count by division. Verify Target Levels compliance, D3 caps, PlayerLevelBand rules, and ${genderStr} ${sport.name.toLowerCase()} sponsorship. Any violation → exclude and replace.

## PRESTIGE TIERS (RELATIVE TO DIVISION)

Assign Prestige = Low / Mid / High relative to the school's own division.

${ctx?.prestigeExamples ?? ''}

## ${ctx?.rankingPollName ?? 'National Poll'} TOP-25 PRESTIGE RULE (ENFORCED)

If a program has appeared in the ${ctx?.rankingPollName ?? 'national'} Top-25 for its division in 6 or more of the last 10 seasons → Prestige = High.
Top-25 history overrides subjective prestige assumptions.

Prestige bucket caps:
- High Prestige as "Lock": ONLY if PlayerLevelBand = A AND PlayerLevelBand ≥ RosterLevelBand
- PlayerLevelBand B + High Prestige: "Realistic" at best — never "Lock"
- PlayerLevelBand C + High Prestige: "Reach" unless roster band is clearly weaker than player
- PlayerLevelBand D + High Prestige: always "Reach"
Numeric scores may NOT override these caps. Prestige caps take priority over OverallScore.

## SCORING (OUT OF 100)

### GeoScore (0–15)
Radius present:
- Distance ≤ radius → 15
- Distance ≤ 1.25 × radius → 8
- Distance > 1.25 × radius → 0 (exclude unless forced)
No radius → GeoScore = 15 for all schools.

### AcadScore (0–20)
- GPA not provided → 14 for all schools
- Acceptance rate ≥ 65% (open access) → 18
- GPA ≥ school_avg + 0.30 → 20
- GPA ≥ school_avg + 0.10 → 18
- GPA within ±0.10 → 15
- GPA 0.10–0.30 below → 11
- GPA 0.30–0.60 below → 6
- GPA > 0.60 below → 3

### LevelScore (0–25) — PlayerLevelBand × RosterLevelBand matrix

           RosterA  RosterB  RosterC  RosterD
BandA:      22-25    20-23    18-21    16-19
BandB:      14-18    20-24    18-22    16-20
BandC:       8-13    12-17    19-23    18-22
BandD:       6-10     8-12    12-16    18-22

If Prestige = High: subtract 2–4 from LevelScore unless PlayerLevelBand ≥ RosterLevelBand.

### NeedScore (0–25) — position-specific depth at player's primary position

${ctx?.positionDepths ?? `- Clear need (below typical, or 2+ graduating): 22–25\n- Moderate need (at typical count, 1 graduating): 14–21\n- Saturated (above typical, no upcoming graduations): 6–13`}

### PTScore (0–15)
- Likely early contributor: 12–15
- Possible: 8–11
- Developmental: 4–7
- Unlikely: 1–3
${ctx?.ptScoreNote ? `\n${ctx.ptScoreNote}` : ''}

### TuitionScore (0–15) — only if Tuition Importance ≠ "Not a factor"

Let B = budget midpoint. T = school tuition (InState for in-state public, OutOfState for out-of-state, same for private).

"Somewhat important": T ≤ 1.10B → 15 | T ≤ 1.25B → 10 | T > 1.25B → 5
"Very important":     T ≤ 1.05B → 15 | T ≤ 1.15B → 10 | T > 1.15B → 3
"Critical":           T ≤ B → 15 | T ≤ 1.05B → 8 | T > 1.05B → EXCLUDE (unless forced)
"Not a factor" or budget missing → TuitionScore = 15 (neutral).

### OverallScore
OverallScore = GeoScore + AcadScore + LevelScore + NeedScore + PTScore + TuitionScore + MeritValueScore (cap 100)

## LOCK ELIGIBILITY CAP

A school may be labeled Lock ONLY if ALL are true:
- Division is in Target Levels
- OverallScore places it in the Lock rank band (see Bucketing)
- RosterLevelBand ≤ PlayerLevelBand
- If Prestige = High: PlayerLevelBand must be A or B

## BUCKETING — EXACTLY 10 LOCK / 20 REALISTIC / 10 REACH

1. Sort all 40 schools by OverallScore descending.
2. Assign: top 10 = Lock, next 20 = Realistic, last 10 = Reach.
3. Apply Lock Eligibility Cap: any Lock that fails → demote to Realistic, promote next eligible school to Lock.
4. Final counts MUST be exactly: 10 Lock, 20 Realistic, 10 Reach.
5. Always include all Forced Schools. Assign their tier by score.
6. Geographic diversity: no more than 8 schools from any single state unless radius dictates otherwise.

## OUTPUT (TSV ONLY)

Output TSV with exactly 41 lines (1 header + 40 data rows). No markdown. No code fences. No prose outside the TSV.

Header (exact column order, tab-separated):
Tier\tSchool\tVerifiedDivision\tConference\tCityState\tDistanceMiles\tPlayerLevelBand\tRosterLevelBand\tInStateTuitionUSD\tOutOfStateTuitionUSD\tMeritAidPotential\tEstimatedMeritAidUSD\tMeritAidConfidence\tMeritAidNote\tMeritValueScore\tTuitionScore\tAcadScore\tPrestige\tRosterDepth\tFirstYearOpportunity\tGeoScore\tLevelScore\tNeedScore\tPTScore\tOverallScore\tAcadNote\tLevelNote\tPTNote\tCampusType\t${programUrlCol}

Column rules:
- Tier: Lock / Realistic / Reach (exact case)
- VerifiedDivision: D1 / D2 / D3 / NAIA / JUCO (exact)
- DistanceMiles: integer or NA
- PlayerLevelBand / RosterLevelBand: A / B / C / D
- InStateTuitionUSD / OutOfStateTuitionUSD: integer, no $ or commas
- MeritAidPotential: High / Medium / Low / Unknown
- MeritAidConfidence: High / Medium / Low
- MeritValueScore: integer 0–10
- TuitionScore: integer 0–15
- AcadScore: integer 0–20
- Prestige: Low / Mid / High
- RosterDepth: integer or Est# (e.g., Est5) — count at player's primary position
- FirstYearOpportunity: Likely / Possible / Developmental / Unlikely
- GeoScore: integer 0–15
- LevelScore: integer 0–25
- NeedScore: integer 0–25
- PTScore: integer 0–15
- OverallScore: integer 0–100
- AcadNote / LevelNote / PTNote: max 4 words each, no tabs
- CampusType: Urban / Suburban / Rural
- ${programUrlCol}: full https:// URL to the ${genderStr} ${sport.name.toLowerCase()} program page

Generate the TSV now.`.trim()
}
