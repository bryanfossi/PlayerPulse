import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, Dumbbell, BookOpen, MapPin, Target,
  ExternalLink, Pencil, AlertCircle,
} from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicProfileToggle } from '@/components/PublicProfileToggle'
import { ProfileTipsSheetWidget } from '@/components/dashboard/ProfileTipsSheetWidget'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

function inchesToFeet(inches: number): string {
  const ft = Math.floor(inches / 12)
  const rem = inches % 12
  return `${ft}'${rem}"`
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw } = await service
    .from('players')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as PlayerRow | null
  if (!player) redirect('/onboarding')

  const fullName = `${player.first_name} ${player.last_name}`
  const position = player.secondary_position
    ? `${player.primary_position} / ${player.secondary_position}`
    : player.primary_position

  // Detect which key fields are missing so we can nudge the user
  const missingFields: string[] = []
  if (!player.highlight_url) missingFields.push('Highlight video')
  if (!player.unweighted_gpa) missingFields.push('GPA')
  if (!player.club_team) missingFields.push('Club team')
  if (!player.home_city || !player.home_state) missingFields.push('Location')
  const profileIncomplete = missingFields.length >= 2

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Profile completion banner */}
      {profileIncomplete && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-400">Complete your profile</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Missing: {missingFields.join(', ')}. A complete profile helps coaches find you and improves your match scores.
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1a0f00] transition-colors"
          >
            Fill in
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C9A227]/15 border border-[#C9A227]/25 flex items-center justify-center text-[#C9A227] font-black text-xl flex-shrink-0">
            {player.first_name[0]}{player.last_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {position} · Class of {player.grad_year}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0" asChild>
          <Link href="/profile/edit">
            <Pencil className="w-3.5 h-3.5" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Bio */}
      {player.bio && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Public profile + AI analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PublicProfileToggle
          slug={player.public_profile_slug}
          enabled={player.public_profile_enabled ?? false}
        />
        <ProfileTipsSheetWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Athletic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Athletic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Position" value={position} />
            <InfoRow label="Club Team" value={player.club_team} />
            <InfoRow label="Club Level" value={player.highest_club_level} />
            <InfoRow label="High School" value={player.high_school} />
            {player.height_inches != null && (
              <InfoRow label="Height" value={inchesToFeet(player.height_inches)} />
            )}
            {player.weight_lbs != null && (
              <InfoRow label="Weight" value={`${player.weight_lbs} lbs`} />
            )}
            {player.highlight_url && (
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-xs text-muted-foreground w-36 flex-shrink-0">Highlight Video</span>
                <a
                  href={player.highlight_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
                >
                  Watch <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Academics
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Grad Year" value={String(player.grad_year)} />
            <InfoRow label="Gender" value={player.gender} />
            {player.unweighted_gpa != null && (
              <InfoRow label="Unweighted GPA" value={player.unweighted_gpa.toFixed(2)} />
            )}
            {player.sat_score != null && (
              <InfoRow label="SAT Score" value={String(player.sat_score)} />
            )}
            {player.act_score != null && (
              <InfoRow label="ACT Score" value={String(player.act_score)} />
            )}
          </CardContent>
        </Card>

        {/* Location & Search Criteria */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Home City" value={player.home_city} />
            <InfoRow label="Home State" value={player.home_state} />
            {player.recruiting_radius_mi != null && (
              <InfoRow label="Search Radius" value={`${player.recruiting_radius_mi} miles`} />
            )}
          </CardContent>
        </Card>

        {/* Recruiting Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Recruiting Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {player.target_levels && player.target_levels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Target Divisions</p>
                <div className="flex flex-wrap gap-1.5">
                  {player.target_levels.map((level) => (
                    <Badge key={level} variant="secondary" className="text-xs">{level}</Badge>
                  ))}
                </div>
              </div>
            )}
            <InfoRow label="Tuition Priority" value={player.tuition_importance} />
            <InfoRow label="Annual Budget" value={player.annual_tuition_budget} />
          </CardContent>
        </Card>
      </div>

      {/* Forced Schools */}
      {player.forced_schools && player.forced_schools.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Must-Include Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {player.forced_schools.map((school) => (
                <Badge key={school} variant="outline">{school}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
