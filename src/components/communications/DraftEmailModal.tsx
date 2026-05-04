'use client'

import { Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DraftEmailClient, type SchoolOption as DraftSchoolOption } from '@/components/ai/DraftEmailClient'
import type { SchoolOption } from './ContactFormDialog'

interface Props {
  open: boolean
  onClose: () => void
  schools: SchoolOption[]
  defaultPsId?: string
}

export function DraftEmailModal({ open, onClose, schools, defaultPsId }: Props) {
  // The richer SchoolOption from the communications page is a structural
  // superset of DraftEmailClient's, so we can pass it through as-is.
  const draftSchools: DraftSchoolOption[] = schools.map((s) => ({
    player_school_id: s.player_school_id,
    school_name: s.school_name,
    verified_division: s.verified_division,
    city: s.city,
    state: s.state,
    tier: s.tier,
    status: s.status,
  }))

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: '#4ADE80' }} />
            Draft Email
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <DraftEmailClient schools={draftSchools} preselectedPsId={defaultPsId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
