/**
 * FUSE-ID legal documents.
 *
 * The version strings are persisted on profiles.accepted_terms_version
 * and profiles.accepted_privacy_version so we can detect when a user
 * accepted an obsolete version and prompt them to re-accept.
 *
 * When you publish a material change, bump the corresponding version.
 * The raw Markdown bodies live in ./terms.md.ts and ./privacy.md.ts so
 * the document text is grep-friendly and lives in source control.
 */

export { TERMS_MD, TERMS_VERSION, TERMS_EFFECTIVE_DATE } from './terms.md'
export { PRIVACY_MD, PRIVACY_VERSION, PRIVACY_EFFECTIVE_DATE } from './privacy.md'
