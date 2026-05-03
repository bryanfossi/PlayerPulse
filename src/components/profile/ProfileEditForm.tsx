'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Json, Database } from '@/types/database'
import type { PlayerAward, PlayerEvent, ScheduleEntry, HighlightClip } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']

const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF',
]

const DIVISIONS = ['D1', 'D2', 'D3', 'NAIA', 'JUCO']

const CLUB_LEVELS = [
  'MLS NEXT Pro Academy', 'MLS NEXT', 'ECNL', 'GA', 'ECRL', 'State League', 'Club/Recreational',
]

const TUITION_OPTIONS = [
  { value: 'Very Important', label: 'Very Important' },
  { value: 'Somewhat Important', label: 'Somewhat Important' },
  { value: 'Not Important', label: 'Not Important' },
]

type PlayerEditFields = Pick<
  PlayerRow,
  'first_name' | 'last_name' | 'grad_year' | 'gender' |
  'primary_position' | 'secondary_position' | 'height_inches' | 'weight_lbs' |
  'unweighted_gpa' | 'sat_score' | 'act_score' | 'club_team' | 'highest_club_level' |
  'high_school' | 'home_city' | 'home_state' | 'recruiting_radius_mi' |
  'target_levels' | 'annual_tuition_budget' | 'tuition_importance' | 'bio' | 'highlight_url' |
  'jersey_number' | 'hero_image_url' |
  'contact_phone' | 'contact_twitter' | 'contact_instagram' | 'contact_hudl' | 'contact_tiktok' | 'contact_youtube' |
  'coach_name' | 'coach_email' | 'coach_phone' |
  'class_rank' | 'intended_major' | 'academic_honors' |
  'stats_json' | 'awards_json' | 'upcoming_events_json' | 'match_schedule_json' | 'highlight_clips_json'
>

interface Props {
  player: PlayerEditFields
}

function toAwards(json: Json | null): PlayerAward[] {
  if (!Array.isArray(json)) return []
  return json as unknown as PlayerAward[]
}
function toEvents(json: Json | null): PlayerEvent[] {
  if (!Array.isArray(json)) return []
  return json as unknown as PlayerEvent[]
}
function toSchedule(json: Json | null): ScheduleEntry[] {
  if (!Array.isArray(json)) return []
  return json as unknown as ScheduleEntry[]
}
function toClips(json: Json | null): HighlightClip[] {
  if (!Array.isArray(json)) return []
  return json as unknown as HighlightClip[]
}
function toStats(json: Json | null): Record<string, string> {
  if (json && typeof json === 'object' && !Array.isArray(json)) return json as Record<string, string>
  return {}
}

