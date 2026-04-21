import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { StepForcedSchools } from '@/components/onboarding/StepForcedSchools'

export default function OnboardingStep5() {
  return (
    <>
      <WizardProgress />
      <h1 className="text-xl font-bold mb-1">Must-Include Schools</h1>
      <p className="text-muted-foreground text-sm mb-6">Any programs you want guaranteed in your list?</p>
      <StepForcedSchools />
    </>
  )
}
