import { NextRequest, NextResponse } from 'next/server';
import { tokenStore, setTokens } from '@/lib/canva-tokens';

const CLIENT_ID     = process.env.CANVA_CLIENT_ID!;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET!;

async function refreshAccessToken() {
  if (!tokenStore.refresh_token) throw new Error('No refresh token — re-authorize Canva.');
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res   = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${creds}` },
    body:    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokenStore.refresh_token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Refresh failed (${res.status})`);
  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000 });
}

async function ensureToken(): Promise<string> {
  if (!tokenStore.access_token) throw new Error('Not connected to Canva — click Authorize first.');
  if (Date.now() > (tokenStore.expires_at ?? 0) - 300_000) await refreshAccessToken();
  return tokenStore.access_token!;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const token     = await ensureToken();
    const { path }  = await params;
    const canvaUrl  = `https://api.canva.com/rest/v1/${path.join('/')}`;
    const body      = await req.json();

    const res  = await fetch(canvaUrl, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
