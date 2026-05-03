export type ThemeName = 'dark' | 'light' | 'neutral'

export interface ThemeTokens {
  bg: string
  surface: string
  textPrimary: string
  textSecondary: string
  accent: string
  border: string
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0f1a2e',
    surface: '#1A3A5C',
    textPrimary: '#FFFFFF',
    textSecondary: '#8aabcc',
    accent: '#C9A227',
    border: '#2a4a6a',
  },
  light: {
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    textPrimary: '#1A3A5C',
    textSecondary: '#4a6a8a',
    accent: '#C9A227',
    border: '#D1DCE8',
  },
  neutral: {
    bg: '#F0EDE8',
    surface: '#FFFFFF',
    textPrimary: '#2C2C2C',
    textSecondary: '#6B6B6B',
    accent: '#C9A227',
    border: '#D8D3CC',
  },
}

export const THEME_LABELS: Record<ThemeName, string> = {
  dark: 'Dark',
  light: 'Light',
  neutral: 'Neutral',
}
