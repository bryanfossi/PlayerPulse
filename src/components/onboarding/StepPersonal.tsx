'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWizard } from '@/hooks/useWizard'
import { activeSports, DEFAULT_SPORT_ID } from '@/lib/sports'
import { US_STATES, GRAD_YEARS } from '@/types/wizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  sport_id: z.string().min(1, 'Required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  gender: z.enum(['Male', 'Female'], { error: 'Required' }),
  grad_year: z.string().min(1, 'Required'),
  home_city: z.string().min(1, 'Required'),
  home_state: z.string().min(2, 'Required'),
})
type FormData = z.infer<typeof schema>

const showSportSelector = activeSports.length > 1

export function StepPersonal() {
  const router = useRouter()
  const { data, update } = useWizard()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sport_id: data.sport_id || DEFAULT_SPORT_ID,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: (data.gender as 'Male' | 'Female') || undefined,
      grad_year: data.grad_year,
      home_city: data.home_city,
      home_state: data.home_state,
    },
  })

  const gender = watch('gender')
  const sport_id = watch('sport_id')

  function onSubmit(values: FormData) {
    update(values)
    router.push('/onboarding/academic')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {showSportSelector && (
        <div className="space-y-1.5">
          <Label>Sport <span className="text-destructive">*</span></Label>
          <div className={`grid gap-3 grid-cols-${Math.min(activeSports.length, 3)}`}>
            {activeSports.map((s) => (
              <label
                key={s.id}
                className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors text-sm font-medium ${
                  sport_id === s.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  value={s.id}
                  className="sr-only"
                  {...register('sport_id')}
                />
                {s.name}
              </label>
            ))}
          </div>
          {errors.sport_id && <p className="text-destructive text-xs">{errors.sport_id.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>First Name <span className="text-destructive">*</span></Label>
          <Input placeholder="Alex" {...register('first_name')} />
          {errors.first_name && <p className="text-destructive text-xs">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Last Name <span className="text-destructive">*</span></Label>
          <Input placeholder="Johnson" {...register('last_name')} />
          {errors.last_name && <p className="text-destructive text-xs">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Gender <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-3">
          {(['Male', 'Female'] as const).map((g) => (
            <label
              key={g}
              className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors text-sm font-medium ${
                gender === g
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                value={g}
                className="sr-only"
                {...register('gender')}
              />
              {g}
            </label>
          ))}
        </div>
        {errors.gender && <p className="text-destructive text-xs">{errors.gender.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="grad_year">Graduation Year <span className="text-destructive">*</span></Label>
        <select
          id="grad_year"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register('grad_year')}
        >
          <option value="">Select year</option>
          {GRAD_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {errors.grad_year && <p className="text-destructive text-xs">{errors.grad_year.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Home City <span className="text-destructive">*</span></Label>
          <Input placeholder="Columbus" {...register('home_city')} />
          {errors.home_city && <p className="text-destructive text-xs">{errors.home_city.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="home_state">State <span className="text-destructive">*</span></Label>
          <select
            id="home_state"
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('home_state')}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.home_state && <p className="text-destructive text-xs">{errors.home_state.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">Continue →</Button>
    </form>
  )
}
