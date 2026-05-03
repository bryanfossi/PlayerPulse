'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ThemeName, ThemeTokens } from '@/lib/themes'
import { THEMES } from '@/lib/themes'

const STORAGE_KEY = 'playerpulse-theme'

// Tailwind HSL overrides per theme (these values map to CSS vars used by Tailwind)
const TAILWIND_OVERRIDES: Record<ThemeName, Record<string, string>> = {
  dark: {},  // Dark uses the .dark class — no :root overrides needed
  light: {
    '--background': '220 33% 97%',
    '--foreground': '214 62% 23%',
    '--card': '0 0% 100%',
    '--card-foreground': '214 62% 23%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '214 62% 23%',
    '--primary': '142 60% 35%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '214 30% 90%',
    '--secondary-foreground': '214 62% 23%',
    '--muted': '214 25% 92%',
    '--muted-foreground': '214 35% 46%',
    '--accent': '214 25% 90%',
    '--accent-foreground': '214 62% 23%',
    '--border': '214 35% 85%',
    '--input': '214 35% 85%',
    '--ring': '142 60% 35%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 98%',
  },
  neutral: {
    '--background': '30 17% 91%',
    '--foreground': '0 0% 17%',
    '--card': '0 0% 100%',
    '--card-foreground': '0 0% 17%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '0 0% 17%',
    '--primary': '142 60% 32%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '30 12% 86%',
    '--secondary-foreground': '0 0% 17%',
    '--muted': '30 12% 87%',
    '--muted-foreground': '0 0% 42%',
    '--accent': '30 12% 85%',
    '--accent-foreground': '0 0% 17%',
    '--border': '30 10% 82%',
    '--input': '30 10% 82%',
    '--ring': '142 60% 32%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 98%',
  },
}

interface ThemeContextValue {
  theme: ThemeName
  tokens: ThemeTokens
  setTheme: (t: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  tokens: THEMES.dark,
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyTheme(theme: ThemeName) {
  const root = document.documentElement
  const overrides = TAILWIND_OVERRIDES[theme]

  // Reset any previously injected custom props
  const allKeys = new Set([
    ...Object.keys(TAILWIND_OVERRIDES.light),
    ...Object.keys(TAILWIND_OVERRIDES.neutral),
  ])
  allKeys.forEach((k) => root.style.removeProperty(k))

  if (theme === 'dark') {
    // Restore dark class, remove light/neutral classes
    root.classList.add('dark')
    root.classList.remove('theme-light', 'theme-neutral')
  } else {
    // Remove dark so dark: utilities don't apply
    root.classList.remove('dark')
    root.classList.add(`theme-${theme}`)
    root.classList.remove(theme === 'light' ? 'theme-neutral' : 'theme-light')
    // Apply Tailwind var overrides directly on :root
    Object.entries(overrides).forEach(([k, v]) => root.style.setProperty(k, v))
  }

  // Always apply semantic color vars
  const t = THEMES[theme]
  root.style.setProperty('--color-bg', t.bg)
  root.style.setProperty('--color-surface', t.surface)
  root.style.setProperty('--color-text-primary', t.textPrimary)
  root.style.setProperty('--color-text-secondary', t.textSecondary)
  root.style.setProperty('--color-accent', t.accent)
  root.style.setProperty('--color-border', t.border)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    const initial: ThemeName = saved && saved in THEMES ? saved : 'dark'
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  function setTheme(t: ThemeName) {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, tokens: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
