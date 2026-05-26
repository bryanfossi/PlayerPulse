import { NextRequest, NextResponse } from 'next/server';
import { pkceStore, setPkce, setTokens } from '@/lib/canva-tokens';

const CLIENT_ID     = process.env.CANVA_CLIENT_ID!;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET!;
const REDIRECT_URI  = process.env.CANVA_REDIRECT_URI!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const base = new URL('/marketing-command-center.html', req.url);

  if (error) {
    base.searchParams.set('canva_error', error);
    return NextResponse.redirect(base);
  }

  if (!code || state !== pkceStore?.state) {
    base.searchParams.set('canva_error', 'State mismatch — possible CSRF attempt.');
    return NextResponse.redirect(base);
  }

  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res   = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`,
      },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        code_verifier: pkceStore!.verifier,
        redirect_uri:  REDIRECT_URI,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? `Token exchange failed (${res.status})`);

    setTokens({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    Date.now() + data.expires_in * 1000,
    });
    setPkce(null);

    base.searchParams.set('canva_connected', '1');
    return NextResponse.redirect(base);
  } catch (e: unknown) {
    base.searchParams.set('canva_error', e instanceof Error ? e.message : String(e));
    return NextResponse.redirect(base);
  }
}
