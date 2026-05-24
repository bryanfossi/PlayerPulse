'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ThemeName, ThemeTokens } from '@/lib/themes'
import { THEMES } from '@/lib/themes'

const STORAGE_KEY = 'fuseid-theme'

/**
 * FUSE-ID theme system.
 *
 * Both modes' colors live in globals.css as CSS custom properties
 * (`:root` = light, `.dark` = dark overrides). This provider just toggles
 * the `dark` class on `documentElement` based on user preference.
 *
 * The pre-hydration script in layout.tsx applies the correct class
 * before React mounts, so there's no flash of unstyled content.
 */

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
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  // Clean up legacy classes from the previous multi-theme implementation
  root.classList.remove('theme-light', 'theme-neutral')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const initial: ThemeName = saved === 'light' ? 'light' : 'dark'
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
