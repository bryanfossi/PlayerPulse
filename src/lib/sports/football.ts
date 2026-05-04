import type { SportConfig } from './types'

/**
 * Football — fourth active sport for FuseID.
 * Distinct from soccer/basketball/volleyball:
 *  - FBS is headcount (85 full rides), FCS is equivalency (63), D2 equivalency (36), D3 = 0 athletic.
 *  - "Club" doesn't exist the way it does in soccer — recruiting flows through high school
 *    teams, 7-on-7 circuits, prospect camps, combines, and elite all-American events.
 *  - Position groups are highly stratified (QB / RB / WR / TE / OL / DL / LB / DB / ST).
 *  - Recruiting rankings (composite of 247Sports / Rivals / ESPN) drive D1 attention more
 *    than in any other sport.
 */
export const football: SportConfig = {
  id: 'football',
  name: 'Football',
  icon: 'Shield',

  divisions: [
    {
      id: 'd1-fbs',
      name: 'NCAA D1 (FBS)',
      governingBody: 'NCAA',
      programCount: 134,
      mensScholarships: 85,
      notes:
        'Headcount sport — 85 full rides, no splitting. Roster cap of 105 (preseason). Power 4 (SEC/Big Ten/ACC/Big 12) is the elite tier; G5 (AAC/Mountain West/MAC/Sun Belt/CUSA) is a step down. Recruiting is the most competitive in college sports.',
    },
    {
      id: 'd1-fcs',
      name: 'NCAA D1 (FCS)',
      governingBody: 'NCAA',
      programCount: 128,
      mensScholarships: 63,
      notes:
        'Equivalency sport — 63 scholarships split across the roster. Many partial offers (e.g. 50% / 75%). Top FCS programs (Sam Houston, NDSU, SDSU, Montana, Yale) compete with G5 FBS programs for talent. Ivy League and Patriot League FCS schools offer NO athletic aid, only need-based + academic.',
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 169,
      mensScholarships: 36,
      notes:
        'Equivalency — 36 scholarships split across a ~110-player roster. Most D2 players are on partial scholarships paired with academic / need-based aid. Strong regional football culture especially in the Midwest, South, and Texas.',
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 252,
      mensScholarships: null,
      notes:
        'No athletic scholarships. Aid is academic or need-based only. Largest division by program count. Top D3 programs (Mount Union, Mary Hardin-Baylor, Linfield, Whitewater) are competitive and selective.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 95,
      mensScholarships: 24,
      notes:
        'Equivalency — 24 scholarships. NAIA football has fewer programs than NCAA but offers a real competitive path with athletic aid plus institutional aid stacking.',
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
      programCount: 60,
      mensScholarships: 85,
      notes:
        'Two-year junior college. Full scholarships (tuition, fees, room, board, books). Elite JUCO football is concentrated in Mississippi, Kansas, Iowa, and California. Major transfer pathway to FBS for late-blooming or academically-developing prospects.',
    },
    {
      id: 'njcaa-d2',
      name: 'NJCAA D2',
      governingBody: 'NJCAA',
      mensScholarships: null,
      notes:
        'Tuition + fees + books, but no room/board. Common pathway for academic recovery before transfer.',
    },
    {
      id: 'njcaa-d3',
      name: 'NJCAA D3',
      governingBody: 'NJCAA',
      mensScholarships: null,
      notes: 'No athletic scholarships.',
    },
  ],

  scholarshipRules: {
    type: 'mixed',
    summary:
      'Football has the most aggressive split of any college sport. NCAA FBS is headcount (85 full rides). FCS, D2, NAIA, and JUCO are equivalency, splitting aid across the roster. NCAA D3 and Ivy League schools offer NO athletic scholarships at all.',
    notes:
      'For FBS recruits: a scholarship offer is always a full ride (tuition, fees, room, board, books, cost of attendance). For FCS recruits: most offers are partial — a "70% scholarship" is common. For D2 / NAIA / JUCO: expect partial aid stacked with academic and need-based. NCAA D3 and Ivies: no athletic aid, but excellent academic + need-based packages can rival low-tier FBS scholarships in net cost.',
  },

  recruitingTimeline: {
    earlyContactGrade: '8th-9th',
    officialContactDate: 'June 15 after sophomore year (NCAA D1)',
    deadPeriods: [
      'Late Dec / Early Jan dead period before Early Signing Day',
      'NFL Draft / Combine evaluation period',
    ],
    notes:
      'Football has the earliest and most aggressive recruiting timeline of any college sport. Top FBS programs identify and offer prospects as early as 8th and 9th grade based on highlight tape, height/weight, and family background. Camp circuit (Nike Football Combine, Rivals Camps, college Junior Days, official prospect camps) drives the bulk of evaluation. By signing day of senior year (Early Signing in mid-December, Regular in early February), most FBS classes are 90%+ committed. Per NCAA rules, coaches cannot initiate recruiting communication until June 15 following the player\'s sophomore year — but families and coaches use evaluators, social media, and showcases to circumvent this informally. The transfer portal has dramatically reshaped FBS recruiting; many programs save 10–15 scholarships per cycle for portal transfers.',
  },

  positions: [
    'Quarterback',
    'Running Back',
    'Wide Receiver',
    'Tight End',
    'Offensive Tackle',
    'Offensive Guard',
    'Center',
    'Defensive End',
    'Defensive Tackle',
    'Edge Rusher',
    'Inside Linebacker',
    'Outside Linebacker',
    'Cornerback',
    'Safety',
    'Athlete',
    'Kicker',
    'Punter',
    'Long Snapper',
  ],

  clubLevels: [
    'National Power High School (IMG / Bosco / Mater Dei tier)',
    'State Power High School',
    'Strong Varsity (Top 25% in state)',
    'Average Varsity',
    'Prep / Post-Grad',
    '7-on-7 National Circuit',
    'Junior College',
    'Other',
  ],

  stats: [
    // QB
    { id: 'pass_yards', name: 'Passing Yards', unit: 'yds', positionScope: ['Quarterback'] },
    { id: 'pass_tds', name: 'Passing TDs', positionScope: ['Quarterback'] },
    { id: 'completion_pct', name: 'Completion %', unit: '%', positionScope: ['Quarterback'] },
    { id: 'qbr', name: 'QB Rating', positionScope: ['Quarterback'] },
    // Rushing
    { id: 'rush_yards', name: 'Rushing Yards', unit: 'yds', positionScope: ['Running Back', 'Quarterback', 'Athlete'] },
    { id: 'rush_tds', name: 'Rushing TDs', positionScope: ['Running Back', 'Quarterback', 'Athlete'] },
    { id: 'yards_per_carry', name: 'Yards per Carry', positionScope: ['Running Back'] },
    // Receiving
    { id: 'receptions', name: 'Receptions', positionScope: ['Wide Receiver', 'Tight End', 'Running Back'] },
    { id: 'rec_yards', name: 'Receiving Yards', unit: 'yds', positionScope: ['Wide Receiver', 'Tight End', 'Running Back'] },
    { id: 'rec_tds', name: 'Receiving TDs', positionScope: ['Wide Receiver', 'Tight End', 'Running Back'] },
    // Defensive
    { id: 'tackles', name: 'Total Tackles', positionScope: ['Defensive End', 'Defensive Tackle', 'Edge Rusher', 'Inside Linebacker', 'Outside Linebacker', 'Cornerback', 'Safety'] },
    { id: 'sacks', name: 'Sacks', positionScope: ['Defensive End', 'Defensive Tackle', 'Edge Rusher', 'Outside Linebacker'] },
    { id: 'tfl', name: 'Tackles for Loss', positionScope: ['Defensive End', 'Defensive Tackle', 'Edge Rusher', 'Inside Linebacker', 'Outside Linebacker'] },
    { id: 'interceptions', name: 'Interceptions', positionScope: ['Cornerback', 'Safety', 'Inside Linebacker', 'Outside Linebacker'] },
    { id: 'forced_fumbles', name: 'Forced Fumbles' },
    // Combine / measurables
    { id: 'forty_yard', name: '40-Yard Dash', unit: 's' },
    { id: 'vertical_jump', name: 'Vertical Jump', unit: 'in' },
    { id: 'broad_jump', name: 'Broad Jump', unit: 'in' },
    { id: 'bench_press', name: 'Bench Press (225)', unit: 'reps' },
    { id: 'pro_shuttle', name: 'Pro Shuttle (5-10-5)', unit: 's' },
    { id: 'wingspan', name: 'Wingspan', unit: 'in' },
    { id: 'games_played', name: 'Games Played' },
  ],

  showcaseTypes: [
    'Nike Football The Opening (Regional + Finals)',
    'Rivals Camp Series',
    '247Sports Underclassmen Camp',
    'Under Armour All-America Game',
    'Elite 11 (Quarterbacks)',
    'NBC4 / Polynesian Bowl',
    'Adidas All-American Bowl',
    'College Junior Day Visit',
    'Official Prospect Camp (Power 4 / G5)',
    '7-on-7 National Tournament (Pylon, OT7, Battle 7v7)',
    'Combine (NFL-style)',
    'High School Playoffs',
    'State Championship',
  ],

  emailTemplates: [
    {
      id: 'initial_outreach',
      name: 'Initial Outreach',
      subject: '{grad_year} {position} — Interested in {school_name} Football',
      body:
        "The player's first contact with this program. Introduce the player, mention position, height/weight, GPA, and high school. Reference the school's program specifically (head coach's offensive/defensive scheme, recent results, recruiting class, conference). For QBs and skill players, mention 40 time and key stats. Request next steps (recruiting questionnaire, camp invite, film evaluation).",
    },
    {
      id: 'follow_up',
      name: 'Follow-Up',
      subject: 'Following up — {first_name} {last_name}, {grad_year} {position}',
      body:
        'The player has already contacted this program but has not received a response. Brief: re-introduce, reference the prior outreach date, reiterate interest, share an updated highlight tape link, and any new offers/measurables/test scores since the last message.',
    },
    {
      id: 'thank_you',
      name: 'Thank-You',
      subject: 'Thank you — {first_name} {last_name}',
      body:
        'The player recently spoke with, visited campus, or attended a prospect camp at this program. Thank the coach by name, reference a specific detail from the visit/camp (a drill they liked, a position discussion, a campus highlight, a meeting with the position coach or coordinator), and reaffirm interest.',
    },
    {
      id: 'campus_visit_request',
      name: 'Campus Visit Request',
      subject: 'Campus visit request — {first_name} {last_name}',
      body:
        'The player wants to schedule an unofficial visit, official visit, or attend a junior day. Express strong interest, briefly restate key qualifications (height/weight, GPA, key measurables), attach or link recent film, and ask the coach about available visit dates around their schedule. For seniors, mention if the visit would be official (35 max per school across all sports per cycle).',
    },
    {
      id: 'offer_response',
      name: 'Offer Response',
      subject: 'Re: Offer — {first_name} {last_name}',
      body:
        'The player received a scholarship offer (full ride at FBS, partial at FCS / D2). Express genuine gratitude, confirm receipt of the offer details (full vs partial, cost-of-attendance stipend, books/fees coverage), and communicate the timeline for making a decision. Mention any other schools currently in the picture if relevant — coaches expect this and respond well to honest communication.',
    },
  ],

  aiPromptContext:
    'College football recruiting in the United States is the most competitive and earliest-starting recruiting cycle in college sports. NCAA FBS (134 programs) is a headcount sport offering 85 full rides per program; recruiting is dominated by Power 4 conferences (SEC, Big Ten, ACC, Big 12) plus Notre Dame. NCAA FCS is equivalency (63 scholarships split). NCAA D2 is equivalency (36 split). NCAA D3 and Ivy League FCS programs offer NO athletic scholarships. NAIA (24 split) and NJCAA D1 (full rides) round out the scholarship landscape. The recruiting industry tracks players via composite rankings (247Sports, Rivals, ESPN), with 5-star (top ~30 nationally), 4-star (top ~300), and 3-star ratings drawing very different levels of FBS interest. The camp circuit (Nike Football Combine, Rivals Camps, college Junior Days, official prospect camps) is the primary evaluation channel — film alone is rarely enough for FBS offers. 7-on-7 leagues (especially in Texas, Florida, Georgia, California) provide additional exposure for skill positions. The transfer portal has fundamentally changed roster construction; many FBS programs reserve 10–15 scholarships per cycle for portal transfers, reducing high-school class sizes. Position groups are highly stratified — QBs are evaluated by a different rubric than OL or DBs, and roster depth at one position has no bearing on availability at another. Physical measurables (height, weight, 40-yard dash, vertical jump, bench press) carry more weight than in any other college sport.',

  matchEngineContext: {
    playerBandDefinitions: `Band A (Power 4 FBS / Elite Recruit):
- 247Sports composite rating ≥ 0.92 (high 4-star to 5-star) OR multiple confirmed Power 4 offers
- Invited to Nike Opening Finals, Elite 11 (QBs), or All-American Bowl
- Plays at national power high school (IMG, St. John Bosco, Mater Dei, Bishop Gorman, etc.) OR top program in a recruiting hotbed (TX, FL, GA, CA, OH, AL)
- Physical markers (guideline by position):
  - QB: ≥ 6'2", 200 lbs, completion % ≥ 65, ≥ 25 TDs/season at HS varsity
  - RB: ≥ 5'10", 200 lbs, sub-4.5 forty
  - WR: ≥ 6'1", 4.5 forty, 800+ receiving yards as junior
  - TE: ≥ 6'4", 240 lbs, both blocking and receiving production
  - OL: ≥ 6'4", 290 lbs, sub-5.2 forty
  - DL: ≥ 6'3", 270 lbs, ≥ 8 sacks/year
  - LB: ≥ 6'1", 220 lbs, sub-4.7 forty, 100+ tackles
  - DB: ≥ 5'11" (CB) or 6'1" (S), sub-4.5 forty, multiple INTs

Band B (G5 FBS / Top FCS):
- Composite rating 0.84-0.91 (mid 3-star to low 4-star) OR confirmed G5 FBS offers + FCS interest
- Regional camp standout, all-state honors
- Solid measurables that fall just short of Band A thresholds
- Typically plays at strong state-level high school
- Positional fit but maybe one weakness (size, speed, frame, or limited passing-style fit)

Band C (FCS / Top D2):
- Composite 0.80-0.84 (low 3-star or unranked but recruited)
- FCS interest with several D2 offers
- Solid varsity production, all-conference, possibly all-region
- Limited national camp exposure but strong regional film
- Late bloomer or undersized for position

Band D (D2 / D3 / NAIA / JUCO):
- Unrated or unranked
- Limited or zero offers from D1 / D2
- Late development, smaller school, or with academic/personal complications that limit FBS interest
- Strong fit for D3 academic schools, NAIA, or JUCO transfer pathway`,

    rosterBandDefinitions: `Band A → Power 4 FBS programs (SEC, Big Ten, ACC, Big 12) — Alabama, Georgia, Ohio State, Michigan, Texas, USC, Penn State, Notre Dame, LSU, Oklahoma, Florida, Tennessee, Auburn, Oregon, Clemson, Florida State, Miami, Wisconsin, Michigan State, Iowa, etc. Top G5 programs (Boise State, Memphis, UCF, Cincinnati pre-Big-12) sometimes belong here.
Band B → G5 FBS (American, Mountain West, MAC, Sun Belt, CUSA) plus elite FCS — Sam Houston, North Dakota State, South Dakota State, Montana, Montana State, James Madison (pre-FBS), Yale, Princeton (Ivies as a special case — top academic FCS).
Band C → Lower FBS (lower-tier G5), mid-FCS (Big Sky, MEAC, SWAC, Pioneer League, Patriot), top D2 (Ferris State, Grand Valley State, West Florida, Slippery Rock, Lenoir-Rhyne).
Band D → Lower D2, NCAA D3, NAIA, NJCAA programs. Mount Union, Mary Hardin-Baylor, Linfield, Whitewater are elite D3 but compete at a level that often beats lower D2 programs.`,

    positionDepths: `Football roster depths are extremely position-specific (105-player FBS roster, 100ish FCS, 110ish D2). Typical healthy roster counts:
- QB: 4 (1 starter + 1 backup + 2 development)
- RB: 5-6
- WR: 8-10
- TE: 4-5
- OL (T/G/C combined): 16-18
- DL (DT + DE + Edge): 10-12
- LB (ILB + OLB): 8-10
- DB (CB + S): 10-12
- K: 1-2
- P: 1-2
- LS: 1-2
- ATH (utility): 0-2

Scoring (relative to typical healthy count for that position):
- Clear need (below typical, OR 2+ graduating in player's class year, OR transfer portal exits): 22-25
- Moderate need (at typical count, 1 senior graduating): 14-21
- Saturated (above typical, no upcoming graduations, or recently signed multiple at this position): 6-13

Special note: FBS programs use the transfer portal aggressively. A position that looked saturated in March may have multiple openings by May. Conversely, a recent commit at the same position can effectively close a class group. Recent transfer portal activity should override roster depth assumptions.`,

    prestigeExamples: `High-prestige FBS (Power 4 blue bloods + perennial top-10): Alabama, Georgia, Ohio State, Michigan, Texas, USC, Notre Dame, LSU, Oklahoma, Penn State, Florida, Tennessee, Auburn, Oregon, Clemson, Miami, Florida State, Wisconsin, Michigan State, Iowa
Mid-prestige FBS (Power 4 mid-tier + top G5): Texas A&M, Arkansas, Kentucky, South Carolina, Mississippi State, Ole Miss, Nebraska, Northwestern, Washington, UCLA, Stanford, Cal, NC State, Virginia Tech, Pittsburgh, Boston College, Louisville, West Virginia, Kansas State, TCU, Baylor, Boise State, Memphis, Cincinnati, Tulane, UCF, Houston (G5 elite)
High-prestige FCS: North Dakota State, South Dakota State, Sam Houston (recently FBS), Montana, Montana State, Yale, Princeton, Harvard, Dartmouth, Ivy League broadly
High-prestige D2: Ferris State, Grand Valley State, West Florida, Indianapolis, Slippery Rock, Pittsburgh State, Northwest Missouri State, Lenoir-Rhyne, Valdosta State
High-prestige D3: Mount Union, Mary Hardin-Baylor, Linfield, Whitewater, North Central (IL), Wartburg, Hardin-Simmons, Wesley
High-prestige NAIA: Morningside, Northwestern (IA), Marian (IN), Lindsey Wilson, Grand View, Keiser`,

    rankingPollName: 'AP (Associated Press) Top 25 (FBS) / FCS Coaches Poll (FCS)',
    programUrlColumn: 'FootballURL',
    ptScoreNote:
      'Football PT score is highly position-specific. QBs almost always redshirt unless the previous starter just graduated AND the recruit is a 4-star+ talent. OL typically take 1-2 years before significant playing time. WRs, RBs, and DBs can play as true freshmen if they fit a specific role. LBs and DLs need development time at most schools. Special teams positions (K/P/LS) often have immediate opportunity if a senior is graduating. Always factor in the transfer portal — a portal addition at the same position can close a freshman opportunity quickly.',
    clubUpliftRule:
      'If a player has a 247Sports composite rating ≥ 0.85 (mid 3-star or higher), played at a national power high school, OR holds confirmed offers from Power 4 programs, lean toward more Power 4 / G5 FBS schools — unless the player explicitly excludes FBS from Target Levels. Composite rating below 0.80 with no FBS offers should generally lean FCS, D2, or NAIA. Watch for late-blooming "post-grad/prep school" prospects who can earn FBS offers in their PG year.',
  },

  active: true,
}
