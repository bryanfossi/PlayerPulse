import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { StepPersonal } from '@/components/onboarding/StepPersonal'

export default function OnboardingStep1() {
  return (
    <>
      <WizardProgress />
      <h1 className="text-xl font-bold mb-1">Tell us about yourself</h1>
      <p className="text-muted-foreground text-sm mb-6">Basic info to get started</p>
      <StepPersonal />
    </>
  )
}
