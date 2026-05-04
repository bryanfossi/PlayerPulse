import { redirect } from 'next/navigation'
import { Settings, Palette } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ParentInviteWidget } from '@/components/dashboard/ParentInviteWidget'
import { ThemeSelector } from '@/components/settings/ThemeSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/types/database'

type InviteRow = Database['public']['Tables']['parent_invites']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: playerRaw } = await service
    .from('players')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id'> | null
  if (!player) redirect('/onboarding')

  const { data: inviteData } = await service
    .from('parent_invites')
    .select('email, token, accepted, expires_at')
    .eq('player_id', player.id)
    .order('created_at', { ascending: false })
  const invites = (inviteData ?? []) as Pick<InviteRow, 'email' | 'token' | 'accepted' | 'expires_at'>[]

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage access and preferences</p>
        </div>
      </div>

      {/* Visual Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            Visual Theme
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Choose how FuseID looks for you. Your preference is saved locally.
          </p>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <ParentInviteWidget existingInvites={invites} />
    </div>
  )
}
