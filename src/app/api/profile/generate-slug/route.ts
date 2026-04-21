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

    // Generate base slug
    const base = toSlug(`${player.first_name}-${player.last_name}-${player.grad_year}`)

    // Check uniqueness and append suffix if needed
    let slug = base
    let suffix = 2
    while (true) {
      const { data: existing } = await service
        .from('players')
        .select('id')
        .eq('public_profile_slug', slug)
        .maybeSingle()

      if (!existing) break
      slug = `${base}-${suffix}`
      suffix++
    }

    await service
      .from('players')
      .update({
        public_profile_slug: slug,
        public_profile_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', player.id)

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/player/${slug}`
    return NextResponse.json({ slug, url })
  } catch (err) {
    console.error('[generate-slug] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
