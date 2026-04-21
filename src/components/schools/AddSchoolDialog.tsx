'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { Search, Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types/app'

interface SchoolResult {
  id: string
  name: string
  verified_division: string | null
  city: string | null
  state: string | null
  conference: string | null
}

interface Props {
  playerId: string
  onAdded: () => void
}

export function AddSchoolDialog({ playerId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchoolResult[]>([])
  const [selected, setSelected] = useState<SchoolResult | null>(null)
  const [tier, setTier] = useState<Tier | ''>('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()
    if (q.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setSearching(true)
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(q)}`, {
          signal: abortRef.current.signal,
        })
        const json = await res.json()
        setResults(json.schools ?? [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    setSelected(null)
    setError('')
    search(val)
  }

  function handleSelect(school: SchoolResult) {
    setSelected(school)
    setQuery(school.name)
    setResults([])
  }

  function handleAdd() {
    if (!selected && !query.trim()) {
      setError('Enter a school name')
      return
    }
    setError('')

    startTransition(async () => {
      const body: Record<string, unknown> = {}
      if (selected) {
        body.school_id = selected.id
      } else {
        body.school_name = query.trim()
      }
      if (tier) body.tier = tier

      const res = await fetch('/api/player-schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to add school')
        return
      }

      setOpen(false)
      setQuery('')
      setSelected(null)
      setTier('')
      setResults([])
      onAdded()
    })
  }

  function handleClose() {
    setOpen(false)
    setQuery('')
    setSelected(null)
    setTier('')
    setResults([])
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add School
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add School</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search */}
          <div className="space-y-1.5">
            <Label htmlFor="school-search">School Name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="school-search"
                placeholder="Search schools..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-8"
                autoComplete="off"
              />
              {selected && (
                <button
                  onClick={() => { setSelected(null); setQuery(''); setResults([]) }}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {results.length > 0 && !selected && (
              <div className="border border-border rounded-md bg-popover shadow-md overflow-hidden max-h-52 overflow-y-auto">
                {results.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm transition-colors flex items-start gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[s.city, s.state].filter(Boolean).join(', ')}
                        {s.conference && ` · ${s.conference}`}
                      </p>
                    </div>
                    {s.verified_division && (
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">
                        {s.verified_division}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <p className="text-xs text-muted-foreground pl-1">Searching...</p>
            )}

            {!searching && query.length >= 2 && results.length === 0 && !selected && (
              <p className="text-xs text-muted-foreground pl-1">
                No existing schools found — will add &ldquo;{query}&rdquo; as a new entry.
              </p>
            )}
          </div>

          {/* Tier */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-select">Tier (optional)</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as Tier | '')}>
              <SelectTrigger id="tier-select">
                <SelectValue placeholder="Assign tier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lock">Lock</SelectItem>
                <SelectItem value="Realistic">Realistic</SelectItem>
                <SelectItem value="Reach">Reach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={pending || (!query.trim())}
            >
              {pending ? 'Adding...' : 'Add School'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
