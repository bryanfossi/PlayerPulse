/**
 * FuseID Sport Registry
 * ------------------------------------------------------------
 * Master list of every sport the platform knows about.
 * Adding a new sport is a matter of:
 *   1. Creating a new file in this directory (e.g. volleyball.ts)
 *      that exports a SportConfig.
 *   2. Importing it here and adding it to the `sports` array.
 *   3. Flipping `active: true` on the config when ready to launch.
 * No database migrations, UI component changes, or API route
 * changes should be required for the common case.
 * ------------------------------------------------------------
 */

import type { SportConfig } from './types'
import { soccer } from './soccer'
import { basketball } from './basketball'
import { lacrosse } from './lacrosse'
import { baseball } from './baseball'
import { volleyball } from './volleyball'

export type {
  SportConfig,
  DivisionConfig,
  ScholarshipConfig,
  ScholarshipType,
  TimelineConfig,
  StatConfig,
  EmailTemplateConfig,
  GoverningBody,
} from './types'

export { soccer } from './soccer'
export { basketball } from './basketball'
export { lacrosse } from './lacrosse'
export { baseball } from './baseball'
export { volleyball } from './volleyball'

/** Every sport known to FuseID, in registration order. */
export const sports: SportConfig[] = [soccer, basketball, lacrosse, baseball, volleyball]

/** Sports that are currently live in the app. */
export const activeSports: SportConfig[] = sports.filter((s) => s.active)

/** The default / launch sport. Used when no sport_id is specified. */
export const DEFAULT_SPORT_ID = 'soccer'

/** Look up a sport config by its id (slug). */
export const getSport = (id: string): SportConfig | undefined =>
  sports.find((s) => s.id === id)

/**
 * Look up a sport config by id, falling back to the default sport
 * (soccer) if not found. Useful at the edges of the system where
 * we may encounter null/undefined/unknown sport ids from legacy
 * data or unauthenticated contexts.
 */
export const getSportOrDefault = (id?: string | null): SportConfig => {
  if (id) {
    const match = getSport(id)
    if (match) return match
  }
  const fallback = getSport(DEFAULT_SPORT_ID)
  if (!fallback) {
    throw new Error(
      `Default sport "${DEFAULT_SPORT_ID}" is not registered in sports/index.ts`
    )
  }
  return fallback
}
