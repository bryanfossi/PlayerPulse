import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PSRow = Database['public']['Tables']['player_schools']['Row']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: {
      school_id?: string
      school_name?: string
      tier?: 'Lock' | 'Realistic' | 'Reach' | null
    } = await request.json()

    if (!body.school_id && !body.school_name) {
      return NextResponse.json({ error: 'school_id or school_name required' }, { status: 400 })
    }

    const service = createServiceClient()

    // Derive player_id from authenticated user — never trust client-supplied player_id
    const { data: player } = await service
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    let schoolId = body.school_id

    // If no school_id, upsert by name
    if (!schoolId && body.school_name) {
      const { data: school, error: schoolErr } = await service
        .from('schools')
        .upsert({ name: body.school_name.trim(), updated_at: new Date().toISOString() }, { onConflict: 'name', ignoreDuplicates: false })
        .select('id')
        .single()
      if (schoolErr || !school) {
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
      }
      schoolId = school.id
    }

    // Check for duplicate
    const { data: existing } = await service
      .from('player_schools')
      .select('id')
      .eq('player_id', player.id)
      .eq('school_id', schoolId!)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'School already on your list' }, { status: 409 })
    }

    // Get next rank_order
    const { data: maxRow } = await service
      .from('player_schools')
      .select('rank_order')
      .eq('player_id', player.id)
      .order('rank_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextRank = ((maxRow as Pick<PSRow, 'rank_order'> | null)?.rank_order ?? 0) + 1

    const { data: ps, error } = await service
      .from('player_schools')
      .insert({
        player_id: player.id,
        school_id: schoolId!,
        rank_order: nextRank,
        tier: body.tier ?? null,
        status: 'researching',
        source: 'manual',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: ps.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
