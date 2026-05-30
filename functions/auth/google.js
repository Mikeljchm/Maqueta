// functions/auth/google.js — Cloudflare Pages Function
// Maneja Google OAuth para fans de HOTT WRESTLING
// Rutas: /auth/google/login  /auth/google/callback  /auth/google/session  /auth/google/logout

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
  return `${payload}.${sig}`;
}

async function verifySessionToken(secret, token) {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
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
    const [k,...v] = p.trim().split('=');
    c[k.trim()] = v.join('=');
  });
  return c;
}

function cors(origin) {
  const allowed = ['https://hottwrestling.com','https://www.hottwrestling.com','https://maqueta-8t9.pages.dev'];
  const o = allowed.includes(origin) ? origin : 'https://hottwrestling.com';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function makeCookie(value, maxAge) {
  return [
    `${COOKIE_NAME}=${value}`,
    `Max-Age=${maxAge}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`
  ].join('; ');
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  // /auth/google/login — inicia flujo OAuth
  if (path.endsWith('/login')) {
    const redirect = url.searchParams.get('redirect') || `${url.origin}/`;
    const state = btoa(JSON.stringify({ redirect, n: crypto.randomUUID() }));
    const redirectUri = `${url.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account'
    });
    return Response.redirect(`${GOOGLE_AUTH_URL}?${params}`, 302);
  }

  // /auth/google/callback — Google regresa aquí con el code
  if (path.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');
    const redirectUri = `${url.origin}/auth/google/callback`;

    if (!code) {
      return Response.redirect(`${url.origin}/?auth_error=1`, 302);
    }

    let redirectTo = `${url.origin}/`;
    try { redirectTo = JSON.parse(atob(stateRaw)).redirect; } catch {}

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) return Response.redirect(`${url.origin}/?auth_error=2`, 302);

    const { access_token } = await tokenRes.json();
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!userRes.ok) return Response.redirect(`${url.origin}/?auth_error=3`, 302);

    const userInfo = await userRes.json();
    const token = await createSessionToken(env.COOKIE_SECRET, userInfo);

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        'Set-Cookie': makeCookie(token, COOKIE_MAX_AGE)
      }
    });
  }

  // /auth/google/session — el front llama esto para saber si está autenticado
  if (path.endsWith('/session')) {
    const cookies = parseCookies(request.headers.get('Cookie'));
    const token = cookies[COOKIE_NAME];

    if (!token) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors(origin) }
      });
    }

    const session = await verifySessionToken(env.COOKIE_SECRET, token);
    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': makeCookie('', 0),
          ...cors(origin)
        }
      });
    }

    return new Response(JSON.stringify({ authenticated: true, user: session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors(origin) }
    });
  }

  // /auth/google/logout — borra cookie y redirige
  if (path.endsWith('/logout')) {
    const redirect = url.searchParams.get('redirect') || `${url.origin}/`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirect,
        'Set-Cookie': makeCookie('', 0)
      }
    });
  }

  return new Response('Not found', { status: 404 });
}