export function ProfileEditForm({ player }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Core fields
  const [form, setForm] = useState({
    first_name: player.first_name,
    last_name: player.last_name,
    grad_year: String(player.grad_year),
    gender: player.gender,
    primary_position: player.primary_position,
    secondary_position: player.secondary_position ?? '',
    height_feet: player.height_inches != null ? String(Math.floor(player.height_inches / 12)) : '',
    height_inches_rem: player.height_inches != null ? String(player.height_inches % 12) : '',
    weight_lbs: player.weight_lbs != null ? String(player.weight_lbs) : '',
    unweighted_gpa: player.unweighted_gpa != null ? String(player.unweighted_gpa) : '',
    sat_score: player.sat_score != null ? String(player.sat_score) : '',
    act_score: player.act_score != null ? String(player.act_score) : '',
    club_team: player.club_team,
    highest_club_level: player.highest_club_level,
    high_school: player.high_school ?? '',
    home_city: player.home_city,
    home_state: player.home_state,
    recruiting_radius_mi: player.recruiting_radius_mi != null ? String(player.recruiting_radius_mi) : '',
    target_levels: player.target_levels ?? [],
    annual_tuition_budget: player.annual_tuition_budget ?? '',
    tuition_importance: player.tuition_importance,
    bio: player.bio ?? '',
    highlight_url: player.highlight_url ?? '',
    // Public profile
    jersey_number: player.jersey_number ?? '',
    hero_image_url: player.hero_image_url ?? '',
    contact_phone: player.contact_phone ?? '',
    contact_twitter: player.contact_twitter ?? '',
    contact_instagram: player.contact_instagram ?? '',
    contact_hudl: player.contact_hudl ?? '',
    contact_tiktok: player.contact_tiktok ?? '',
    contact_youtube: player.contact_youtube ?? '',
    coach_name: player.coach_name ?? '',
    coach_email: player.coach_email ?? '',
    coach_phone: player.coach_phone ?? '',
    class_rank: player.class_rank ?? '',
    intended_major: player.intended_major ?? '',
    academic_honors: (player.academic_honors ?? []).join(', '),
  })

  // JSON array states
  const [stats, setStats] = useState<Record<string, string>>(toStats(player.stats_json))
  const [awards, setAwards] = useState<PlayerAward[]>(toAwards(player.awards_json))
  const [events, setEvents] = useState<PlayerEvent[]>(toEvents(player.upcoming_events_json))
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(toSchedule(player.match_schedule_json))
  const [clips, setClips] = useState<HighlightClip[]>(toClips(player.highlight_clips_json))

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleDivision(div: string) {
    setForm((prev) => {
      const current = prev.target_levels
      const next = current.includes(div) ? current.filter((d) => d !== div) : [...current, div]
      return { ...prev, target_levels: next }
    })
    setSaved(false)
  }

  // Stats helpers
  const statEntries = Object.entries(stats)
  function setStatKey(oldKey: string, newKey: string) {
    setStats((prev) => {
      const val = prev[oldKey]
      const next = { ...prev }
      delete next[oldKey]
      next[newKey] = val
      return next
    })
    setSaved(false)
  }
  function setStatVal(key: string, val: string) {
    setStats((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }
  function addStat() {
    setStats((prev) => ({ ...prev, '': '' }))
    setSaved(false)
  }
  function removeStat(key: string) {
    setStats((prev) => { const n = { ...prev }; delete n[key]; return n })
    setSaved(false)
  }

  // Generic array helpers
  function addAward() {
    setAwards((a) => [...a, { year: '', title: '', body: '', type: 'athletic' }])
    setSaved(false)
  }
  function updateAward(i: number, key: keyof PlayerAward, val: string) {
    setAwards((a) => a.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
    setSaved(false)
  }
  function removeAward(i: number) {
    setAwards((a) => a.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function addEvent() {
    setEvents((e) => [...e, { name: '', type: '', date: '', location: '', description: '', url: '' }])
    setSaved(false)
  }
  function updateEvent(i: number, key: keyof PlayerEvent, val: string) {
    setEvents((e) => e.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
    setSaved(false)
  }
  function removeEvent(i: number) {
    setEvents((e) => e.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function addSchedule() {
    setSchedule((s) => [...s, { date: '', opponent: '', competition: '', location: '', time: '', result: '' }])
    setSaved(false)
  }
  function updateSchedule(i: number, key: keyof ScheduleEntry, val: string) {
    setSchedule((s) => s.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
    setSaved(false)
  }
  function removeSchedule(i: number) {
    setSchedule((s) => s.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function addClip() {
    setClips((c) => [...c, { title: '', url: '', date: '', tags: [], thumb: '' }])
    setSaved(false)
  }
  function updateClip(i: number, key: keyof HighlightClip, val: string | string[]) {
    setClips((c) => c.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
    setSaved(false)
  }
  function removeClip(i: number) {
    setClips((c) => c.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      const heightFt = parseInt(form.height_feet)
      const heightIn = parseInt(form.height_inches_rem)
      const height_inches = !isNaN(heightFt) && !isNaN(heightIn)
        ? heightFt * 12 + heightIn
        : null

      const honors = form.academic_honors
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean)

      // Clean up empty stats keys
      const cleanStats: Record<string, string> = {}
      for (const [k, v] of Object.entries(stats)) {
        if (k.trim()) cleanStats[k.trim()] = v
      }

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        grad_year: parseInt(form.grad_year),
        gender: form.gender,
        primary_position: form.primary_position,
        secondary_position: form.secondary_position.trim() || null,
        height_inches,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        unweighted_gpa: form.unweighted_gpa ? parseFloat(form.unweighted_gpa) : null,
        sat_score: form.sat_score ? parseInt(form.sat_score) : null,
        act_score: form.act_score ? parseInt(form.act_score) : null,
        club_team: form.club_team.trim(),
        highest_club_level: form.highest_club_level,
        high_school: form.high_school.trim() || null,
        home_city: form.home_city.trim(),
        home_state: form.home_state.trim(),
        recruiting_radius_mi: form.recruiting_radius_mi ? parseInt(form.recruiting_radius_mi) : null,
        target_levels: form.target_levels.length > 0 ? form.target_levels : null,
        annual_tuition_budget: form.annual_tuition_budget.trim() || null,
        tuition_importance: form.tuition_importance,
        bio: form.bio.trim() || null,
        highlight_url: form.highlight_url.trim() || null,
        // Public profile
        jersey_number: form.jersey_number.trim() || null,
        hero_image_url: form.hero_image_url.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_twitter: form.contact_twitter.trim() || null,
        contact_instagram: form.contact_instagram.trim() || null,
        contact_hudl: form.contact_hudl.trim() || null,
        contact_tiktok: form.contact_tiktok.trim() || null,
        contact_youtube: form.contact_youtube.trim() || null,
        coach_name: form.coach_name.trim() || null,
        coach_email: form.coach_email.trim() || null,
        coach_phone: form.coach_phone.trim() || null,
        class_rank: form.class_rank.trim() || null,
        intended_major: form.intended_major.trim() || null,
        academic_honors: honors.length > 0 ? honors : null,
        stats_json: Object.keys(cleanStats).length > 0 ? cleanStats : null,
        awards_json: awards.length > 0 ? awards : null,
        upcoming_events_json: events.length > 0 ? events : null,
        match_schedule_json: schedule.length > 0 ? schedule : null,
        highlight_clips_json: clips.length > 0 ? clips : null,
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to save changes')
        return
      }

      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Personal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          </Field>
          <Field label="Last Name">
            <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          </Field>
          <Field label="Grad Year">
            <Input type="number" value={form.grad_year} onChange={(e) => set('grad_year', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Bio" className="sm:col-span-2">
            <Textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3}
              placeholder="A brief description of yourself as a player..."
            />
          </Field>
        </CardContent>
      </Card>

      {/* Athletic */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Athletic Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Primary Position">
            <select
              value={form.primary_position}
              onChange={(e) => set('primary_position', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Secondary Position (optional)">
            <select
              value={form.secondary_position}
              onChange={(e) => set('secondary_position', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">None</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Club Team">
            <Input value={form.club_team} onChange={(e) => set('club_team', e.target.value)} />
          </Field>
          <Field label="Club Level">
            <select
              value={form.highest_club_level}
              onChange={(e) => set('highest_club_level', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {CLUB_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="High School (optional)">
            <Input value={form.high_school} onChange={(e) => set('high_school', e.target.value)} />
          </Field>
          <Field label="Highlight Video URL (optional)">
            <Input
              type="url"
              value={form.highlight_url}
              onChange={(e) => set('highlight_url', e.target.value)}
              placeholder="https://hudl.com/..."
            />
          </Field>
          <Field label="Height — Feet">
            <Input
              type="number"
              min={4} max={7}
              value={form.height_feet}
              onChange={(e) => set('height_feet', e.target.value)}
              placeholder="5"
            />
          </Field>
          <Field label="Height — Inches">
            <Input
              type="number"
              min={0} max={11}
              value={form.height_inches_rem}
              onChange={(e) => set('height_inches_rem', e.target.value)}
              placeholder="10"
            />
          </Field>
          <Field label="Weight (lbs) (optional)">
            <Input
              type="number"
              value={form.weight_lbs}
              onChange={(e) => set('weight_lbs', e.target.value)}
              placeholder="150"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Academics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Academics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Unweighted GPA">
            <Input
              type="number"
              step="0.01" min={0} max={4}
              value={form.unweighted_gpa}
              onChange={(e) => set('unweighted_gpa', e.target.value)}
              placeholder="3.50"
            />
          </Field>
          <Field label="SAT Score (optional)">
            <Input
              type="number"
              min={400} max={1600}
              value={form.sat_score}
              onChange={(e) => set('sat_score', e.target.value)}
              placeholder="1200"
            />
          </Field>
          <Field label="ACT Score (optional)">
            <Input
              type="number"
              min={1} max={36}
              value={form.act_score}
              onChange={(e) => set('act_score', e.target.value)}
              placeholder="26"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Home City">
            <Input value={form.home_city} onChange={(e) => set('home_city', e.target.value)} />
          </Field>
          <Field label="Home State">
            <Input value={form.home_state} onChange={(e) => set('home_state', e.target.value)} placeholder="TX" maxLength={2} />
          </Field>
          <Field label="Search Radius (miles)">
            <Input
              type="number"
              value={form.recruiting_radius_mi}
              onChange={(e) => set('recruiting_radius_mi', e.target.value)}
              placeholder="500"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Recruiting Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recruiting Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs mb-2 block">Target Divisions</Label>
            <div className="flex flex-wrap gap-2">
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  type="button"
                  onClick={() => toggleDivision(div)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    form.target_levels.includes(div)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tuition Importance">
              <select
                value={form.tuition_importance}
                onChange={(e) => set('tuition_importance', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TUITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Annual Tuition Budget (optional)">
              <Input
                value={form.annual_tuition_budget}
                onChange={(e) => set('annual_tuition_budget', e.target.value)}
                placeholder="e.g. Under $30k"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Public Profile ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Identity</CardTitle>
          <CardDescription className="text-xs">Shown on your public recruiting page</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Jersey Number">
            <Input value={form.jersey_number} onChange={(e) => set('jersey_number', e.target.value)} placeholder="#10" />
          </Field>
          <Field label="Hero / Banner Image URL">
            <Input type="url" value={form.hero_image_url} onChange={(e) => set('hero_image_url', e.target.value)} placeholder="https://..." />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="555-555-5555" />
          </Field>
          <Field label="Twitter / X handle">
            <Input value={form.contact_twitter} onChange={(e) => set('contact_twitter', e.target.value)} placeholder="@handle" />
          </Field>
          <Field label="Instagram handle">
            <Input value={form.contact_instagram} onChange={(e) => set('contact_instagram', e.target.value)} placeholder="@handle" />
          </Field>
          <Field label="Hudl URL">
            <Input type="url" value={form.contact_hudl} onChange={(e) => set('contact_hudl', e.target.value)} placeholder="https://hudl.com/..." />
          </Field>
          <Field label="TikTok handle">
            <Input value={form.contact_tiktok} onChange={(e) => set('contact_tiktok', e.target.value)} placeholder="@handle" />
          </Field>
          <Field label="YouTube channel URL">
            <Input type="url" value={form.contact_youtube} onChange={(e) => set('contact_youtube', e.target.value)} placeholder="https://youtube.com/..." />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Coach Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Coach Name">
            <Input value={form.coach_name} onChange={(e) => set('coach_name', e.target.value)} />
          </Field>
          <Field label="Coach Email">
            <Input type="email" value={form.coach_email} onChange={(e) => set('coach_email', e.target.value)} />
          </Field>
          <Field label="Coach Phone">
            <Input value={form.coach_phone} onChange={(e) => set('coach_phone', e.target.value)} placeholder="555-555-5555" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Academics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class Rank (optional)">
            <Input value={form.class_rank} onChange={(e) => set('class_rank', e.target.value)} placeholder="e.g. Top 10%" />
          </Field>
          <Field label="Intended Major (optional)">
            <Input value={form.intended_major} onChange={(e) => set('intended_major', e.target.value)} placeholder="Business" />
          </Field>
          <Field label="Academic Honors (comma-separated)" className="sm:col-span-2">
            <Input
              value={form.academic_honors}
              onChange={(e) => set('academic_honors', e.target.value)}
              placeholder="Honor Roll, AP Scholar, NHS"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Stats</CardTitle>
          <CardDescription className="text-xs">Key stats shown in the header bar (e.g. Goals: 12, Assists: 8)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statEntries.map(([key, val], i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                className="flex-1"
                value={key}
                onChange={(e) => setStatKey(key, e.target.value)}
                placeholder="Stat name"
              />
              <Input
                className="flex-1"
                value={val}
                onChange={(e) => setStatVal(key, e.target.value)}
                placeholder="Value"
              />
              <button type="button" onClick={() => removeStat(key)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {statEntries.length < 8 && (
            <Button type="button" variant="outline" size="sm" onClick={addStat}>
              <Plus className="w-3 h-3 mr-1" /> Add Stat
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Awards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Awards & Honors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {awards.map((a, i) => (
            <div key={i} className="border border-border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Award #{i + 1}</span>
                <button type="button" onClick={() => removeAward(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  <Input value={a.year} onChange={(e) => updateAward(i, 'year', e.target.value)} placeholder="2024" />
                </Field>
                <Field label="Type">
                  <select
                    value={a.type}
                    onChange={(e) => updateAward(i, 'type', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="athletic">Athletic</option>
                    <option value="academic">Academic</option>
                  </select>
                </Field>
              </div>
              <Field label="Title">
                <Input value={a.title} onChange={(e) => updateAward(i, 'title', e.target.value)} placeholder="All-State First Team" />
              </Field>
              <Field label="Description">
                <Textarea value={a.body} onChange={(e) => updateAward(i, 'body', e.target.value)} rows={2} placeholder="Brief description..." />
              </Field>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAward}>
            <Plus className="w-3 h-3 mr-1" /> Add Award
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Upcoming Events</CardTitle>
          <CardDescription className="text-xs">Tournaments, showcases, and camps coaches should attend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.map((ev, i) => (
            <div key={i} className="border border-border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Event #{i + 1}</span>
                <button type="button" onClick={() => removeEvent(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Event Name">
                  <Input value={ev.name} onChange={(e) => updateEvent(i, 'name', e.target.value)} placeholder="Texas Showcase" />
                </Field>
                <Field label="Type">
                  <Input value={ev.type} onChange={(e) => updateEvent(i, 'type', e.target.value)} placeholder="Tournament" />
                </Field>
                <Field label="Date">
                  <Input type="date" value={ev.date} onChange={(e) => updateEvent(i, 'date', e.target.value)} />
                </Field>
                <Field label="Location">
                  <Input value={ev.location} onChange={(e) => updateEvent(i, 'location', e.target.value)} placeholder="Dallas, TX" />
                </Field>
              </div>
              <Field label="Description (optional)">
                <Input value={ev.description} onChange={(e) => updateEvent(i, 'description', e.target.value)} />
              </Field>
              <Field label="URL (optional)">
                <Input type="url" value={ev.url} onChange={(e) => updateEvent(i, 'url', e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addEvent}>
            <Plus className="w-3 h-3 mr-1" /> Add Event
          </Button>
        </CardContent>
      </Card>

      {/* Match Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Match Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((s, i) => (
            <div key={i} className="border border-border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Match #{i + 1}</span>
                <button type="button" onClick={() => removeSchedule(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Date">
                  <Input type="date" value={s.date} onChange={(e) => updateSchedule(i, 'date', e.target.value)} />
                </Field>
                <Field label="Time">
                  <Input value={s.time} onChange={(e) => updateSchedule(i, 'time', e.target.value)} placeholder="3:00 PM" />
                </Field>
                <Field label="Result">
                  <Input value={s.result} onChange={(e) => updateSchedule(i, 'result', e.target.value)} placeholder="W 3-1" />
                </Field>
                <Field label="Opponent">
                  <Input value={s.opponent} onChange={(e) => updateSchedule(i, 'opponent', e.target.value)} placeholder="FC Dallas" />
                </Field>
                <Field label="Competition">
                  <Input value={s.competition} onChange={(e) => updateSchedule(i, 'competition', e.target.value)} placeholder="ECNL Regional" />
                </Field>
                <Field label="Location">
                  <Input value={s.location} onChange={(e) => updateSchedule(i, 'location', e.target.value)} placeholder="Field 4, Frisco" />
                </Field>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
            <Plus className="w-3 h-3 mr-1" /> Add Match
          </Button>
        </CardContent>
      </Card>

      {/* Highlight Clips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Public Profile — Highlight Clips</CardTitle>
          <CardDescription className="text-xs">Individual video clips (YouTube, Hudl, Vimeo)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clips.map((c, i) => (
            <div key={i} className="border border-border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">Clip #{i + 1}</span>
                <button type="button" onClick={() => removeClip(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <Input value={c.title} onChange={(e) => updateClip(i, 'title', e.target.value)} placeholder="Free kick goal vs. FC Dallas" />
                </Field>
                <Field label="Date">
                  <Input type="date" value={c.date} onChange={(e) => updateClip(i, 'date', e.target.value)} />
                </Field>
              </div>
              <Field label="Video URL">
                <Input type="url" value={c.url} onChange={(e) => updateClip(i, 'url', e.target.value)} placeholder="https://youtube.com/..." />
              </Field>
              <Field label="Tags (comma-separated)">
                <Input
                  value={c.tags.join(', ')}
                  onChange={(e) => updateClip(i, 'tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  placeholder="goal, free kick, set piece"
                />
              </Field>
              <Field label="Thumbnail URL (optional — auto-detected for YouTube)">
                <Input type="url" value={c.thumb} onChange={(e) => updateClip(i, 'thumb', e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addClip}>
            <Plus className="w-3 h-3 mr-1" /> Add Clip
          </Button>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
