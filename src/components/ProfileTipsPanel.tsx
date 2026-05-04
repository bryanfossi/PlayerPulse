'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Loader2, TrendingUp, AlertTriangle, Lightbulb, Star, Flame, Plus, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Tip {
  category: string
  severity: 'Critical' | 'Important' | 'Suggestion'
  title: string
  detail: string
}

interface ProfileTipsData {
  overall_readiness: 'Strong' | 'On Track' | 'Needs Work' | 'Not Ready'
  tips: Tip[]
  strongest_asset: string
  biggest_risk: string
}

const SEVERITY_CONFIG = {
  Critical: {
    icon: Flame,
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  Important: {
    icon: AlertTriangle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  Suggestion: {
    icon: Lightbulb,
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
}

const READINESS_CONFIG = {
  Strong: 'bg-green-500/10 text-green-400 border-green-500/20',
  'On Track': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Needs Work': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Not Ready': 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function ProfileTipsPanel() {
  const [data, setData] = useState<ProfileTipsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTips() {
      try {
        const res = await fetch('/api/ai/profile-tips', { method: 'POST' })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to load tips')
          return
        }
        if (Array.isArray(json.tips)) {
          setData({
            overall_readiness: 'On Track',
            tips: json.tips.map((t: { tip: string; priority: string }) => ({
              category: 'Profile',
              severity: t.priority === 'high' ? 'Critical' : t.priority === 'medium' ? 'Important' : 'Suggestion',
              title: t.tip.slice(0, 60),
              detail: t.tip,
            })),
            strongest_asset: '',
            biggest_risk: '',
          })
        } else {
          setData(json.tips ?? json)
        }
      } catch {
        setError('Network error — please try again')
      } finally {
        setLoading(false)
      }
    }
    fetchTips()
  }, [])

  async function handleSaveAsAction(tip: Tip, key: string) {
    setSavingKey(key)
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tip.title.slice(0, 200),
          description: tip.detail,
          source: 'profile_tip',
          source_payload: { category: tip.category, severity: tip.severity },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Could not save action.')
        return
      }
      setSavedKeys((prev) => new Set(prev).add(key))
      toast.success('Saved to your actions list')
    } catch {
      toast.error('Network error — could not save action.')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Analyzing your profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive py-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    )
  }

  if (!data) return null

  const criticalTips = data.tips.filter((t) => t.severity === 'Critical')
  const importantTips = data.tips.filter((t) => t.severity === 'Important')
  const suggestionTips = data.tips.filter((t) => t.severity === 'Suggestion')

  return (
    <div className="space-y-5">
      {/* Readiness badge */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn('text-sm font-bold px-3 py-1', READINESS_CONFIG[data.overall_readiness])}
        >
          {data.overall_readiness}
        </Badge>
        <span className="text-xs text-muted-foreground">Overall Readiness</span>
      </div>

      {(data.strongest_asset || data.biggest_risk) && (
        <div className="grid grid-cols-1 gap-3">
          {data.strongest_asset && (
            <div className="flex items-start gap-3 rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3">
              <Star className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-0.5">Strongest Asset</p>
                <p className="text-xs text-muted-foreground">{data.strongest_asset}</p>
              </div>
            </div>
          )}
          {data.biggest_risk && (
            <div className="flex items-start gap-3 rounded-lg bg-red-500/5 border border-red-500/10 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">Biggest Risk</p>
                <p className="text-xs text-muted-foreground">{data.biggest_risk}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {[
        { list: criticalTips, severity: 'Critical' as const },
        { list: importantTips, severity: 'Important' as const },
        { list: suggestionTips, severity: 'Suggestion' as const },
      ].map(({ list, severity }) =>
        list.length > 0 ? (
          <div key={severity} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{severity}</p>
            {list.map((tip, i) => {
              const cfg = SEVERITY_CONFIG[severity]
              const Icon = cfg.icon
              const key = `${severity}-${i}`
              const saved = savedKeys.has(key)
              const saving = savingKey === key
              return (
                <div
                  key={i}
                  className={cn('border-l-2 rounded-r-lg px-4 py-3 space-y-2', cfg.border, cfg.bg)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-semibold leading-none">{tip.title}</p>
                    <span className={cn('ml-auto text-[10px] px-2 py-0.5 rounded-full border font-medium', cfg.badge)}>
                      {tip.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.detail}</p>
                  <div className="pt-1">
                    <button
                      onClick={() => !saved && handleSaveAsAction(tip, key)}
                      disabled={saved || saving}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors',
                        saved
                          ? 'border-green-500/30 bg-green-500/10 text-green-400 cursor-default'
                          : 'border-white/15 hover:border-[#4ADE80] hover:bg-[#4ADE80]/10 hover:text-[#4ADE80]',
                      )}
                    >
                      {saved ? (
                        <>
                          <Check className="w-3 h-3" />
                          Added to Actions
                        </>
                      ) : saving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Save as Action
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null
      )}

      {data.tips.length === 0 && (
        <div className="text-center py-6">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No tips available at this time.</p>
        </div>
      )}
    </div>
  )
}
