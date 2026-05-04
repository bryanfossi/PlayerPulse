export type ThemeName = 'dark' | 'light' | 'neutral'

export interface ThemeTokens {
  bg: string
  surface: string
  textPrimary: string
  textSecondary: string
  accent: string
  border: string
}

// FuseID brand-aligned tokens. The primary "dark" theme matches the
// brand spec exactly — the other themes remain available for the theme
// selector preview but should mostly route users to dark.
export const THEMES: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0F1120',
    surface: '#1A1F38',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    accent: '#4ADE80',
    border: 'rgba(255,255,255,0.1)',
  },
  light: {
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    textPrimary: '#0F1120',
    textSecondary: '#4B5563',
    accent: '#22C55E',
    border: '#E5E7EB',
  },
  neutral: {
    bg: '#F0EDE8',
    surface: '#FFFFFF',
    textPrimary: '#2C2C2C',
    textSecondary: '#6B6B6B',
    accent: '#22C55E',
    border: '#D8D3CC',
  },
}

export const THEME_LABELS: Record<ThemeName, string> = {
  dark: 'Dark',
  light: 'Light',
  neutral: 'Neutral',
}
