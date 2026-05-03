import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type OfferRow = Database['public']['Tables']['offers']['Row']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ offers: [] })

    const { data, error: offersErr } = await service
      .from('offers')
      .select('*, school:schools(id, name, verified_division, city, state, in_state_tuition, out_state_tuition)')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (offersErr) console.error('[offers GET] query error:', offersErr.message)
    return NextResponse.json({ offers: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const body: {
      player_school_id?: string
      school_id: string
      tuition_per_year?: number | null
      athletic_scholarship?: number
      merit_aid?: number
      need_based_aid?: number
      other_aid?: number
      offer_date?: string | null
      decision_deadline?: string | null
      notes?: string | null
    } = await request.json()

    if (!body.school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 })
    }

    const { data: offer, error } = await service
      .from('offers')
      .insert({
        player_id: player.id,
        player_school_id: body.player_school_id ?? null,
        school_id: body.school_id,
        tuition_per_year: body.tuition_per_year ?? null,
        athletic_scholarship: body.athletic_scholarship ?? 0,
        merit_aid: body.merit_aid ?? 0,
        need_based_aid: body.need_based_aid ?? 0,
        other_aid: body.other_aid ?? 0,
        offer_date: body.offer_date ?? null,
        decision_deadline: body.decision_deadline ?? null,
        notes: body.notes ?? null,
        status: 'evaluating',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: offer.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
