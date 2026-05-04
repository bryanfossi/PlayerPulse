'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard } from '@/hooks/useWizard'
import { getSportOrDefault } from '@/lib/sports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  primary_position: z.string().min(1, 'Required'),
  secondary_position: z.string().optional(),
  club_team: z.string().min(1, 'Required'),
  highest_club_level: z.string().min(1, 'Required'),
  highlight_url: z.string().optional(),
  height_feet: z
    .string()
    .min(1, 'Required')
    .refine((v) => {
      const n = parseInt(v, 10)
      return !isNaN(n) && n >= 3 && n <= 8
    }, 'Enter 3–8'),
  height_inches: z
    .string()
    .min(1, 'Required')
    .refine((v) => {
      const n = parseInt(v, 10)
      return !isNaN(n) && n >= 0 && n <= 11
    }, 'Enter 0–11'),
})
type FormData = z.infer<typeof schema>

export function StepAthletic() {
  const router = useRouter()
  const { data, update } = useWizard()
  const sport = getSportOrDefault(data.sport_id)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primary_position: data.primary_position,
      secondary_position: data.secondary_position,
      club_team: data.club_team,
      highest_club_level: data.highest_club_level,
      highlight_url: data.highlight_url,
      height_feet: data.height_feet,
      height_inches: data.height_inches,
    },
  })

  function onSubmit(values: FormData) {
    update({
      primary_position: values.primary_position,
      secondary_position: values.secondary_position ?? '',
      club_team: values.club_team,
      highest_club_level: values.highest_club_level,
      highlight_url: values.highlight_url ?? '',
      height_feet: values.height_feet,
      height_inches: values.height_inches,
    })
    router.push('/onboarding/preferences')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="primary_pos">
            Primary Position <span className="text-destructive">*</span>
          </Label>
          <select
            id="primary_pos"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('primary_position')}
          >
            <option value="">Select position</option>
            {sport.positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.primary_position && (
            <p className="text-destructive text-xs">{errors.primary_position.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondary_pos">
            Secondary Position <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <select
            id="secondary_pos"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('secondary_position')}
          >
            <option value="">None</option>
            {sport.positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          Height <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <Input
                id="height_feet"
                type="number"
                min={3}
                max={8}
                placeholder="5"
                {...register('height_feet')}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">ft</span>
            </div>
            {errors.height_feet && (
              <p className="text-destructive text-xs mt-1">{errors.height_feet.message}</p>
            )}
          </div>
          <div>
            <div className="relative">
              <Input
                id="height_inches"
                type="number"
                min={0}
                max={11}
                placeholder="10"
                {...register('height_inches')}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">in</span>
            </div>
            {errors.height_inches && (
              <p className="text-destructive text-xs mt-1">{errors.height_inches.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club_team">
          Club Team <span className="text-destructive">*</span>
        </Label>
        <Input
          id="club_team"
          placeholder={
            sport.id === 'volleyball'
              ? 'Midwest Volleyball Club'
              : sport.id === 'basketball'
              ? 'Team Loaded EYBL'
              : sport.id === 'football'
              ? 'St. Thomas Aquinas HS'
              : 'Ohio Premier SC'
          }
          {...register('club_team')}
        />
        {errors.club_team && (
          <p className="text-destructive text-xs">{errors.club_team.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club_level">
          Highest Club Level <span className="text-destructive">*</span>
        </Label>
        <select
          id="club_level"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register('highest_club_level')}
        >
          <option value="">Select level</option>
          {sport.clubLevels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {errors.highest_club_level && (
          <p className="text-destructive text-xs">{errors.highest_club_level.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="highlight">
          Highlight Video URL <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="highlight"
          type="url"
          placeholder="https://youtube.com/..."
          {...register('highlight_url')}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/onboarding/academic')}
        >
          ← Back
        </Button>
        <Button type="submit" className="flex-1">Continue →</Button>
      </div>
    </form>
  )
}
