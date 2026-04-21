'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard } from '@/hooks/useWizard'
import { POSITIONS, CLUB_LEVELS } from '@/types/wizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  primary_position: z.string().min(1, 'Required'),
  secondary_position: z.string().optional(),
  club_team: z.string().min(1, 'Required'),
  highest_club_level: z.string().min(1, 'Required'),
  highlight_url: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function StepAthletic() {
  const router = useRouter()
  const { data, update } = useWizard()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primary_position: data.primary_position,
      secondary_position: data.secondary_position,
      club_team: data.club_team,
      highest_club_level: data.highest_club_level,
      highlight_url: data.highlight_url,
    },
  })

  function onSubmit(values: FormData) {
    update({
      primary_position: values.primary_position,
      secondary_position: values.secondary_position ?? '',
      club_team: values.club_team,
      highest_club_level: values.highest_club_level,
      highlight_url: values.highlight_url ?? '',
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
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
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
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club_team">
          Club Team <span className="text-destructive">*</span>
        </Label>
        <Input
          id="club_team"
          placeholder="Ohio Premier SC"
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
          {CLUB_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
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
