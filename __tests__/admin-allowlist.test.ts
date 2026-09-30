/**
 * Admin allowlist tests. The gate must fail closed when ADMIN_EMAILS is
 * missing or empty, and match case- and whitespace-insensitively when set.
 */

import { isAdminEmail, __resetAdminWarningForTests } from '@/lib/auth/admin'

const ORIGINAL = process.env.ADMIN_EMAILS

describe('isAdminEmail', () => {
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    __resetAdminWarningForTests()
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    if (ORIGINAL === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = ORIGINAL
  })

  it('denies everyone when ADMIN_EMAILS is unset', () => {
    delete process.env.ADMIN_EMAILS
    expect(isAdminEmail('admin@example.com')).toBe(false)
    expect(isAdminEmail('someone@example.org')).toBe(false)
  })

  it('denies everyone when ADMIN_EMAILS is empty or only separators', () => {
    for (const value of ['', '   ', ',', ' , ,, ']) {
      process.env.ADMIN_EMAILS = value
      expect(isAdminEmail('admin@example.com')).toBe(false)
    }
  })

  it('warns once, not on every call, when the list is empty', () => {
    delete process.env.ADMIN_EMAILS
    isAdminEmail('a@example.com')
    isAdminEmail('b@example.com')
    isAdminEmail('c@example.com')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('ADMIN_EMAILS')
  })

  it('does not warn when the list is configured', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    isAdminEmail('admin@example.com')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('allows listed emails, case- and whitespace-insensitively', () => {
    process.env.ADMIN_EMAILS = ' Admin@Example.com , ops@example.org '
    expect(isAdminEmail('admin@example.com')).toBe(true)
    expect(isAdminEmail('  ADMIN@EXAMPLE.COM ')).toBe(true)
    expect(isAdminEmail('ops@example.org')).toBe(true)
  })

  it('denies emails not on the list', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    expect(isAdminEmail('other@example.com')).toBe(false)
    expect(isAdminEmail('admin@example.com.evil.test')).toBe(false)
  })

  it('denies null, undefined and blank emails without throwing', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail('   ')).toBe(false)
  })
})
