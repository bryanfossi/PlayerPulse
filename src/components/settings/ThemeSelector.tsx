'use client'

import { Check } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { THEMES, THEME_LABELS, type ThemeName } from '@/lib/themes'

const THEME_ORDER: ThemeName[] = ['dark', 'light', 'neutral']

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
      style={{ background: color }}
    />
  )
}

export function ThemeSelector() {
  const { theme: active, setTheme } = useTheme()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEME_ORDER.map((name) => {
          const t = THEMES[name]
          const isActive = active === name
          return (
            <button
              key={name}
              onClick={() => setTheme(name)}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                isActive
                  ? 'border-[#C9A227] shadow-md shadow-[#C9A227]/10'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
              style={{ background: t.bg }}
            >
              {/* Selected checkmark */}
              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#C9A227] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#1A3A5C]" />
                </span>
              )}

              {/* Theme name */}
              <p
                className="text-sm font-bold mb-3"
                style={{ color: t.textPrimary }}
              >
                {THEME_LABELS[name]}
              </p>

              {/* Color swatches */}
              <div className="flex items-center gap-1.5">
                <Swatch color={t.bg} />
                <Swatch color={t.surface} />
                <Swatch color={t.accent} />
                <Swatch color={t.textSecondary} />
              </div>

              {/* Mini preview bar */}
              <div
                className="mt-3 rounded-md p-2 text-[10px]"
                style={{ background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}
              >
                <span style={{ color: t.textPrimary, fontWeight: 600 }}>PlayerPulse</span>
                {' · '}
                <span style={{ color: t.accent }}>Match Engine</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
