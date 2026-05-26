/**
 * In-memory Canva token store.
 * Module-level singletons persist for the life of the Next.js dev server process.
 * Fine for a single-user internal tool; replace with DB storage for multi-user/production.
 */

export interface TokenStore {
  access_token:  string | null;
  refresh_token: string | null;
  expires_at:    number | null;
}

export interface PkceStore {
  verifier: string;
  state:    string;
}

export const tokenStore: TokenStore = {
  access_token:  null,
  refresh_token: null,
  expires_at:    null,
};

export let pkceStore: PkceStore | null = null;

export function setPkce(p: PkceStore | null)  { pkceStore = p; }
export function setTokens(t: TokenStore)       { Object.assign(tokenStore, t); }
