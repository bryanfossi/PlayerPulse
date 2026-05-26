require('dotenv').config();
const express  = require('express');
const crypto   = require('crypto');
const path     = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const HOST   = '127.0.0.1';

const CLIENT_ID     = process.env.CANVA_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const REDIRECT_URI  = `http://${HOST}:${PORT}/auth/canva/callback`;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── In-memory stores (single-user, resets on server restart) ──
let tokens = { access_token: null, refresh_token: null, expires_at: null };
let pkce   = {};

// ── PKCE helpers ──────────────────────────────────────────────
function makeVerifier()          { return crypto.randomBytes(96).toString('base64url'); }
function makeChallenge(verifier) { return crypto.createHash('sha256').update(verifier).digest('base64url'); }

// ── Token refresh ─────────────────────────────────────────────
async function refreshTokens() {
  if (!tokens.refresh_token) throw new Error('No refresh token stored — re-authorize.');
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res   = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${creds}` },
    body:    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Refresh failed (${res.status})`);
  tokens = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000 };
}

// ── Ensure valid token (auto-refresh 5 min before expiry) ─────
async function ensureToken() {
  if (!tokens.access_token) throw new Error('Not connected to Canva — authorize first.');
  if (Date.now() > tokens.expires_at - 300_000) await refreshTokens();
  return tokens.access_token;
}

// ════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════

// Step 1 — redirect user to Canva consent screen
app.get('/auth/canva', (req, res) => {
  if (!CLIENT_ID) return res.status(500).send('CANVA_CLIENT_ID not set in .env');
  const verifier   = makeVerifier();
  const challenge  = makeChallenge(verifier);
  const state      = crypto.randomBytes(32).toString('base64url');
  pkce             = { verifier, state };

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 'design:content:write asset:read brandtemplate:content:read',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state,
  });
  res.redirect(`https://www.canva.com/api/oauth/authorize?${params}`);
});

// Step 2 — Canva redirects back here with ?code=
app.get('/auth/canva/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error)        return res.redirect(`/?canva_error=${encodeURIComponent(error)}`);
  if (state !== pkce.state) return res.status(400).send('State mismatch — possible CSRF.');

  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const r     = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${creds}` },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        code_verifier: pkce.verifier,
        redirect_uri:  REDIRECT_URI,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || `Token exchange failed (${r.status})`);
    tokens = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000 };
    pkce   = {};
    res.redirect('/marketing-command-center.html?canva_connected=1');
  } catch (e) {
    res.redirect(`/marketing-command-center.html?canva_error=${encodeURIComponent(e.message)}`);
  }
});

// Auth status — polled by the frontend
app.get('/auth/status', (req, res) => {
  if (!tokens.access_token) return res.json({ connected: false });
  res.json({ connected: true, expires_in: Math.max(0, Math.floor((tokens.expires_at - Date.now()) / 1000)) });
});

// ════════════════════════════════════════════════════════════════
// CANVA API PROXY  — all Canva calls route through here
// ════════════════════════════════════════════════════════════════
app.post('/api/canva/:endpoint(*)', async (req, res) => {
  try {
    const token    = await ensureToken();
    const canvaUrl = `https://api.canva.com/rest/v1/${req.params.endpoint}`;
    const r        = await fetch(canvaUrl, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════════
app.listen(PORT, HOST, () => {
  console.log('\n🟢 FuseID Marketing Command Center');
  console.log(`   http://${HOST}:${PORT}/marketing-command-center.html\n`);
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('⚠️  CANVA_CLIENT_ID or CANVA_CLIENT_SECRET missing — check your .env file\n');
  }
});
