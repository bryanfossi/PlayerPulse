/**
 * Admin gate. Right now this is a simple email allowlist driven by the
 * ADMIN_EMAILS env var (comma-separated). Keep it dumb until we actually
 * need roles in the DB.
 *
 * Defaults to a single allowed email so the admin pages are reachable
 * even if the env var isn't set yet. Override in Vercel + .env.local.
 */

const DEFAULT_ADMINS = [
  'bryan.fossi@promotedsoccerconsultants.com',
  'bryanpf7@gmail.com',
]

function getAllowedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS
  if (!raw) return DEFAULT_ADMINS
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return getAllowedAdminEmails().map((e) => e.toLowerCase()).includes(normalized)
}
