/**
 * Admin gate. A simple email allowlist driven by the ADMIN_EMAILS env var
 * (comma-separated). Keep it dumb until we actually need roles in the DB.
 *
 * Fails closed: if ADMIN_EMAILS is unset or contains no usable entries,
 * nobody is an admin. Set it in the deployment environment (and in
 * .env.local for local development) to grant access.
 */

let warnedEmptyAllowlist = false

function getAllowedAdminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (list.length === 0 && !warnedEmptyAllowlist) {
    warnedEmptyAllowlist = true
    console.warn(
      '[auth/admin] ADMIN_EMAILS is not set or is empty. Admin access is disabled for all users until it is configured.',
    )
  }

  return list
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  return getAllowedAdminEmails().includes(normalized)
}

/** Test-only: reset the one-time warning latch. */
export function __resetAdminWarningForTests(): void {
  warnedEmptyAllowlist = false
}
