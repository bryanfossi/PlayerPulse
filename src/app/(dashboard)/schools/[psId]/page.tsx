import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreBreakdown } from '@/components/schools/ScoreBreakdown'
import { SchoolDetailActions } from '@/components/schools/SchoolDetailActions'
import { CoachReplyAnalyzerButton } from '@/components/schools/CoachReplyAnalyzer'
import { FitAssessmentButton } from '@/components/schools/FitAssessmentButton'
import type { PlayerSchool, School } from '@/types/app'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

function fmt(n: number | null | undefined, prefix = '') {
  if (n == null) return '–'
  return `${prefix}${n.toLocaleString()}`
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ psId: string }>
}) {
  const { psId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Get player_id + sport for this user
  const { data: playerRaw } = await service
    .from('players')
    .select('id, sport_id')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id'> & { sport_id?: string } | null
  if (!player) redirect('/onboarding')

  // Fetch the player_school + school
  const { data: raw } = await service
    .from('player_schools')
    .select(`
      id, player_id, school_id, rank_order, tier, status,
      overall_score, geo_score, acad_score, level_score, need_score,
      pt_score, tuition_score, merit_value_score,
      player_level_band, roster_level_band, roster_depth,
      first_year_opportunity, merit_aid_potential, estimated_merit_aid,
      merit_aid_confidence, merit_aid_note, distance_miles,
      acad_note, level_note, pt_note, notes, momentum, momentum_updated_at, added_at, updated_at, source,
      school:schools (
        id, name, verified_division, conference, city, state, campus_type,
        enrollment, avg_gpa, acceptance_rate, in_state_tuition, out_state_tuition,
        has_scholarship, soccer_url, sport_urls, logo_url, usc_top25_seasons, prestige,
        created_at, updated_at
      )
    `)
    .eq('id', psId)
    .eq('player_id', player.id)
    .maybeSingle()

  if (!raw) notFound()

  const ps = raw as unknown as PlayerSchool & { school: School }
  const s = ps.school

  const TIER_STYLES = {
    Lock: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-[#4ADE80]/15 dark:text-[#4ADE80] dark:border-[#4ADE80]/30',
    Realistic: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    Reach: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/schools"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-green-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Schools
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{s.name}</h1>
            {s.verified_division && (
              <Badge variant="outline" className="font-semibold">{s.verified_division}</Badge>
            )}
            {ps.tier && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${TIER_STYLES[ps.tier]}`}>
                {ps.tier}
              </span>
            )}
          </div>
          {(s.city || s.state) && (
            <p className="text-muted-foreground text-sm mt-1.5">
              {[s.city, s.state].filter(Boolean).join(', ')}
              {s.conference && ` · ${s.conference}`}
              {ps.distance_miles != null && ` · ${ps.distance_miles} mi away`}
            </p>
          )}
        </div>

        {/* Overall score */}
        {ps.overall_score != null && (
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/25 flex-shrink-0">
            <span className="text-3xl font-black text-[#4ADE80] leading-none">{ps.overall_score}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <FitAssessmentButton
          schoolId={s.id}
          schoolName={s.name}
          hasExistingScores={ps.overall_score != null}
        />
        <CoachReplyAnalyzerButton psId={psId} schoolName={s.name} />
        <a
          href={`/ai/draft?ps=${psId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:border-green-500/30 hover:text-green-400 transition-colors"
        >
          Draft Email
        </a>
        <a
          href={`/communications?ps=${psId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:border-green-500/30 hover:text-green-400 transition-colors"
        >
          Log Contact
        </a>
      </div>

      {/* Status + Actions (client component for interactivity) */}
      <SchoolDetailActions
        psId={psId}
        currentStatus={ps.status}
        currentTier={ps.tier}
        currentNotes={ps.notes}
        currentMomentum={ps.momentum}
      />

      {/* School Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">School Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Campus Type</p>
              <p className="font-medium">{s.campus_type ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enrollment</p>
              <p className="font-medium">{fmt(s.enrollment)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg GPA</p>
              <p className="font-medium">{s.avg_gpa ?? '–'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Acceptance Rate</p>
              <p className="font-medium">
                {s.acceptance_rate != null ? `${Math.round(s.acceptance_rate * 100)}%` : '–'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In-State Tuition</p>
              <p className="font-medium">{fmt(s.in_state_tuition, '$')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out-of-State Tuition</p>
              <p className="font-medium">{fmt(s.out_state_tuition, '$')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scholarship Available</p>
              <p className="font-medium">{s.has_scholarship ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prestige</p>
              <p className="font-medium">{s.prestige ?? '–'}</p>
            </div>
            {s.usc_top25_seasons > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">USC Top-25 Seasons</p>
                <p className="font-medium">{s.usc_top25_seasons}</p>
              </div>
            )}
          </div>

          {(() => {
            const sportId = player.sport_id ?? 'soccer'
            const programUrl =
              (s.sport_urls as Record<string, string | null> | null)?.[sportId] ??
              s.soccer_url ??
              null
            return programUrl ? (
              <a
                href={programUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline"
              >
                Program Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null
          })()}
        </CardContent>
      </Card>

      {/* Match Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Match Analysis</CardTitle>
        </CardHeader>
        <CardContent className={ps.overall_score == null ? 'py-8' : 'p-0'}>
          {ps.overall_score == null ? (
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <p className="text-sm text-muted-foreground max-w-md">
                No fit assessment yet for this school. Generate a personalized AI report — overall fit score, tier, playing-time outlook, and merit aid potential — based on your profile.
              </p>
              <FitAssessmentButton
                schoolId={s.id}
                schoolName={s.name}
                hasExistingScores={false}
              />
            </div>
          ) : (
            <ScoreBreakdown ps={ps} defaultOpen />
          )}
        </CardContent>
      </Card>

      {/* Rank */}
      <div className="text-xs text-muted-foreground">
        Match Engine rank #{ps.rank_order} · Source: {ps.source}
      </div>
    </div>
  )
}
