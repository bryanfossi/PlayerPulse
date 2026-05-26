import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { setPkce } from '@/lib/canva-tokens';

const CLIENT_ID    = process.env.CANVA_CLIENT_ID!;
const REDIRECT_URI = process.env.CANVA_REDIRECT_URI!;

function makeVerifier()          { return crypto.randomBytes(96).toString('base64url'); }
function makeChallenge(v: string){ return crypto.createHash('sha256').update(v).digest('base64url'); }

export async function GET() {
  if (!CLIENT_ID)    return NextResponse.json({ error: 'CANVA_CLIENT_ID not set' }, { status: 500 });
  if (!REDIRECT_URI) return NextResponse.json({ error: 'CANVA_REDIRECT_URI not set' }, { status: 500 });

  const verifier  = makeVerifier();
  const challenge = makeChallenge(verifier);
  const state     = crypto.randomBytes(32).toString('base64url');
  setPkce({ verifier, state });

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 'design:content:write asset:read brandtemplate:content:read',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state,
  });

  return NextResponse.redirect(`https://www.canva.com/api/oauth/authorize?${params}`);
}
