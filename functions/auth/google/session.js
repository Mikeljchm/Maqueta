const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const COOKIE_NAME = 'hw_fan';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function hmacVerify(secret, data, signature) {
  return (await hmacSign(secret, data)) === signature;
}

async function createSessionToken(secret, userInfo) {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
    id: userInfo.sub, email: userInfo.email,
    name: userInfo.name, picture: userInfo.picture,
    iat: Math.floor(Date.now() / 1000)
  })))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const sig = await hmacSign(secret, payload);
  return payload + '.' + sig;
}

async function verifySessionToken(secret, token) {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!(await hmacVerify(secret, payload, sig))) return null;
    const data = JSON.parse(decodeURIComponent(escape(atob(
      payload.replace(/-/g,'+').replace(/_/g,'/')
    ))));
    if (Math.floor(Date.now()/1000) - data.iat > COOKIE_MAX_AGE) return null;
    return data;
  } catch { return null; }
}

function parseCookies(header) {
  const c = {};
  if (!header) return c;
  header.split(';').forEach(p => {
    const idx = p.indexOf('=');
    if (idx < 0) return;
    c[p.slice(0,idx).trim()] = p.slice(idx+1);
  });
  return c;
}

function makeCookie(value, maxAge) {
  return COOKIE_NAME+'='+value+'; Max-Age='+maxAge+'; Path=/; HttpOnly; Secure; SameSite=Lax';
}

function corsHeaders(origin) {
  const allowed = ['https://hottwrestling.com','https://www.hottwrestling.com','https://maqueta-8t9.pages.dev'];
  const o = allowed.includes(origin) ? origin : 'https://maqueta-8t9.pages.dev';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
  }

  const session = await verifySessionToken(env.COOKIE_SECRET, token);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': makeCookie('', 0),
        ...corsHeaders(origin)
      }
    });
  }

  return new Response(JSON.stringify({ authenticated: true, user: session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}
