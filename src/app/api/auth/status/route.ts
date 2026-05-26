import { NextResponse } from 'next/server';
import { tokenStore } from '@/lib/canva-tokens';

export async function GET() {
  if (!tokenStore.access_token) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected:  true,
    expires_in: Math.max(0, Math.floor((tokenStore.expires_at! - Date.now()) / 1000)),
  });
}
