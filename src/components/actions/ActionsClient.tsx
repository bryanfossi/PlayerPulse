'use client'

import { useState, useTransition } from 'react'
import { Plus, Check, Trash2, Calendar, Sparkles, Loader2, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type ActionRow = Database['public']['Tables']['actions']['Row']
type ActionStatus = ActionRow['status']

interface SchoolOption {
  player_school_id: string
  school_name: string
  verified_division: string | null
}

interface Props {
  initialActions: ActionRow[]
  schools: SchoolOption[]
}

const STATUS_TABS: Array<{ value: 'open' | 'completed' | 'all'; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
]

const SOURCE_LABEL: Record<ActionRow['source'], string> = {
  manual: 'Manual',
  profile_tip: 'AI Tip',
  follow_up: 'Follow-up',
  system: 'System',
}

const SOURCE_COLOR: Record<ActionRow['source'], string> = {
  manual: '#9CA3AF',
  profile_tip: '#4ADE80',
  follow_up: '#60A5FA',
  system: '#9CA3AF',
}

export function ActionsClient({ initialActions, schools }: Props) {
  const [actions, setActions] = useState<ActionRow[]>(initialActions)
  const [tab, setTab] = useState<'open' | 'completed' | 'all'>('open')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = actions.filter((a) => {
    if (tab === 'all') return a.status !== 'archived'
    return a.status === tab
  })

  function handleCreated(action: ActionRow) {
    setActions((prev) => [action, ...prev])
  }

  function handleUpdated(updated: ActionRow) {
    setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleDeleted(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id))
  }

  const counts = {
    open: actions.filter((a) => a.status === 'open').length,
    completed: actions.filter((a) => a.status === 'completed').length,
  }

  return (
    <div className="space-y-4">
      {/* Tabs + add button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex rounded-md border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {STATUS_TABS.map((t) => {
            const active = tab === t.value
            const count = t.value === 'open' ? counts.open : t.value === 'completed' ? counts.completed : actions.length
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium transition-colors',
                  active ? 'bg-[#4ADE80] text-[#0F1120]' : 'hover:bg-white/5 text-muted-foreground',
                )}
              >
                {t.label} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        <Button
          onClick={() => setAddOpen(true)}
          className="gap-1.5"
          style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
        >
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border px-6 py-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            {tab === 'open' ? 'No open actions. Add one or save tips from your dashboard.' :
             tab === 'completed' ? 'No completed actions yet.' :
             'No actions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <ActionRow
              key={a.id}
              action={a}
              schools={schools}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      <AddActionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        schools={schools}
        onCreated={handleCreated}
      />
    </div>
  )
}

function ActionRow({ action, schools, onUpdated, onDeleted }: {
  action: ActionRow
  schools: SchoolOption[]
  onUpdated: (a: ActionRow) => void
  onDeleted: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const isCompleted = action.status === 'completed'
  const linkedSchool = schools.find((s) => s.player_school_id === action.player_school_id)

  function toggleComplete() {
    const newStatus: ActionStatus = isCompleted ? 'open' : 'completed'
    // Optimistic
    onUpdated({
      ...action,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    })
    startTransition(async () => {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        onUpdated(action) // rollback
        toast.error('Could not update action.')
      }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${action.title}"?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/actions/${action.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Could not delete action.')
        return
      }
      onDeleted(action.id)
    })
  }

  const dueDate = action.due_date ? new Date(action.due_date + 'T00:00:00') : null
  const today = new Date(new Date().toDateString())
  const overdue = dueDate ? dueDate < today && !isCompleted : false
  const dueLabel = dueDate
    ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: dueDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
    : null

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 flex items-start gap-3 transition-opacity',
        pending && 'opacity-60',
      )}
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        disabled={pending}
        className={cn(
          'flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          isCompleted
            ? 'bg-[#4ADE80] border-[#4ADE80]'
            : 'border-white/20 hover:border-[#4ADE80]',
        )}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted && <Check className="w-3 h-3" style={{ color: '#0F1120' }} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-snug', isCompleted && 'line-through opacity-60')}>
          {action.title}
        </p>
        {action.description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#9CA3AF' }}>
            {action.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] flex-wrap" style={{ color: '#9CA3AF' }}>
          {/* Source */}
          <span className="inline-flex items-center gap-1">
            {action.source === 'profile_tip' && <Sparkles className="w-3 h-3" style={{ color: SOURCE_COLOR[action.source] }} />}
            <span style={{ color: SOURCE_COLOR[action.source] }}>{SOURCE_LABEL[action.source]}</span>
          </span>

          {/* Linked school */}
          {linkedSchool && (
            <Link
              href={`/schools/${action.player_school_id}`}
              className="inline-flex items-center gap-0.5 hover:text-white transition-colors"
            >
              {linkedSchool.school_name}
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}

          {/* Due date */}
          {dueLabel && (
            <span className={cn('inline-flex items-center gap-1', overdue && 'text-red-400')}>
              <Calendar className="w-3 h-3" />
              {overdue ? 'Overdue · ' : 'Due '}{dueLabel}
            </span>
          )}

          {/* Completed date */}
          {isCompleted && action.completed_at && (
            <span>
              Completed{' '}
              {new Date(action.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="flex-shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors p-1 -mr-1"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function AddActionDialog({ open, onClose, schools, onCreated }: {
  open: boolean
  onClose: () => void
  schools: SchoolOption[]
  onCreated: (a: ActionRow) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [psId, setPsId] = useState<string>('')
  const [pending, startTransition] = useTransition()

  function handleClose() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setPsId('')
    onClose()
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Add a title')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          player_school_id: psId || null,
          source: 'manual',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Could not create action.')
        return
      }
      onCreated(json.action)
      toast.success('Action added')
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Action</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="action-title">Title *</Label>
            <Input
              id="action-title"
              autoFocus
              placeholder="e.g. Email Coach Smith at Duke"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action-desc">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="action-desc"
              placeholder="Anything you want to remember…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="action-due">Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="action-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Linked School <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={psId} onValueChange={(v) => setPsId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s.player_school_id} value={s.player_school_id}>
                      {s.school_name}
                      {s.verified_division && (
                        <span className="text-muted-foreground ml-1 text-[10px]">
                          ({s.verified_division})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={pending} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pending || !title.trim()}
              className="gap-1.5"
              style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
            >
              {pending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding…</>
              ) : (
                <><Plus className="w-3.5 h-3.5" /> Add Action</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
