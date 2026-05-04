'use client'

import { useState } from 'react'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { ProfileTipsPanel } from '@/components/ProfileTipsPanel'

export function ProfileTipsSheetWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Profile Analysis</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Get personalized tips on how to improve your recruiting profile.
        </p>
        <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setOpen(true)}>
          <Sparkles className="w-3.5 h-3.5" />
          View Profile Tips
          <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Profile Analysis
            </SheetTitle>
          </SheetHeader>
          {open && <ProfileTipsPanel />}
        </SheetContent>
      </Sheet>
    </>
  )
}
