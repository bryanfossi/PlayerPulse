import { createServiceClient } from '@/lib/supabase/server'
import { InviteAcceptClient } from '@/components/invite/InviteAcceptClient'
import type { Database } from '@/types/database'

type InviteRow = Database['public']['Tables']['parent_invites']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return <ErrorPage message="No invite token provided. Check that you copied the full link." />
  }

  const service = createServiceClient()
  const { data: inviteRaw } = await service
    .from('parent_invites')
    .select('id, email, accepted, expires_at, player_id')
    .eq('token', token)
    .maybeSingle()

  const invite = inviteRaw as Pick<InviteRow, 'id' | 'email' | 'accepted' | 'expires_at' | 'player_id'> | null

  if (!invite) {
    return <ErrorPage message="This invite link is invalid or has already been used." />
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <ErrorPage message="This invite link has expired. Ask the player to send a new invite." />
  }

  if (invite.accepted) {
    return (
      <Layout>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Already Accepted</h1>
          <p className="text-sm text-muted-foreground">This invite has already been accepted.</p>
        </div>
      </Layout>
    )
  }

  // Fetch player name
  const { data: playerRaw } = await service
    .from('players')
    .select('first_name, last_name')
    .eq('id', invite.player_id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'first_name' | 'last_name'> | null
  const playerName = player ? `${player.first_name} ${player.last_name}` : 'a player'

  return (
    <Layout>
      <InviteAcceptClient
        token={token}
        inviteEmail={invite.email}
        playerName={playerName}
      />
    </Layout>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050e1c] via-[#0c1e38] to-[#1A3A5C] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0d1e35] rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-[#C9A227] rounded-lg flex items-center justify-center">
            <span className="text-[#1A3A5C] font-black text-xs">PP</span>
          </div>
          <span className="font-bold text-sm">PlayerPulse</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <Layout>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Invalid Invite</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Layout>
  )
}
