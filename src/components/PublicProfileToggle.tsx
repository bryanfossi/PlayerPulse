'use client'

import { useState, useTransition } from 'react'
import { Globe, Copy, CheckCircle2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  slug: string | null
  enabled: boolean
}

export function PublicProfileToggle({ slug, enabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const profileUrl = slug ? `${appUrl}/player/${slug}` : null

  async function handleGenerate() {
    startTransition(async () => {
      const res = await fetch('/api/profile/generate-slug', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.slug) {
        setEnabled(true)
      }
    })
  }

  async function handleToggle() {
    if (!slug) return
    const newEnabled = !enabled
    setEnabled(newEnabled)
    await fetch('/api/profile/toggle-public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: newEnabled }),
    })
  }

  async function handleCopy() {
    if (!profileUrl) return
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  if (!slug) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Public Profile</p>
        </div>
        <p className="text-xs text-muted-foreground">Create a shareable link you can send directly to college coaches.</p>
        <Button size="sm" className="w-full gap-1.5" onClick={handleGenerate} disabled={pending}>
          <Globe className="w-3.5 h-3.5" />
          {pending ? 'Creating...' : 'Create Public Profile'}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Public Profile</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            enabled ? 'text-green-400 hover:text-red-400' : 'text-muted-foreground hover:text-green-400'
          }`}
        >
          {enabled ? (
            <><Eye className="w-3.5 h-3.5" /> Live</>
          ) : (
            <><EyeOff className="w-3.5 h-3.5" /> Hidden</>
          )}
        </button>
      </div>

      <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${enabled ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/30 opacity-60'}`}>
        <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{profileUrl}</p>
        <button onClick={handleCopy} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        {enabled && (
          <a href={profileUrl!} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">Share this link directly with college coaches</p>
    </div>
  )
}
