import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { StepAthletic } from '@/components/onboarding/StepAthletic'

export default function OnboardingStep3() {
  return (
    <>
      <WizardProgress />
      <h1 className="text-xl font-bold mb-1">Athletic Background</h1>
      <p className="text-muted-foreground text-sm mb-6">Your soccer credentials for the Match Engine</p>
      <StepAthletic />
    </>
  )
}
