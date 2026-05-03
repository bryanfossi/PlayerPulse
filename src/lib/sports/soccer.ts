import type { SportConfig } from './types'

/**
 * Soccer — the launch sport for PlayerPulse.
 * All previously hard-coded soccer data has been consolidated here.
 */
export const soccer: SportConfig = {
  id: 'soccer',
  name: 'Soccer',
  icon: 'CircleDot',

  divisions: [
    {
      id: 'd1',
      name: 'NCAA D1',
      governingBody: 'NCAA',
      programCount: 332,
      mensScholarships: 9.9,
      womensScholarships: 14.0,
      notes:
        'Equivalency sport — scholarship money is split across a full roster. Most players receive partial aid, not full rides.',
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 216,
      mensScholarships: 9.0,
      womensScholarships: 9.9,
      notes: 'Equivalency sport. Wider range of aid packages than D1.',
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 430,
      mensScholarships: null,
      womensScholarships: null,
      notes:
        'No athletic scholarships at the D3 level. Financial aid is academic or need-based only.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 260,
      mensScholarships: 12.0,
      womensScholarships: 12.0,
      notes:
        'NAIA programs have more equivalency scholarships per roster than NCAA D1 and often quicker recruiting timelines.',
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
      notes:
        'Two-year junior college. Full scholarships available at D1 JUCO level; strong transfer pathway to 4-year programs.',
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
    type: 'equivalency',
    summary:
      'Soccer is an equivalency sport at every scholarship-offering level. Coaches divide a fractional scholarship pool across the entire roster.',
    notes:
      'Expect partial aid to be the norm. Full-ride offers are rare and usually reserved for impact recruits.',
  },

  recruitingTimeline: {
    earlyContactGrade: '9th',
    officialContactDate: 'June 15 after sophomore year (NCAA D1/D2)',
    deadPeriods: [],
    notes:
      'Per NCAA rules (effective since 2019), coaches cannot initiate recruiting communication with D1/D2 prospects until June 15 following their sophomore year. Players may reach out to coaches at any time.',
  },

  positions: [
    'Goalkeeper',
    'Defender',
    'Center Back',
    'Outside Back',
    'Fullback',
    'Defensive Midfielder',
    'Central Midfielder',
    'Attacking Midfielder',
    'Winger',
    'Forward',
    'Striker',
  ],

  clubLevels: [
    'MLS Next',
    'ECNL National',
    'ECNL-RL',
    'EDP Premier',
    'EDP',
    'NPL',
    'USYS Regional',
    'USYS State',
    'High School Only',
    'Other',
  ],

  stats: [
    { id: 'goals', name: 'Goals' },
    { id: 'assists', name: 'Assists' },
    {
      id: 'clean_sheets',
      name: 'Clean Sheets (GK)',
      positionScope: ['Goalkeeper'],
    },
    {
      id: 'save_pct',
      name: 'Save Percentage (GK)',
      unit: '%',
      positionScope: ['Goalkeeper'],
    },
    { id: 'games_played', name: 'Games Played' },
    { id: 'games_started', name: 'Games Started' },
    { id: 'minutes_played', name: 'Minutes Played', unit: 'min' },
    { id: 'yellow_cards', name: 'Yellow Cards' },
    { id: 'red_cards', name: 'Red Cards' },
  ],

  showcaseTypes: [
    'ECNL Regional',
    'ECNL National',
    'MLS Next',
    'Jefferson Cup',
    'Disney Showcase',
    'College Showcases',
    'State Cup',
    'Regional League',
  ],

  emailTemplates: [
    {
      id: 'initial_outreach',
      name: 'Initial Outreach',
      subject: '{grad_year} {position} — Interested in {school_name}',
      body:
        "The player's first contact with this program. Introduce the player, express genuine interest in the program, briefly highlight key stats and accomplishments, and request next steps (questionnaire, visit, etc.).",
    },
    {
      id: 'follow_up',
      name: 'Follow-Up',
      subject: 'Following up — {first_name} {last_name}, {grad_year} {position}',
      body:
        "The player has already contacted this program but has not received a response. Keep it brief: politely re-introduce the player, reference the prior outreach, and reiterate interest.",
    },
    {
      id: 'thank_you',
      name: 'Thank-You',
      subject: 'Thank you — {first_name} {last_name}',
      body:
        "The player recently had a call or visit with this coaching staff. Thank the coach by name (if provided), reference specifics of the conversation, and reaffirm interest.",
    },
    {
      id: 'campus_visit_request',
      name: 'Campus Visit Request',
      subject: 'Campus visit request — {first_name} {last_name}',
      body:
        "The player wants to schedule a campus visit (official or unofficial). Express strong interest, briefly restate key qualifications, and ask about available visit dates.",
    },
    {
      id: 'offer_response',
      name: 'Offer Response',
      subject: 'Re: Offer — {first_name} {last_name}',
      body:
        "The player received a scholarship or roster offer. Express gratitude, confirm receipt of the offer, and indicate the timeline for making a decision.",
    },
  ],

  aiPromptContext:
    "College soccer recruiting in the United States operates under NCAA, NAIA, and NJCAA rules. Coaches evaluate game footage, work rate, decision-making under pressure, and coachability. D1 men's soccer has 9.9 equivalency scholarships split across a full roster — most players receive partial aid, not full rides. The transfer portal has increased roster turnover at all division levels.",

  matchEngineContext: {
    playerBandDefinitions: `Band A (Top / D1-capable):
- ECNL or MLS Next at a top-25 nationally ranked club
- USYS National League P.R.O. (top flight)
- USL Academy or DA-era equivalent
- Selected to ODP Regional / National pool or U.S. Soccer Youth National Team training camp
- Regularly competes at top national showcases (Jefferson Cup Gold, ECNL Playoffs, Players Era Festival)

Band B (Strong / D1 mid-major–D2):
- ECNL or MLS Next at a mid-tier club
- USYS National League (non-PRO)
- Top regional league (NPL Premier, CCSL Premier, etc.)
- Strong club with national showcase exposure but limited bid results

Band C (Solid / D2–D3):
- State club league (AYSO select, State premier leagues below National League)
- High school varsity starter with regional club experience
- Regional league without significant national showcase exposure

Band D (Developing):
- High school only, or low-tier recreational/select club
- Limited competitive exposure beyond local leagues
- First or second year of organized club soccer`,

    rosterBandDefinitions: `Band A → Power 5 D1, consistently top-25 programs (UNC, Stanford, UCLA, Florida State, Penn State, Notre Dame, Clemson, Georgetown, Virginia, Duke, etc.)
Band B → Mid-major D1 (Atlantic 10, WCC, AAC, Mountain West, Conference USA); top D2 programs (top GAC, GNAC, GLIAC)
Band C → Lower-resource D1 (Big South, NEC, SWAC, OVC); solid mid-tier D2; elite D3 (Williams, Amherst, Tufts, Middlebury)
Band D → Lower D2, lower D3, NAIA programs, JUCO programs`,

    positionDepths: `Typical healthy roster counts by position (soccer rosters: 25–32 players):
- Goalkeeper (GK): 2–3
- Center Back (CB): 4–6
- Fullback / Outside Back (FB/OB): 3–5
- Defensive / Central Midfielder (CDM/CM): 5–8
- Attacking Midfielder / Winger (CAM/W): 4–6
- Forward / Striker (FW/ST): 3–5

Scoring (relative to typical healthy count for that position):
- Clear need (below typical, or 2+ graduating in player's class year): 22–25
- Moderate need (at typical count, 1 graduating): 14–21
- Saturated (above typical, no upcoming graduations): 6–13`,

    prestigeExamples: `High-prestige Women's D1: North Carolina, UCLA, Stanford, Florida State, Virginia, Penn State, Duke, Georgetown, Notre Dame, Portland, USC, BYU, TCU, Arkansas, Texas A&M, Clemson, South Carolina
High-prestige Men's D1: Indiana, Maryland, Georgetown, Wake Forest, Virginia, Akron, Clemson, Stanford, UCLA, Notre Dame, Michigan, Connecticut, Louisville, Pittsburgh, Creighton
High-prestige D2: Grand Valley State, Lynn, Tampa, West Florida, Colorado School of Mines, Cal Poly Pomona, Gannon, Rockhurst
High-prestige D3: Williams, Amherst, Messiah, Wheaton (IL), Tufts, Washington U. St. Louis, Trinity (CT), Calvin, Middlebury, SUNY Geneseo, Stevens
High-prestige NAIA: Lindsey Wilson, William Carey, Indiana Wesleyan, MidAmerica Nazarene, Keiser, Embry-Riddle`,

    rankingPollName: 'United Soccer Coaches',
    programUrlColumn: 'SoccerURL',
    ptScoreNote: 'Goalkeeper spots are highly competitive and rarely available to freshmen at mid-to-high prestige programs; weight PTScore lower for GK unless there is a clear graduation or departure.',
    clubUpliftRule: 'If a player competes at ECNL, MLS Next, or USYS National League level, lean toward more NCAA Division 1 schools — unless the player explicitly excludes D1 from Target Levels.',
  },

  active: true,
}
