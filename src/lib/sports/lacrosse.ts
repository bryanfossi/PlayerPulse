import type { SportConfig } from './types'

/**
 * Lacrosse — skeleton config (not yet active).
 * Stats and showcase types intentionally left empty for later population.
 */
export const lacrosse: SportConfig = {
  id: 'lacrosse',
  name: 'Lacrosse',
  icon: 'Swords',

  divisions: [
    {
      id: 'd1',
      name: 'NCAA D1',
      governingBody: 'NCAA',
      programCount: 75,
      mensScholarships: 12.6,
      womensScholarships: 12,
      notes: 'Equivalency sport — most players receive partial aid.',
    },
    {
      id: 'd2',
      name: 'NCAA D2',
      governingBody: 'NCAA',
      programCount: 95,
      mensScholarships: 10.8,
      womensScholarships: 9.9,
    },
    {
      id: 'd3',
      name: 'NCAA D3',
      governingBody: 'NCAA',
      programCount: 250,
      mensScholarships: null,
      womensScholarships: null,
      notes: 'No athletic scholarships. Largest division by program count for lacrosse.',
    },
    {
      id: 'naia',
      name: 'NAIA',
      governingBody: 'NAIA',
      programCount: 45,
      mensScholarships: 12,
      womensScholarships: 12,
    },
    {
      id: 'njcaa-d1',
      name: 'NJCAA D1',
      governingBody: 'NJCAA',
    },
    {
      id: 'njcaa-d2',
      name: 'NJCAA D2',
      governingBody: 'NJCAA',
    },
    {
      id: 'njcaa-d3',
      name: 'NJCAA D3',
      governingBody: 'NJCAA',
      mensScholarships: null,
      womensScholarships: null,
    },
  ],

  scholarshipRules: {
    type: 'equivalency',
    summary:
      'Lacrosse is an equivalency sport at every scholarship-offering level. Aid is typically split across the roster.',
  },

  recruitingTimeline: {
    earlyContactGrade: '9th',
    officialContactDate: 'September 1 of junior year (NCAA D1)',
    notes:
      'Lacrosse adopted later contact rules in 2017 to slow early recruiting; September 1 of junior year is when most direct contact begins.',
  },

  positions: [
    'Goalie',
    'Defense',
    'Long Stick Midfielder',
    'Defensive Midfielder',
    'Midfielder',
    'Face-off Specialist',
    'Attack',
  ],

  clubLevels: [
    'National Lacrosse Federation (NLF)',
    'Under Armour Recruiting Series',
    'US Lacrosse National',
    'Club Elite',
    'Club Regional',
    'High School Only',
    'Other',
  ],

  stats: [],
  showcaseTypes: [],
  emailTemplates: [],

  aiPromptContext:
    'College lacrosse recruiting in the United States operates under NCAA, NAIA, and NJCAA rules. Lacrosse is an equivalency sport at every scholarship-offering level, so partial aid is the norm. The Northeast and Mid-Atlantic remain the strongest recruiting hotbeds, though the sport is rapidly growing nationally. Coaches evaluate stick skills, lacrosse IQ, athleticism, and position-specific traits, with film from club tournaments (e.g. summer travel circuits) heavily weighted.',

  active: false,
}
