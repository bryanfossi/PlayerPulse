'use client'

import { useState, useCallback } from 'react'
import { type WizardData, DEFAULT_WIZARD_DATA } from '@/types/wizard'

const STORAGE_KEY = 'pp_wizard'

function readStorage(): WizardData {
  if (typeof window === 'undefined') return DEFAULT_WIZARD_DATA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_WIZARD_DATA, ...JSON.parse(raw) } : DEFAULT_WIZARD_DATA
  } catch {
    return DEFAULT_WIZARD_DATA
  }
}

export function useWizard() {
  const [data, setData] = useState<WizardData>(readStorage)

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setData(DEFAULT_WIZARD_DATA)
  }, [])

  return { data, update, clear }
}
