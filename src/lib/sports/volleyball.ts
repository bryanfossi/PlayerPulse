import type { SportConfig } from './types'

/**
 * Volleyball — second active sport for FuseID.
 * Key asymmetry: women's D1 is headcount (12 full rides), men's D1 is equivalency (4.5).
 */
export const volleyball: SportConfig = {
  id: 'volleyball',
  name: 'Volleyball',
  icon: 'CircleDot',

  divisions: [
    {
      id: 'd1',
      name: 'NCAA D1',
      governingBody: 'NCAA',
      programCount: 360,
      mensScholarships: 4.5,
      womensScholarships: 12,
      notes:
        "Critical asymmetry: women's D1 volleyball is a headcount sport — 12 full athletic scholarships, each a full ride to one player (~334 programs). Men's D1 is an equivalency sport with only 4.5 scholarships split across the roster (~25 programs, concentrated in Midwest and coasts).",
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 320,
      mensScholarships: 4.5,
      womensScholarships: 8,
      notes:
        "Women's D2 offers 8.0 equivalency scholarships; men's D2 offers 4.5. Equivalency at both levels means aid is split across many players.",
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 450,
      mensScholarships: null,
      womensScholarships: null,
      notes:
        'No athletic scholarships. Financial aid is academic or need-based only. D3 is the largest division by program count and has strong academic institutions.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 220,
      mensScholarships: 8,
      womensScholarships: 8,
      notes:
        'Equivalency sport. NAIA programs often have faster recruiting timelines and more roster flexibility than NCAA.',
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
      notes:
        'Two-year junior college. Full scholarships available at D1 JUCO. Strong transfer pathway to 4-year programs, especially for players who need development time.',
    },
    {
      id: 'njcaa-d2',
      name: 'NJCAA D2',
      governingBody: 'NJCAA',
      notes: 'Partial athletic scholarships and tuition-only aid allowed.',
    },
    {
      id: 'njcaa-d3',
      name: 'NJCAA D3',
      governingBody: 'NJCAA',
      mensScholarships: null,
      womensScholarships: null,
      notes: 'No athletic scholarships. Focused on academics and participation.',
    },
  ],

  scholarshipRules: {
    type: 'mixed',
    summary:
      "Volleyball scholarship rules differ sharply by gender. Women's NCAA D1 is a headcount sport — 12 full rides, no splitting. Men's NCAA D1 is equivalency with only 4.5 scholarships. At D2 and below, both are equivalency sports.",
    notes:
      "For women's D1 recruits: a scholarship offer is typically a full ride. For men's D1 recruits: expect partial aid — the 4.5 pool is spread across a 15–18 player roster. D2, NAIA, and JUCO are all equivalency regardless of gender.",
  },

  recruitingTimeline: {
    earlyContactGrade: '8th',
    officialContactDate: 'June 15 after sophomore year (NCAA D1/D2)',
    deadPeriods: [],
    notes:
      "Women's D1 volleyball is one of the earliest-recruiting NCAA sports — verbal commitments as early as 8th or 9th grade are common for top programs. Men's D1 timelines are more relaxed given the small number of programs. Per NCAA rules, coaches cannot initiate recruiting communication until June 15 following the player's sophomore year, but players may reach out to coaches at any time before that.",
  },

  positions: [
    'Outside Hitter',
    'Opposite (Right Side)',
    'Middle Blocker',
    'Setter',
    'Libero',
    'Defensive Specialist',
    'Serving Specialist',
  ],

  clubLevels: [
    'USAV Open / National',
    'USAV American',
    'USAV Regional',
    'AAU Premier / Classic',
    'AAU Club / Select',
    'JVA Open',
    'High School Only',
    'Other',
  ],

  stats: [
    { id: 'kills', name: 'Kills' },
    { id: 'attack_pct', name: 'Attack Percentage', unit: '%' },
    {
      id: 'assists',
      name: 'Assists',
      positionScope: ['Setter'],
    },
    { id: 'digs', name: 'Digs' },
    { id: 'blocks_solo', name: 'Blocks (Solo)', positionScope: ['Middle Blocker', 'Opposite (Right Side)', 'Outside Hitter'] },
    { id: 'block_assists', name: 'Block Assists', positionScope: ['Middle Blocker', 'Opposite (Right Side)', 'Outside Hitter'] },
    { id: 'aces', name: 'Aces' },
    { id: 'service_errors', name: 'Service Errors' },
    {
      id: 'reception_pct',
      name: 'Reception Percentage',
      unit: '%',
      positionScope: ['Libero', 'Defensive Specialist', 'Outside Hitter'],
    },
    { id: 'sets_played', name: 'Sets Played' },
    { id: 'matches_played', name: 'Matches Played' },
  ],

  showcaseTypes: [
    'USAV Girls Junior National Championships (GJNC)',
    'USAV Boys Junior National Championships (BJNC)',
    'AAU Junior National Championships',
    'Mideast Qualifier (MEQ)',
    'Northern Lights Qualifier (NLQ)',
    'Big South Qualifier',
    'Triple Crown NIT',
    'Lone Star Classic',
    'Disney NIT',
    'College ID Camp',
    'Regional League',
  ],

  emailTemplates: [
    {
      id: 'initial_outreach',
      name: 'Initial Outreach',
      subject: '{grad_year} {position} — Interested in {school_name} Volleyball',
      body:
        "The player's first contact with this program. Introduce the player, mention position and club affiliation, reference the school's program specifically (conference, recent results, playing style), and request next steps (recruiting questionnaire, unofficial visit, film review).",
    },
    {
      id: 'follow_up',
      name: 'Follow-Up',
      subject: 'Following up — {first_name} {last_name}, {grad_year} {position}',
      body:
        'The player has already contacted this program but has not received a response. Brief: re-introduce, reference the prior outreach date, reiterate interest, and provide an updated highlight link if available.',
    },
    {
      id: 'thank_you',
      name: 'Thank-You',
      subject: 'Thank you — {first_name} {last_name}',
      body:
        'The player recently spoke with or visited this coaching staff. Thank the coach by name, reference a specific detail from the conversation (a drill, a position discussion, a campus highlight), and reaffirm interest.',
    },
    {
      id: 'campus_visit_request',
      name: 'Campus Visit Request',
      subject: 'Campus visit request — {first_name} {last_name}',
      body:
        'The player wants to schedule an unofficial or official campus visit. Express strong interest, briefly restate key qualifications, attach or link recent film, and ask the coach about available visit dates around their schedule.',
    },
    {
      id: 'offer_response',
      name: 'Offer Response',
      subject: 'Re: Offer — {first_name} {last_name}',
      body:
        'The player received a scholarship or roster spot offer. Express genuine gratitude, confirm receipt of the offer details (headcount vs. equivalency, aid amount if applicable), and communicate the timeline for making a decision.',
    },
  ],

  aiPromptContext:
    "College volleyball recruiting in the United States operates under NCAA, NAIA, and NJCAA rules, with a critical gender asymmetry at the D1 level: women's NCAA D1 volleyball is a headcount sport offering 12 full athletic scholarships per program, while men's NCAA D1 is equivalency with only 4.5 scholarships split across the roster across roughly 25 programs nationally. Club volleyball — governed primarily through USA Volleyball (USAV) regional associations, AAU, and JVA — is the primary recruiting evaluation channel; performance at national qualifiers (MEQ, NLQ) and the USAV Junior National Championships is closely tracked by college coaches. Coaches evaluate vertical jump, approach jump, ball control under pressure, court IQ, positional versatility, and coachability. The women's D1 recruiting cycle is among the earliest in college sports — verbal commitments in 8th or 9th grade are common for top programs — while men's timelines are considerably more relaxed given the limited number of programs.",

  matchEngineContext: {
    playerBandDefinitions: `Band A (Top / D1-capable):
- USAV Open or National bid-earning clubs competing in 17/18 Open or National division
- Top-10 JVA/AAU finish at national championships
- Regularly plays in USAV Nationals Open or National division
- For men's: Boys' Junior National Team pipeline / High Performance program or top men's club (e.g., Balboa Bay, SCVC, A4, Mizuno LB)
- Physical markers (guideline): Women OH/OPP ≥ 5'11", MB ≥ 6'1"; Men OH/OPP ≥ 6'3", MB ≥ 6'5" — with high-level approach touch

Band B (Strong / D1 mid-major–D2):
- USAV American or strong National-flight club
- AAU Classic / Premier divisions
- Regional qualifier appearances without national bids
- Solid physical profile for position, competitive club team

Band C (Solid / D2–D3):
- USAV regional-level club (below American at major clubs, or mid-tier clubs)
- AAU Club / Select divisions
- Strong high school varsity player with some club experience
- May lack top physical markers but shows skill and court IQ

Band D (Developing):
- High school only, or low-tier club, or first/second-year club player
- Limited competitive exposure
- Below typical college physical thresholds`,

    rosterBandDefinitions: `Band A → Elite D1 programs in power conferences (Big Ten, SEC, Big 12, ACC for women; MPSF, Big West men's, EIVA, MIVA for men); consistently AVCA top-25
Band B → Mid-major D1 (WAC, CAA, Atlantic 10, Mountain West); top D2 programs (Concordia-St. Paul, Nebraska-Kearney, Washburn, Tampa)
Band C → Lower D1; solid mid-tier D2; elite D3 (Calvin, Wittenberg, Emory, Claremont-M-S, Washington U. St. Louis)
Band D → Lower D2, lower D3, NAIA, NJCAA programs`,

    positionDepths: `Typical healthy roster counts by position (volleyball rosters: 15–18 players):
- Setter (S): 2–3
- Outside Hitter (OH): 4–6
- Middle Blocker (MB): 3–4
- Opposite / Right Side (OPP/RS): 2–3
- Libero / Defensive Specialist (L/DS): 2–4

Scoring (relative to typical healthy count for that position):
- Clear need (below typical, or 2+ graduating in player's class year): 22–25
- Moderate need (at typical count, 1 graduating): 14–21
- Saturated (above typical, no upcoming graduations): 6–13`,

    prestigeExamples: `High-prestige Women's D1: Nebraska, Texas, Stanford, Wisconsin, Penn State, Louisville, Pittsburgh, Kentucky, Florida, Minnesota, Washington, BYU, Creighton, Baylor, SMU
High-prestige Men's D1: Long Beach State, UCLA, Hawaii, BYU, UC Irvine, Pepperdine, Stanford, USC, Penn State, Ohio State, Loyola Chicago, Lewis, Ball State
High-prestige D2 (Women's): Concordia-St. Paul, Nebraska-Kearney, Washburn, Tampa, Wheeling
High-prestige D3 (Women's): Calvin, Wittenberg, Emory, Claremont-M-S, Washington U. St. Louis, Hope, Juniata, Colorado College, Trinity (TX), MIT, Cal Lutheran
High-prestige D3 (Men's): Juniata, Springfield, Carthage, Stevens, MIT, Wittenberg, Vassar
High-prestige NAIA: Park (MO), Grand View, Missouri Baptist, Northwestern (IA), Lindsey Wilson`,

    rankingPollName: 'AVCA (American Volleyball Coaches Association)',
    programUrlColumn: 'VolleyballURL',
    ptScoreNote: 'Libero spots are highly competitive and often locked by upperclassmen; weight PTScore lower for Libero/DS unless a clear departure is evident.',
    clubUpliftRule: 'If a player competes at USAV Open/National level or in a 17s/18s Open or National flight at a top-tier qualifier-earning club, lean toward more NCAA Division 1 schools — unless the player explicitly excludes D1 from Target Levels.',
  },

  active: true,
}
