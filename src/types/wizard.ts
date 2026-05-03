export const TUITION_OPTIONS = [
  'Not a factor',
  'Somewhat important',
  'Very important',
  'Critical',
] as const

export const TARGET_LEVEL_OPTIONS = ['D1', 'D2', 'D3', 'NAIA', 'JUCO'] as const

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
] as const

export const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => String(new Date().getFullYear() + i))

export const BUDGET_OPTIONS = [
  'Not sure',
  'Under $10,000',
  '$10,000–$15,000',
  '$15,000–$20,000',
  '$20,000–$25,000',
  '$25,000–$35,000',
  '$35,000–$45,000',
  '$45,000–$55,000',
  'No limit',
] as const

export interface WizardData {
  // Step 1 – Personal
  sport_id: string
  first_name: string
  last_name: string
  gender: string
  grad_year: string
  home_city: string
  home_state: string
  // Step 2 – Academic
  unweighted_gpa: string
  sat_score: string
  act_score: string
  high_school: string
  // Step 3 – Athletic
  primary_position: string
  secondary_position: string
  club_team: string
  highest_club_level: string
  highlight_url: string
  height_feet: string
  height_inches: string
  // Step 4 – Preferences
  target_levels: string[]
  recruiting_radius_mi: string
  tuition_importance: string
  annual_tuition_budget: string
  // Step 5 – Forced schools
  forced_schools: string
  // Internal
  player_id: string | null
}

export const DEFAULT_WIZARD_DATA: WizardData = {
  sport_id: 'soccer',
  first_name: '',
  last_name: '',
  gender: '',
  grad_year: '',
  home_city: '',
  home_state: '',
  unweighted_gpa: '',
  sat_score: '',
  act_score: '',
  high_school: '',
  primary_position: '',
  secondary_position: '',
  club_team: '',
  highest_club_level: '',
  highlight_url: '',
  height_feet: '',
  height_inches: '',
  target_levels: ['D1', 'D2', 'D3'],
  recruiting_radius_mi: '',
  tuition_importance: 'Not a factor',
  annual_tuition_budget: '',
  forced_schools: '',
  player_id: null,
}

export const WIZARD_STEPS = [
  { path: '/onboarding',             label: 'Personal'     },
  { path: '/onboarding/academic',    label: 'Academic'     },
  { path: '/onboarding/athletic',    label: 'Athletic'     },
  { path: '/onboarding/preferences', label: 'Preferences'  },
  { path: '/onboarding/schools',     label: 'Schools'      },
  { path: '/onboarding/generating',  label: 'Generating'   },
  { path: '/onboarding/complete',    label: 'Complete'     },
] as const
