import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { StepPreferences } from '@/components/onboarding/StepPreferences'

export default function OnboardingStep4() {
  return (
    <>
      <WizardProgress />
      <h1 className="text-xl font-bold mb-1">Recruiting Preferences</h1>
      <p className="text-muted-foreground text-sm mb-6">Filter your results to programs that match your goals</p>
      <StepPreferences />
    </>
  )
}
