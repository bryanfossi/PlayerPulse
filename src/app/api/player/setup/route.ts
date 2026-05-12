import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { WizardData } from '@/types/wizard'

function validationError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: WizardData = await request.json()

    // Required string fields
    if (!body.first_name?.trim()) return validationError('First name is required')
    if (!body.last_name?.trim()) return validationError('Last name is required')
    if (!body.home_city?.trim()) return validationError('Home city is required')
    if (!body.home_state) return validationError('Home state is required')
    if (!body.primary_position) return validationError('Primary position is required')
    if (!body.club_team?.trim()) return validationError('Club team is required')
    if (!body.highest_club_level) return validationError('Club level is required')
    if (!body.gender) return validationError('Gender is required')

    // Grad year
    const currentYear = new Date().getFullYear()
    const gradYear = parseInt(body.grad_year)
    if (isNaN(gradYear) || gradYear < currentYear || gradYear > currentYear + 8) {
      return validationError(`Graduation year must be between ${currentYear} and ${currentYear + 8}`)
    }

    // GPA
    const gpa = body.unweighted_gpa ? parseFloat(body.unweighted_gpa) : null
    if (gpa !== null && (isNaN(gpa) || gpa < 0 || gpa > 4.0)) {
      return validationError('Unweighted GPA must be between 0.0 and 4.0')
    }

    // SAT
    const sat = body.sat_score ? parseInt(body.sat_score) : null
    if (sat !== null && (isNaN(sat) || sat < 400 || sat > 1600)) {
      return validationError('SAT score must be between 400 and 1600')
    }

    // ACT
    const act = body.act_score ? parseInt(body.act_score) : null
    if (act !== null && (isNaN(act) || act < 1 || act > 36)) {
      return validationError('ACT score must be between 1 and 36')
    }

    // Recruiting radius
    const radius = body.recruiting_radius_mi ? parseInt(body.recruiting_radius_mi) : null
    if (radius !== null && (isNaN(radius) || radius < 0 || radius > 3000)) {
      return validationError('Recruiting radius must be between 0 and 3000 miles')
    }

    // Height — combine feet + inches into total inches
    const heightFt = body.height_feet ? parseInt(body.height_feet) : null
    const heightIn = body.height_inches ? parseInt(body.height_inches) : null
    let totalHeightInches: number | null = null
    if (heightFt !== null && heightIn !== null) {
      if (isNaN(heightFt) || heightFt < 3 || heightFt > 8) {
        return validationError('Height (feet) must be between 3 and 8')
      }
      if (isNaN(heightIn) || heightIn < 0 || heightIn > 11) {
        return validationError('Height (inches) must be between 0 and 11')
      }
      totalHeightInches = heightFt * 12 + heightIn
    } else if (heightFt !== null || heightIn !== null) {
      return validationError('Both height feet and inches are required')
    }

    // Weight — required for football, optional for other sports
    const sportId = body.sport_id || 'soccer'
    const weightLbs = body.weight_lbs ? parseInt(body.weight_lbs) : null
    if (weightLbs !== null && (isNaN(weightLbs) || weightLbs < 50 || weightLbs > 450)) {
      return validationError('Weight must be between 50 and 450 lbs')
    }
    if (sportId === 'football' && weightLbs === null) {
      return validationError('Weight is required for football')
    }

    const forcedSchools = body.forced_schools
      ? body.forced_schools.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const service = createServiceClient()

    // Check if the user already paid (subscription was activated on profiles
    // before the player record existed — that's the normal flow, since the
    // paywall comes before the wizard). If so, we need to grant the monthly
    // allowance NOW since the activate_subscription webhook would have
    // silently no-op'd on the (then-missing) player row.
    const { data: profileRow } = await service
      .from('profiles')
      .select('subscription_active, subscription_id, subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    const hasActiveSub = (profileRow as { subscription_active?: boolean } | null)?.subscription_active === true
    const profileSubId = (profileRow as { subscription_id?: string | null } | null)?.subscription_id ?? null
    const profileSubStatus = (profileRow as { subscription_status?: string | null } | null)?.subscription_status ?? null

    // Upsert the player record — match on user_id
    const { data: player, error } = await service
      .from('players')
      .upsert(
        {
          user_id: user.id,
          sport_id: sportId,
          first_name: body.first_name.trim(),
          last_name: body.last_name.trim(),
          gender: body.gender as 'Male' | 'Female',
          grad_year: parseInt(body.grad_year),
          home_city: body.home_city.trim(),
          home_state: body.home_state,
          unweighted_gpa: gpa,
          sat_score: sat,
          act_score: act,
          high_school: body.high_school || null,
          primary_position: body.primary_position,
          secondary_position: body.secondary_position || null,
          club_team: body.club_team.trim(),
          highest_club_level: body.highest_club_level,
          highlight_url: body.highlight_url || null,
          height_inches: totalHeightInches,
          weight_lbs: weightLbs,
          target_levels: body.target_levels,
          recruiting_radius_mi: radius,
          tuition_importance: body.tuition_importance,
          annual_tuition_budget: body.annual_tuition_budget || null,
          forced_schools: forcedSchools.length ? forcedSchools : null,
          onboarding_complete: false, // set to true after match engine succeeds
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[player/setup] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If the user has an active subscription on profiles but the player record
    // is new (or has 0 allowance tokens), sync subscription state + grant the
    // 30 monthly allowance tokens. This closes the timing gap between
    // Stripe webhook firing (before player exists) and the wizard finishing.
    if (hasActiveSub) {
      const { data: postUpsertPlayer } = await service
        .from('players')
        .select('allowance_tokens, subscription_active')
        .eq('id', player.id)
        .maybeSingle()
      const currentAllowance = (postUpsertPlayer as { allowance_tokens?: number } | null)?.allowance_tokens ?? 0
      const currentSubActive = (postUpsertPlayer as { subscription_active?: boolean } | null)?.subscription_active === true

      // Only grant if not already granted. Prevents re-granting on re-runs of setup.
      if (!currentSubActive || currentAllowance === 0) {
        const { error: syncErr } = await service
          .from('players')
          .update({
            subscription_active: true,
            subscription_id: profileSubId,
            subscription_status: profileSubStatus ?? 'active',
            allowance_tokens: 30,
            rerun_tokens_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', player.id)
        if (syncErr) {
          console.error('[player/setup] subscription sync failed (non-fatal):', syncErr)
        }
      }
    }

    return NextResponse.json({ player_id: player.id })
  } catch (err) {
    console.error('[player/setup] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
