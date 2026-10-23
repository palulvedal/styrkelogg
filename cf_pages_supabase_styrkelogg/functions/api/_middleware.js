import { json } from '../_lib.js';

// Every /api request must carry a valid Cloudflare Access JWT.
// The verified e-mail is exposed to the handlers as context.data.userEmail.
//
// Env:
//   ACCESS_TEAM_DOMAIN  e.g. "https://myteam.cloudflareaccess.com"
//   ACCESS_AUD          Application Audience (AUD) tag of the Access application
//   DEV_USER_EMAIL      local development only (.dev.vars); skips the JWT check

let cachedKeys = null;
let cachedKeysAt = 0;
const KEY_TTL_MS = 60 * 60 * 1000;

export async function onRequest(context) {
  const { request, env } = context;

  try {
    const email = await authenticate(request, env);
    context.data.userEmail = email.toLowerCase();
  } catch (error) {
    return json({ error: error.message || 'Ikke autorisert.' }, 401);
  }

  try {
    return await context.next();
  } catch (error) {
    return json({ error: 'Serverfeil: ' + (error.message || 'ukjent') }, 500);
  }
}

async function authenticate(request, env) {
  if (env.DEV_USER_EMAIL && !env.ACCESS_AUD) {
    return env.DEV_USER_EMAIL;
  }

  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/+$/, '');
  if (!teamDomain || !env.ACCESS_AUD) {
    throw new Error('Serveren mangler ACCESS_TEAM_DOMAIN eller ACCESS_AUD.');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('Mangler Access-token.');

  const payload = await verifyJwt(token, teamDomain);

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(env.ACCESS_AUD)) throw new Error('Feil audience i token.');
  if (payload.iss !== teamDomain) throw new Error('Feil utsteder i token.');
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) throw new Error('Tokenet er utløpt.');
  if (payload.nbf && payload.nbf > now + 60) throw new Error('Tokenet er ikke gyldig ennå.');
  if (!payload.email) throw new Error('Tokenet mangler e-post.');

  return payload.email;
}

async function verifyJwt(token, teamDomain) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Ugyldig token.');
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = JSON.parse(decodeText(headerB64));
  if (header.alg !== 'RS256') throw new Error('Ugyldig token-algoritme.');

  let key = (await getKeys(teamDomain, false)).find(k => k.kid === header.kid);
  if (!key) key = (await getKeys(teamDomain, true)).find(k => k.kid === header.kid);
  if (!key) throw new Error('Ukjent signeringsnøkkel.');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    base64UrlToBytes(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  if (!valid) throw new Error('Ugyldig signatur.');

  return JSON.parse(decodeText(payloadB64));
}

async function getKeys(teamDomain, forceRefresh) {
  if (!forceRefresh && cachedKeys && Date.now() - cachedKeysAt < KEY_TTL_MS) {
    return cachedKeys;
  }
  const res = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('Kunne ikke hente Access-nøkler.');
  const { keys } = await res.json();
  cachedKeys = Array.isArray(keys) ? keys : [];
  cachedKeysAt = Date.now();
  return cachedKeys;
}

function base64UrlToBytes(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeText(input) {
  return new TextDecoder().decode(base64UrlToBytes(input));
}
