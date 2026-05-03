import type { ParsedMatchResult } from '@/types/match-engine'

const EXPECTED_COLS = 30

const COL = {
  tier: 0,
  school: 1,
  verified_division: 2,
  conference: 3,
  city_state: 4,
  distance_miles: 5,
  player_level_band: 6,
  roster_level_band: 7,
  in_state_tuition: 8,
  out_state_tuition: 9,
  merit_aid_potential: 10,
  estimated_merit_aid: 11,
  merit_aid_confidence: 12,
  merit_aid_note: 13,
  merit_value_score: 14,
  tuition_score: 15,
  acad_score: 16,
  prestige: 17,
  roster_depth: 18,
  first_year_opportunity: 19,
  geo_score: 20,
  level_score: 21,
  need_score: 22,
  pt_score: 23,
  overall_score: 24,
  acad_note: 25,
  level_note: 26,
  pt_note: 27,
  campus_type: 28,
  program_url: 29,
}

// Valid enum sets — must match ParsedMatchResult types and prompt instructions exactly
const VALID_TIERS = new Set(['Lock', 'Realistic', 'Reach'])
const VALID_DIVISIONS = new Set(['D1', 'D2', 'D3', 'NAIA', 'JUCO'])
const VALID_BANDS = new Set(['A', 'B', 'C', 'D'])
const VALID_MERIT_POTENTIAL = new Set(['High', 'Medium', 'Low', 'Unknown'])
const VALID_MERIT_CONFIDENCE = new Set(['High', 'Medium', 'Low'])
const VALID_PRESTIGE = new Set(['Low', 'Mid', 'High'])
const VALID_FYO = new Set(['Likely', 'Possible', 'Developmental', 'Unlikely'])
const VALID_CAMPUS = new Set(['Urban', 'Suburban', 'Rural', 'College Town', 'Unknown'])

function int(val: string, fallback = 0): number {
  const n = parseInt(val.replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? fallback : n
}

// Clamp score to [min, max] and throw if the raw value was wildly out of range
function score(val: string, min: number, max: number, label: string): number {
  const n = int(val, -1)
  if (n < 0) throw new Error(`${label} missing or unparseable: "${val}"`)
  if (n > max + 20) throw new Error(`${label} out of range: ${n} (max ${max})`)
  return Math.min(Math.max(n, min), max)
}

function requireEnum<T extends string>(val: string, valid: Set<string>, label: string): T {
  if (!valid.has(val)) throw new Error(`${label} invalid: "${val}"`)
  return val as T
}

export interface ParseResult {
  rows: ParsedMatchResult[]
  errorRows: Array<{ index: number; raw: string; reason: string }>
}

export function parseMatchEngineTSV(raw: string): ParseResult {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errorRows: [{ index: 0, raw: '', reason: 'Empty response' }] }
  }

  // Skip header row
  const dataLines = lines[0].toLowerCase().includes('tier') ? lines.slice(1) : lines

  const rows: ParsedMatchResult[] = []
  const errorRows: Array<{ index: number; raw: string; reason: string }> = []

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    const cols = line.split('\t')

    if (cols.length < EXPECTED_COLS) {
      errorRows.push({ index: i + 1, raw: line, reason: `Expected ${EXPECTED_COLS} cols, got ${cols.length}` })
      continue
    }

    const c = (idx: number) => cols[idx].trim()

    try {
      // Required string fields — reject the row if blank
      const school = c(COL.school)
      if (!school) throw new Error('school name is empty')

      const verified_division = c(COL.verified_division)
      if (!verified_division) throw new Error('verified_division is empty')

      const distRaw = c(COL.distance_miles)
      const distance_miles = distRaw.toUpperCase() === 'NA' || distRaw === '' ? null : int(distRaw, 0)

      rows.push({
        tier: requireEnum<ParsedMatchResult['tier']>(c(COL.tier), VALID_TIERS, 'tier'),
        school,
        verified_division: requireEnum<ParsedMatchResult['verified_division']>(verified_division, VALID_DIVISIONS, 'verified_division'),
        conference: c(COL.conference),
        city_state: c(COL.city_state),
        distance_miles,
        player_level_band: requireEnum<ParsedMatchResult['player_level_band']>(c(COL.player_level_band), VALID_BANDS, 'player_level_band'),
        roster_level_band: requireEnum<ParsedMatchResult['roster_level_band']>(c(COL.roster_level_band), VALID_BANDS, 'roster_level_band'),
        in_state_tuition: int(c(COL.in_state_tuition)),
        out_state_tuition: int(c(COL.out_state_tuition)),
        merit_aid_potential: requireEnum<ParsedMatchResult['merit_aid_potential']>(c(COL.merit_aid_potential), VALID_MERIT_POTENTIAL, 'merit_aid_potential'),
        estimated_merit_aid: c(COL.estimated_merit_aid),
        merit_aid_confidence: requireEnum<ParsedMatchResult['merit_aid_confidence']>(c(COL.merit_aid_confidence), VALID_MERIT_CONFIDENCE, 'merit_aid_confidence'),
        merit_aid_note: c(COL.merit_aid_note),
        merit_value_score: score(c(COL.merit_value_score), 0, 100, 'merit_value_score'),
        tuition_score: score(c(COL.tuition_score), 0, 100, 'tuition_score'),
        acad_score: score(c(COL.acad_score), 0, 100, 'acad_score'),
        prestige: requireEnum<ParsedMatchResult['prestige']>(c(COL.prestige), VALID_PRESTIGE, 'prestige'),
        roster_depth: c(COL.roster_depth),
        first_year_opportunity: requireEnum<ParsedMatchResult['first_year_opportunity']>(c(COL.first_year_opportunity), VALID_FYO, 'first_year_opportunity'),
        geo_score: score(c(COL.geo_score), 0, 100, 'geo_score'),
        level_score: score(c(COL.level_score), 0, 100, 'level_score'),
        need_score: score(c(COL.need_score), 0, 100, 'need_score'),
        pt_score: score(c(COL.pt_score), 0, 100, 'pt_score'),
        overall_score: score(c(COL.overall_score), 0, 100, 'overall_score'),
        acad_note: c(COL.acad_note),
        level_note: c(COL.level_note),
        pt_note: c(COL.pt_note),
        campus_type: requireEnum<ParsedMatchResult['campus_type']>(c(COL.campus_type), VALID_CAMPUS, 'campus_type'),
        program_url: c(COL.program_url),
      })
    } catch (err) {
      errorRows.push({
        index: i + 1,
        raw: line,
        reason: err instanceof Error ? err.message : 'Parse error',
      })
    }
  }

  return { rows, errorRows }
}
