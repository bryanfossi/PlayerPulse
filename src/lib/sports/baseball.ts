import type { SportConfig } from './types'

/**
 * Baseball — skeleton config (not yet active).
 * Stats and showcase types intentionally left empty for later population.
 */
export const baseball: SportConfig = {
  id: 'baseball',
  name: 'Baseball',
  icon: 'Circle',

  divisions: [
    {
      id: 'd1',
      name: 'NCAA D1',
      governingBody: 'NCAA',
      programCount: 299,
      mensScholarships: 11.7,
      notes:
        'Equivalency sport. Roster cap of 40 (35 active for ABC purposes), with a maximum of 27 players receiving aid; minimum 25% scholarship per recipient.',
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 270,
      mensScholarships: 9,
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 380,
      mensScholarships: null,
      notes: 'No athletic scholarships.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 215,
      mensScholarships: 12,
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
      mensScholarships: 24,
    },
    {
      id: 'njcaa-d2',
      name: 'NJCAA D2',
      governingBody: 'NJCAA',
      mensScholarships: 24,
    },
    {
      id: 'njcaa-d3',
      name: 'NJCAA D3',
      governingBody: 'NJCAA',
      mensScholarships: null,
    },
  ],

  scholarshipRules: {
    type: 'equivalency',
    summary:
      'Baseball is an equivalency sport with strict NCAA aid-distribution rules at the D1 level (e.g. 27-player aid cap, 25% minimum scholarship).',
  },

  recruitingTimeline: {
    earlyContactGrade: '9th',
    officialContactDate: 'August 1 before junior year (NCAA D1)',
    notes:
      'MLB Draft is a major influence on roster composition each summer; programs constantly recalibrate recruit needs.',
  },

  positions: [
    'Pitcher',
    'Catcher',
    'First Base',
    'Second Base',
    'Shortstop',
    'Third Base',
    'Left Field',
    'Center Field',
    'Right Field',
    'Designated Hitter',
    'Utility',
  ],

  clubLevels: [
    'Perfect Game National',
    'Perfect Game Regional',
    'WWBA',
    'PBR',
    'Travel Ball Elite',
    'Travel Ball Regional',
    'High School Only',
    'Other',
  ],

  stats: [],
  showcaseTypes: [],
  emailTemplates: [],

  aiPromptContext:
    'College baseball recruiting in the United States operates under NCAA, NAIA, and NJCAA rules. NCAA D1 baseball is an equivalency sport with a roster cap and a 27-player aid limit (minimum 25% scholarship), so most players are on partial aid. JUCO is a major pipeline — players who do not commit out of high school often spend two years at NJCAA programs to develop. Showcase events (Perfect Game, Prep Baseball Report) and travel-ball tournaments drive most evaluations. Velocity (pitchers), exit velocity, 60-yard dash, and pop time (catchers) are the headline measurables.',

  active: false,
}
