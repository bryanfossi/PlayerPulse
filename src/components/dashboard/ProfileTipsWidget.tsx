'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Tip {
  tip: string
  priority: 'high' | 'medium' | 'low'
}

const PRIORITY_STYLES = {
  high: 'border-l-red-400 bg-red-50/50 dark:bg-red-950/10',
  medium: 'border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/10',
  low: 'border-l-green-400 bg-green-50/50 dark:bg-green-950/10',
}

const PRIORITY_LABELS = {
  high: 'Do this first',
  medium: 'This week',
  low: 'When ready',
}

export function ProfileTipsWidget() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  async function fetchTips() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/profile-tips', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to generate tips'); return }
      setTips(json.tips ?? [])
      setGenerated(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Recruiting Tips
          </CardTitle>
          {generated && (
            <button
              onClick={fetchTips}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Refresh tips"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!generated && !loading && (
          <div className="text-center py-2 space-y-3">
            <div className="flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground">Get personalized advice based on your current recruiting status</p>
            <Button size="sm" onClick={fetchTips} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Generate Tips
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-md" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {generated && !loading && tips.length > 0 && (
          <div className="space-y-2">
            {tips.map((t, i) => (
              <div
                key={i}
                className={cn('border-l-2 pl-3 py-1.5 rounded-r text-xs', PRIORITY_STYLES[t.priority])}
              >
                <p className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  {PRIORITY_LABELS[t.priority]}
                </p>
                <p className="text-foreground leading-snug">{t.tip}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
