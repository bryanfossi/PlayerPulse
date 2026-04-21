import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { StepAcademic } from '@/components/onboarding/StepAcademic'

export default function OnboardingStep2() {
  return (
    <>
      <WizardProgress />
      <h1 className="text-xl font-bold mb-1">Academic Profile</h1>
      <p className="text-muted-foreground text-sm mb-6">Used to match you with schools where you'll be accepted</p>
      <StepAcademic />
    </>
  )
}
