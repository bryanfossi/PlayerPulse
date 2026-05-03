import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type PlayerRow = Database['public']['Tables']['players']['Row']

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    const { data: playerRaw } = await service
      .from('players')
      .select('id, first_name, last_name, grad_year, public_profile_slug')
      .eq('user_id', user.id)
      .maybeSingle()
    const player = playerRaw as Pick<PlayerRow,
      'id' | 'first_name' | 'last_name' | 'grad_year' | 'public_profile_slug'
    > | null
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    // Return existing slug if already generated
    if (player.public_profile_slug) {
      await service
        .from('players')
        .update({ public_profile_enabled: true, updated_at: new Date().toISOString() })
        .eq('id', player.id)
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/player/${player.public_profile_slug}`
      return NextResponse.json({ slug: player.public_profile_slug, url })
    }

    // Generate base slug, then attempt to write it atomically.
    // Retry with a numeric suffix on unique constraint violation (23505) so concurrent
    // requests for players with the same name/year can't produce duplicate slugs.
    const base = toSlug(`${player.first_name}-${player.last_name}-${player.grad_year}`)

    let slug = base
    let suffix = 2
    let finalSlug: string | null = null

    while (!finalSlug && suffix <= 30) {
      const { error } = await service
        .from('players')
        .update({
          public_profile_slug: slug,
          public_profile_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', player.id)

      if (!error) {
        finalSlug = slug
      } else if (error.code === '23505') {
        // Unique constraint violation — another player owns this slug
        slug = `${base}-${suffix}`
        suffix++
      } else {
        console.error('[generate-slug] update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    if (!finalSlug) {
      return NextResponse.json({ error: 'Could not generate a unique profile URL' }, { status: 500 })
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/player/${finalSlug}`
    return NextResponse.json({ slug: finalSlug, url })
  } catch (err) {
    console.error('[generate-slug] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
