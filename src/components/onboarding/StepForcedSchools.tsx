'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useWizard } from '@/hooks/useWizard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function StepForcedSchools() {
  const router = useRouter()
  const { data, update } = useWizard()

  const { register, handleSubmit } = useForm({
    defaultValues: { forced_schools: data.forced_schools },
  })

  function onSubmit({ forced_schools }: { forced_schools: string }) {
    update({ forced_schools })
    router.push('/onboarding/generating')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="forced_schools">
          Must-Include Schools{' '}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <p className="text-muted-foreground text-sm">
          List any schools you want guaranteed in your Top 40, separated by commas.
          The Match Engine will include them and score them normally.
        </p>
        <Textarea
          id="forced_schools"
          placeholder="University of Michigan, Ohio State, Penn State"
          rows={4}
          {...register('forced_schools')}
        />
        <p className="text-muted-foreground text-xs">
          Leave blank to let the Match Engine choose all 40 schools for you.
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
        <p className="font-semibold">Ready to generate your Top 40?</p>
        <p className="text-muted-foreground">
          The Match Engine will analyze 1,000+ programs across {data.target_levels.join(', ')} and rank the
          40 best fits for you. This takes about 30–45 seconds.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/onboarding/preferences')}
        >
          ← Back
        </Button>
        <Button type="submit" className="flex-1 bg-primary">
          Generate My Top 40 →
        </Button>
      </div>
    </form>
  )
}
