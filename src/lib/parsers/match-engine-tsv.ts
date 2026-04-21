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
  soccer_url: 29,
}

function int(val: string, fallback = 0): number {
  const n = parseInt(val.replace(/[^0-9-]/g, ''), 10)
  return isNaN(n) ? fallback : n
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

    const c = (idx: number) => (cols[idx] ?? '').trim()

    try {
      const distRaw = c(COL.distance_miles)
      const distance_miles = distRaw.toUpperCase() === 'NA' || distRaw === '' ? null : int(distRaw, 0)

      rows.push({
        tier: c(COL.tier) as ParsedMatchResult['tier'],
        school: c(COL.school),
        verified_division: c(COL.verified_division) as ParsedMatchResult['verified_division'],
        conference: c(COL.conference),
        city_state: c(COL.city_state),
        distance_miles,
        player_level_band: c(COL.player_level_band) as ParsedMatchResult['player_level_band'],
        roster_level_band: c(COL.roster_level_band) as ParsedMatchResult['roster_level_band'],
        in_state_tuition: int(c(COL.in_state_tuition)),
        out_state_tuition: int(c(COL.out_state_tuition)),
        merit_aid_potential: c(COL.merit_aid_potential) as ParsedMatchResult['merit_aid_potential'],
        estimated_merit_aid: c(COL.estimated_merit_aid),
        merit_aid_confidence: c(COL.merit_aid_confidence) as ParsedMatchResult['merit_aid_confidence'],
        merit_aid_note: c(COL.merit_aid_note),
        merit_value_score: int(c(COL.merit_value_score)),
        tuition_score: int(c(COL.tuition_score)),
        acad_score: int(c(COL.acad_score)),
        prestige: c(COL.prestige) as ParsedMatchResult['prestige'],
        roster_depth: c(COL.roster_depth),
        first_year_opportunity: c(COL.first_year_opportunity) as ParsedMatchResult['first_year_opportunity'],
        geo_score: int(c(COL.geo_score)),
        level_score: int(c(COL.level_score)),
        need_score: int(c(COL.need_score)),
        pt_score: int(c(COL.pt_score)),
        overall_score: int(c(COL.overall_score)),
        acad_note: c(COL.acad_note),
        level_note: c(COL.level_note),
        pt_note: c(COL.pt_note),
        campus_type: c(COL.campus_type) as ParsedMatchResult['campus_type'],
        soccer_url: c(COL.soccer_url),
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
