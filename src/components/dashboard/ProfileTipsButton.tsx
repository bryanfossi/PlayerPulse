'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ProfileTipsPanel } from '@/components/ProfileTipsPanel'

export function ProfileTipsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm transition-all hover:brightness-110 active:translate-y-px"
        style={{ backgroundColor: '#4ADE80', color: '#0F1120' }}
      >
        <Sparkles className="w-4 h-4" />
        Generate Actions
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#4ADE80' }} />
              AI-Generated Actions
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
            Personalized recommendations based on your profile. Save any of them to your{' '}
            <a href="/actions" className="underline" style={{ color: '#4ADE80' }}>Actions</a>{' '}
            list to track them.
          </p>
          {open && <ProfileTipsPanel />}
        </SheetContent>
      </Sheet>
    </>
  )
}
