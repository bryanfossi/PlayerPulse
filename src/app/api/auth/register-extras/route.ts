import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * Called from the client immediately after supabase.auth.signUp succeeds.
 * Persists registration extras (currently just DOB for COPPA) to the
 * profile row that handle_new_user() created via the auth trigger.
 *
 * Server-side enforces the COPPA age >= 13 check. The client also enforces
 * it for UX, but never trust the client.
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: { date_of_birth?: string } = await request.json()
    const dob = body.date_of_birth?.trim()

    if (!dob) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 })
    }

    // YYYY-MM-DD only — the <input type="date"> always emits this format.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const dobDate = new Date(dob + 'T00:00:00Z')
    if (Number.isNaN(dobDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    // Age in years, calendar-correct (account for whether birthday has passed)
    const now = new Date()
    let age = now.getUTCFullYear() - dobDate.getUTCFullYear()
    const beforeBirthday =
      now.getUTCMonth() < dobDate.getUTCMonth() ||
      (now.getUTCMonth() === dobDate.getUTCMonth() && now.getUTCDate() < dobDate.getUTCDate())
    if (beforeBirthday) age -= 1

    if (age < 13) {
      // COPPA: we can't store data for under-13s. Delete the auth user we
      // just created so they don't end up with a dangling account.
      const service = createServiceClient()
      try {
        await (service as unknown as {
          auth: { admin: { deleteUser: (id: string) => Promise<unknown> } }
        }).auth.admin.deleteUser(user.id)
      } catch (err) {
        console.error('[register-extras] failed to delete under-13 auth user:', err)
      }
      return NextResponse.json(
        { error: 'You must be at least 13 years old to use FuseID.' },
        { status: 403 },
      )
    }

    const service = createServiceClient()
    const { error } = await (service as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => {
          eq: (k: string, v: string) => Promise<{ error: unknown }>
        }
      }
    })
      .from('profiles')
      .update({ date_of_birth: dob })
      .eq('id', user.id)

    if (error) {
      console.error('[register-extras] profile update failed:', error)
      return NextResponse.json({ error: 'Could not save profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[register-extras] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
