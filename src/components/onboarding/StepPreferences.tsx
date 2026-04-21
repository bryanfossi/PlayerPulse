'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard } from '@/hooks/useWizard'
import { TARGET_LEVEL_OPTIONS, TUITION_OPTIONS, BUDGET_OPTIONS } from '@/types/wizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const schema = z.object({
  target_levels: z.array(z.string()).min(1, 'Select at least one division'),
  recruiting_radius_mi: z.string().optional(),
  tuition_importance: z.string().min(1, 'Required'),
  annual_tuition_budget: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function StepPreferences() {
  const router = useRouter()
  const { data, update } = useWizard()

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_levels: data.target_levels.length ? data.target_levels : ['D1', 'D2', 'D3'],
      recruiting_radius_mi: data.recruiting_radius_mi,
      tuition_importance: data.tuition_importance || 'Not a factor',
      annual_tuition_budget: data.annual_tuition_budget,
    },
  })

  const tuitionImportance = watch('tuition_importance')
  const showBudget = tuitionImportance !== 'Not a factor'

  function onSubmit(values: FormData) {
    update({
      target_levels: values.target_levels,
      recruiting_radius_mi: values.recruiting_radius_mi ?? '',
      tuition_importance: values.tuition_importance,
      annual_tuition_budget: showBudget ? (values.annual_tuition_budget ?? '') : '',
    })
    router.push('/onboarding/schools')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Target divisions */}
      <div className="space-y-2">
        <Label>
          Target Divisions <span className="text-destructive">*</span>
        </Label>
        <p className="text-muted-foreground text-xs">Select all you want considered</p>
        <Controller
          control={control}
          name="target_levels"
          render={({ field }) => (
            <div className="grid grid-cols-5 gap-2">
              {TARGET_LEVEL_OPTIONS.map((level) => {
                const selected = field.value.includes(level)
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      field.onChange(
                        selected
                          ? field.value.filter((v) => v !== level)
                          : [...field.value, level]
                      )
                    }}
                    className={cn(
                      'p-2.5 rounded-md border text-sm font-semibold transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {level}
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.target_levels && (
          <p className="text-destructive text-xs">{errors.target_levels.message}</p>
        )}
      </div>

      {/* Recruiting radius */}
      <div className="space-y-1.5">
        <Label htmlFor="radius">
          Recruiting Radius <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="radius"
            inputMode="numeric"
            placeholder="500"
            className="w-32"
            {...register('recruiting_radius_mi')}
          />
          <span className="text-sm text-muted-foreground">miles from {data.home_city || 'home'}</span>
        </div>
        <p className="text-muted-foreground text-xs">Leave blank to consider schools nationwide</p>
      </div>

      {/* Tuition importance */}
      <div className="space-y-2">
        <Label htmlFor="tuition_importance">
          How important is tuition cost? <span className="text-destructive">*</span>
        </Label>
        <select
          id="tuition_importance"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register('tuition_importance')}
        >
          {TUITION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Budget — only shown when tuition matters */}
      {showBudget && (
        <div className="space-y-1.5">
          <Label htmlFor="budget">Annual Tuition Budget (tuition only)</Label>
          <select
            id="budget"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('annual_tuition_budget')}
          >
            <option value="">Select range</option>
            {BUDGET_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/onboarding/athletic')}
        >
          ← Back
        </Button>
        <Button type="submit" className="flex-1">Continue →</Button>
      </div>
    </form>
  )
}
