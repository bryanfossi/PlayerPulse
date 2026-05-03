import type { SportConfig } from './types'

/**
 * Basketball — third active sport for PlayerPulse.
 * Key asymmetry: women's D1 is now headcount (15 full rides as of 2024-25 expansion);
 * men's D1 is also headcount at 13 full rides. D2, NAIA, and JUCO are equivalency.
 */
export const basketball: SportConfig = {
  id: 'basketball',
  name: 'Basketball',
  icon: 'CircleDashed',

  divisions: [
    {
      id: 'd1',
      name: 'NCAA D1',
      governingBody: 'NCAA',
      programCount: 363,
      mensScholarships: 13,
      womensScholarships: 15,
      notes:
        'Headcount sport at D1 for both genders — each scholarship is a full ride awarded to one player. Roster sizes are small (12–15) and competition for spots is the most intense in college sports.',
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 312,
      mensScholarships: 10,
      womensScholarships: 10,
      notes:
        'Equivalency sport. Aid is split across the roster — most D2 offers are partial scholarships paired with academic and need-based aid.',
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 429,
      mensScholarships: null,
      womensScholarships: null,
      notes:
        'No athletic scholarships. Strong academics and the largest division by program count. D3 basketball is highly competitive — many D3 programs reject would-be D1/D2 athletes annually.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 250,
      mensScholarships: 11,
      womensScholarships: 11,
      notes:
        'Equivalency sport. NAIA programs often offer competitive aid packages and have faster recruiting timelines than NCAA.',
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
      mensScholarships: 15,
      womensScholarships: 15,
      notes:
        'Two-year junior college. Full athletic scholarships available. A common pathway for late bloomers, post-grad players, and those needing academic development before transferring to a 4-year program.',
    },
    {
      id: 'njcaa-d2',
      name: 'NJCAA D2',
      governingBody: 'NJCAA',
      notes: 'Tuition, fees, books, and room/board — but not full athletic scholarships.',
    },
    {
      id: 'njcaa-d3',
      name: 'NJCAA D3',
      governingBody: 'NJCAA',
      mensScholarships: null,
      womensScholarships: null,
      notes: 'No athletic scholarships.',
    },
  ],

  scholarshipRules: {
    type: 'mixed',
    summary:
      'Basketball is a headcount sport at NCAA D1 for both men (13) and women (15) — each scholarship is a full ride to one player. D2, NAIA, and JUCO are equivalency sports where aid is split across the roster.',
    notes:
      'For D1 recruits: a scholarship offer is typically a full ride covering tuition, fees, room, board, and books. For D2/NAIA/JUCO recruits: expect partial aid combined with academic, need-based, or institutional scholarships.',
  },

  recruitingTimeline: {
    earlyContactGrade: '9th',
    officialContactDate: 'June 15 after sophomore year (NCAA D1)',
    deadPeriods: [
      'NCAA dead periods around early signing (mid-November)',
      'NCAA dead period during NCAA tournament (March)',
    ],
    notes:
      'AAU circuit on Nike EYBL, Adidas 3SSB, and Under Armour Association is the primary D1 evaluation channel. The NCAA recruiting calendar has specific evaluation windows in April, July, and during high school season. Per NCAA rules, coaches cannot initiate recruiting communication until June 15 following the player\'s sophomore year, but players may reach out to coaches at any time before that. The transfer portal and NIL landscape have dramatically changed roster construction — many programs now prioritize transfers over high school recruits, especially at the power-conference D1 level.',
  },

  positions: [
    'Point Guard',
    'Shooting Guard',
    'Combo Guard',
    'Wing',
    'Small Forward',
    'Power Forward',
    'Stretch Four',
    'Center',
  ],

  clubLevels: [
    'Nike EYBL',
    'Adidas 3SSB',
    'Under Armour Association',
    'AAU National (Other Sponsored)',
    'AAU Regional',
    'Prep School / Post-Grad',
    'High School Only',
    'Other',
  ],

  stats: [
    { id: 'points_per_game', name: 'Points Per Game', unit: 'ppg' },
    { id: 'rebounds_per_game', name: 'Rebounds Per Game', unit: 'rpg' },
    { id: 'assists_per_game', name: 'Assists Per Game', unit: 'apg', positionScope: ['Point Guard', 'Shooting Guard', 'Combo Guard', 'Wing'] },
    { id: 'steals_per_game', name: 'Steals Per Game', unit: 'spg' },
    { id: 'blocks_per_game', name: 'Blocks Per Game', unit: 'bpg', positionScope: ['Power Forward', 'Stretch Four', 'Center', 'Small Forward'] },
    { id: 'fg_pct', name: 'Field Goal %', unit: '%' },
    { id: 'three_pt_pct', name: '3-Point %', unit: '%' },
    { id: 'ft_pct', name: 'Free Throw %', unit: '%' },
    { id: 'minutes_per_game', name: 'Minutes Per Game', unit: 'mpg' },
    { id: 'turnovers_per_game', name: 'Turnovers Per Game', unit: 'tpg' },
    { id: 'games_played', name: 'Games Played' },
    { id: 'vertical_jump', name: 'Vertical Jump', unit: 'in' },
    { id: 'wingspan', name: 'Wingspan', unit: 'in' },
  ],

  showcaseTypes: [
    'Nike EYBL Peach Jam',
    'Adidas 3SSB Championship',
    'Under Armour Association Finals',
    'NBPA Top 100 Camp',
    'USA Basketball U16/U17 Trials',
    'Pangos All-American Camp',
    'NY2LA Sports Showcase',
    'Hoop Group Pittsburgh Jam Fest',
    'AAU National Championships',
    'College ID Camp',
    'High School State Championship',
    'Prep School Showcase',
  ],

  emailTemplates: [
    {
      id: 'initial_outreach',
      name: 'Initial Outreach',
      subject: '{grad_year} {position} — Interested in {school_name} Basketball',
      body:
        "The player's first contact with this program. Introduce the player, mention position, height, and AAU/club affiliation, reference the school's program specifically (conference, recent results, playing style, head coach's system), and request next steps (recruiting questionnaire, unofficial visit, film review).",
    },
    {
      id: 'follow_up',
      name: 'Follow-Up',
      subject: 'Following up — {first_name} {last_name}, {grad_year} {position}',
      body:
        'The player has already contacted this program but has not received a response. Brief: re-introduce, reference the prior outreach date, reiterate interest, and provide an updated highlight tape link or recent stat line.',
    },
    {
      id: 'thank_you',
      name: 'Thank-You',
      subject: 'Thank you — {first_name} {last_name}',
      body:
        'The player recently spoke with or visited this coaching staff. Thank the coach by name, reference a specific detail from the conversation (a play they liked, a position discussion, a campus highlight), and reaffirm interest.',
    },
    {
      id: 'campus_visit_request',
      name: 'Campus Visit Request',
      subject: 'Campus visit request — {first_name} {last_name}',
      body:
        'The player wants to schedule an unofficial or official campus visit. Express strong interest, briefly restate key qualifications (height, position, latest film), and ask the coach about available visit dates around their schedule, including the possibility of attending a practice or game.',
    },
    {
      id: 'offer_response',
      name: 'Offer Response',
      subject: 'Re: Offer — {first_name} {last_name}',
      body:
        'The player received a scholarship or roster spot offer. Express genuine gratitude, confirm receipt of the offer details (full ride vs. partial aid, walk-on, preferred walk-on), and communicate the timeline for making a decision.',
    },
  ],

  aiPromptContext:
    'College basketball recruiting in the United States operates under NCAA, NAIA, and NJCAA rules. NCAA D1 basketball is a headcount sport for both men (13 scholarships) and women (15 scholarships, expanded in 2024-25) — each scholarship is a full ride to a single player. Roster sizes are small (typically 12–15 players) and competition for spots is extremely intense. The AAU circuit — Nike EYBL, Adidas 3SSB, and Under Armour Association — is the primary D1 evaluation channel; performance at major events like Peach Jam and the 3SSB Championship is closely tracked by college coaches. Coaches evaluate height, wingspan, athleticism (vertical jump, lateral quickness), positional versatility, basketball IQ, motor, and shooting ability. The transfer portal and NIL landscape have dramatically increased roster turnover at every level — many power-conference programs now prioritize transfers over high school recruits.',

  matchEngineContext: {
    playerBandDefinitions: `Band A (Top / High-Major D1):
- Plays on a Nike EYBL, Adidas 3SSB, or Under Armour Association sponsored circuit team
- Top-25 finish at a major AAU national championship (Peach Jam, 3SSB Champs, UAA Finals)
- Invited to USA Basketball U16/U17/U18 trials, NBPA Top 100, or Pangos All-American Camp
- Physical markers (guideline): Men PG ≥ 6'1", SG/Wing ≥ 6'4", PF ≥ 6'7", C ≥ 6'9"; Women PG ≥ 5'7", SG/Wing ≥ 5'10", PF ≥ 6'1", C ≥ 6'3"
- High-major statistical impact at the AAU level (consistent 15+ ppg in EYBL/3SSB)

Band B (Strong / Mid-Major D1 – Top D2):
- Plays on a non-sponsored AAU national circuit team or a Tier 2 sponsored team
- Regional standout at AAU nationals; invited to multiple D1 college ID camps
- Solid physical profile for position; strong high school varsity stats (15+ ppg, all-conference)
- Late-blooming sponsored circuit player or strong prep/post-grad performer

Band C (Solid / D2–D3 / NAIA):
- AAU regional-level club, strong high school varsity player
- All-state or all-region recognition at the high school level
- May lack top physical markers but shows skill, motor, and basketball IQ
- Solid academic profile that opens D3 and academic-D2 doors

Band D (Developing):
- High school only, or low-tier club / first-year AAU player
- Limited competitive exposure beyond local league
- Below typical college physical thresholds for position
- Strong fit for D3, NAIA, JUCO, or preferred walk-on pathways`,

    rosterBandDefinitions: `Band A → Elite D1 programs in power conferences (Big Ten, SEC, Big 12, ACC, Big East); consistently AP top-25 / NCAA tournament programs; blue bloods (Duke, Kentucky, Kansas, UNC, UCLA, UConn for women)
Band B → Mid-major D1 (A-10, Mountain West, WCC, MVC, AAC); top D2 programs (Lubbock Christian, Nova Southeastern, Northwest Missouri State); G5 programs that occasionally make the NCAA tournament
Band C → Lower D1 (low-major conferences like SWAC, MEAC, Southland); solid mid-tier D2; elite D3 (Christopher Newport, Randolph-Macon, Trinity (TX), Williams, MIT)
Band D → Lower D2, lower D3, NAIA programs, NJCAA programs`,

    positionDepths: `Typical healthy roster counts by position (basketball rosters: 12–15 players):
- Point Guard (PG): 2–3
- Shooting Guard (SG) / Combo Guard: 2–3
- Wing / Small Forward (SF): 2–3
- Power Forward (PF) / Stretch Four: 2–3
- Center (C): 2–3

Scoring (relative to typical healthy count for that position):
- Clear need (below typical, or 2+ graduating in player's class year): 22–25
- Moderate need (at typical count, 1 graduating): 14–21
- Saturated (above typical, no upcoming graduations or active transfer portal additions): 6–13

Special note: the transfer portal can drastically reshape any position group between seasons. A roster that looked saturated in March may have multiple openings by May.`,

    prestigeExamples: `High-prestige Men's D1: Duke, Kentucky, Kansas, UNC, UCLA, Gonzaga, Villanova, Michigan State, Arizona, Houston, Tennessee, Auburn, Purdue, Connecticut, Baylor
High-prestige Women's D1: South Carolina, UConn, Stanford, Iowa, LSU, UCLA, Notre Dame, Texas, Tennessee, Maryland, NC State, Ohio State, Virginia Tech
High-prestige D2 (Men's): Nova Southeastern, Northwest Missouri State, West Liberty, Lincoln Memorial, Augusta, Indiana (PA)
High-prestige D2 (Women's): Lubbock Christian, Drury, Glenville State, Ashland, Union (TN), Saint Anselm
High-prestige D3 (Men's): Christopher Newport, Randolph-Macon, Trinity (TX), Wesleyan, Williams, MIT, Wash U
High-prestige D3 (Women's): NYU, Hope, Trine, Christopher Newport, Bowdoin, Tufts, Wartburg
High-prestige NAIA: Loyola (LA), Indiana Wesleyan, Talladega, Marian (IN), Thomas More, Bethel (TN), Westmont, Lewis-Clark State`,

    rankingPollName: 'AP (Associated Press) Top 25',
    programUrlColumn: 'BasketballURL',
    ptScoreNote:
      'Point Guard and Center spots are the most position-locked — typically only 2–3 of each on a 12–15 player roster. Weight PTScore lower for PG and C unless a clear departure (graduation, transfer) is evident. Wing players have more flexibility and rotation availability.',
    clubUpliftRule:
      'If a player competes on a sponsored Nike EYBL, Adidas 3SSB, or Under Armour Association circuit team and finishes in the top 25 at a major AAU national event, lean toward more NCAA Division 1 schools — unless the player explicitly excludes D1 from Target Levels. Transfer portal volatility means even high-major rosters often have late openings; do not over-saturate the list with low-major options for Band A players.',
  },

  active: true,
}
