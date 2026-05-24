export type ThemeName = 'dark' | 'light'

export interface ThemeTokens {
  bg: string
  surface: string
  textPrimary: string
  textSecondary: string
  accent: string
  border: string
}

// FUSE-ID brand-kit theme tokens — used by the ThemeSelector preview
// component. The actual app styling is driven by CSS custom properties
// in globals.css (:root for light, .dark for dark).
export const THEMES: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0f1120',
    surface: '#1a1f35',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    accent: '#4ade80',
    border: '#252b44',
  },
  light: {
    bg: '#ffffff',
    surface: '#f9fafb',
    textPrimary: '#0a0a0a',
    textSecondary: '#374151',
    accent: '#22c55e',
    border: '#e5e7eb',
  },
}

export const THEME_LABELS: Record<ThemeName, string> = {
  dark: 'Dark',
  light: 'Light',
}
