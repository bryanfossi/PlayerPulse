import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'

const ALLOWED_STATUSES = ['new', 'read', 'responded', 'archived'] as const
type FeedbackStatus = (typeof ALLOWED_STATUSES)[number]

function isFeedbackStatus(v: unknown): v is FeedbackStatus {
  return typeof v === 'string' && (ALLOWED_STATUSES as readonly string[]).includes(v)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body: { status?: string } = await request.json()
    if (!isFeedbackStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service
      .from('feedback')
      .update({ status: body.status })
      .eq('id', id)

    if (error) {
      console.error('[admin/feedback PATCH] update failed:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/feedback PATCH] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
