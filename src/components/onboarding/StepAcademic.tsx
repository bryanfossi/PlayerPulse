'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard } from '@/hooks/useWizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  unweighted_gpa: z
    .string()
    .min(1, 'GPA is required')
    .refine((v) => {
      const n = parseFloat(v)
      return !isNaN(n) && n >= 0 && n <= 4.0
    }, 'Enter a GPA between 0.00 and 4.00'),
  sat_score: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v === '') return true
      const n = parseInt(v)
      return !isNaN(n) && n >= 400 && n <= 1600
    }, 'SAT must be between 400–1600'),
  act_score: z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v === '') return true
      const n = parseInt(v)
      return !isNaN(n) && n >= 1 && n <= 36
    }, 'ACT must be between 1–36'),
  high_school: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function StepAcademic() {
  const router = useRouter()
  const { data, update } = useWizard()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      unweighted_gpa: data.unweighted_gpa,
      sat_score: data.sat_score,
      act_score: data.act_score,
      high_school: data.high_school,
    },
  })

  function onSubmit(values: FormData) {
    update({
      unweighted_gpa: values.unweighted_gpa,
      sat_score: values.sat_score ?? '',
      act_score: values.act_score ?? '',
      high_school: values.high_school ?? '',
    })
    router.push('/onboarding/athletic')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="gpa">
          Unweighted GPA <span className="text-destructive">*</span>
        </Label>
        <Input
          id="gpa"
          placeholder="3.50"
          inputMode="decimal"
          {...register('unweighted_gpa')}
        />
        <p className="text-muted-foreground text-xs">Unweighted scale (0.00–4.00)</p>
        {errors.unweighted_gpa && (
          <p className="text-destructive text-xs">{errors.unweighted_gpa.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sat">SAT Score <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="sat"
            placeholder="1200"
            inputMode="numeric"
            {...register('sat_score')}
          />
          <p className="text-muted-foreground text-xs">400–1600</p>
          {errors.sat_score && (
            <p className="text-destructive text-xs">{errors.sat_score.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="act">ACT Score <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="act"
            placeholder="26"
            inputMode="numeric"
            {...register('act_score')}
          />
          <p className="text-muted-foreground text-xs">1–36</p>
          {errors.act_score && (
            <p className="text-destructive text-xs">{errors.act_score.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hs">
          High School <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="hs"
          placeholder="Lincoln High School"
          {...register('high_school')}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/onboarding')}
        >
          ← Back
        </Button>
        <Button type="submit" className="flex-1">Continue →</Button>
      </div>
    </form>
  )
}
