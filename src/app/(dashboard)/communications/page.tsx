import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CommunicationsClient } from '@/components/communications/CommunicationsClient'
import type { ContactEntry } from '@/components/communications/ContactCard'
import type { SchoolOption } from '@/components/communications/ContactFormDialog'
import type { Database } from '@/types/database'
import type { ContactType } from '@/types/app'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PSRow = Database['public']['Tables']['player_schools']['Row']
type SchoolRow = Database['public']['Tables']['schools']['Row']
type ContactRow = Database['public']['Tables']['contacts']['Row']

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ps?: string }>
}) {
  const { ps: preselectedPsId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: playerRaw } = await service
    .from('players')
    .select('id, first_name')
    .eq('user_id', user.id)
    .maybeSingle()
  const player = playerRaw as Pick<PlayerRow, 'id' | 'first_name'> | null
  if (!player) redirect('/onboarding')

  // Fetch all contacts with school info, sorted newest first
  const { data: contactsRaw } = await service
    .from('contacts')
    .select(`
      id, contact_type, direction, contact_date, subject,
      notes, email_body, coach_name, coach_email, follow_up_date, created_at,
      school:schools(id, name, verified_division)
    `)
    .eq('player_id', player.id)
    .order('contact_date', { ascending: false })
    .order('created_at', { ascending: false })

  type ContactWithSchool = Omit<ContactRow, 'player_id' | 'school_id'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division'>
  }

  const contacts: ContactEntry[] = ((contactsRaw ?? []) as unknown as ContactWithSchool[]).map((c) => ({
    id: c.id,
    contact_type: c.contact_type as ContactType,
    direction: c.direction as 'outbound' | 'inbound',
    contact_date: c.contact_date,
    subject: c.subject,
    notes: c.notes,
    email_body: c.email_body,
    coach_name: c.coach_name,
    coach_email: c.coach_email,
    follow_up_date: c.follow_up_date,
    created_at: c.created_at,
    school: c.school,
  }))

  // Fetch player's schools for the contact form + draft-email modal.
  // Includes city/state/tier/status so the embedded DraftEmailClient has
  // the same data as the dedicated /ai/draft page.
  const { data: psRaw } = await service
    .from('player_schools')
    .select('id, tier, status, school:schools(id, name, verified_division, city, state)')
    .eq('player_id', player.id)
    .neq('status', 'declined')
    .order('rank_order', { ascending: true })

  type PSWithSchool = Pick<PSRow, 'id' | 'tier' | 'status'> & {
    school: Pick<SchoolRow, 'id' | 'name' | 'verified_division' | 'city' | 'state'>
  }

  const schools: SchoolOption[] = ((psRaw ?? []) as unknown as PSWithSchool[]).map((ps) => ({
    player_school_id: ps.id,
    school_id: ps.school.id,
    school_name: ps.school.name,
    verified_division: ps.school.verified_division,
    city: ps.school.city,
    state: ps.school.state,
    tier: ps.tier,
    status: ps.status,
  }))

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-green-400">Coach</span> Communications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track every interaction with coaching staffs
        </p>
      </div>

      <CommunicationsClient
        initialContacts={contacts}
        schools={schools}
        preselectedPsId={preselectedPsId}
      />
    </div>
  )
}
