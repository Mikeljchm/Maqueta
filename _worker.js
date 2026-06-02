// _worker.js — Cloudflare Pages Worker
// Intercepta /auth/google/* y pasa todo lo demás al sitio estático

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
    const expected = await hmacSign(secret, payload);
    if (expected !== sig) return null;
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
    c[p.slice(0,idx).trim()] = p.slice(idx+1).trim();
  });
  return c;
}

function makeCookie(value, maxAge) {
  return COOKIE_NAME+'='+value+'; Max-Age='+maxAge+'; Path=/; HttpOnly; Secure; SameSite=Lax';
}

function jsonRes(data, extra) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...extra }
  });
}


function getSession(request) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/hw_fan=([^;]+)/);
  if (!match) return null;
  try {
    const [payload] = match[1].split('.');
    return JSON.parse(decodeURIComponent(escape(atob(
      payload.replace(/-/g,'+').replace(/_/g,'/')
    ))));
  } catch { return null; }
}

function apiJson(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

async function handleComments(request, env, corsH) {
  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return apiJson({ error: 'post_id required' }, 400, corsH);

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT id, user_name, user_avatar, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 50'
    ).bind(post_id).all();
    return apiJson({ comments: results }, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const { body } = await request.json();
    if (!body || body.trim().length === 0) return apiJson({ error: 'Empty comment' }, 400, corsH);
    if (body.length > 500) return apiJson({ error: 'Too long' }, 400, corsH);
    const result = await env.DB.prepare(
      'INSERT INTO comments (post_id, user_id, user_name, user_avatar, body) VALUES (?, ?, ?, ?, ?)'
    ).bind(post_id, session.id, session.name || session.email, session.picture || '', body.trim()).run();
    return apiJson({ ok: true, id: result.meta.last_row_id }, 200, corsH);
  }

  if (request.method === 'DELETE') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const comment_id = url.searchParams.get('id');
    if (!comment_id) return apiJson({ error: 'id required' }, 400, corsH);
    await env.DB.prepare('DELETE FROM comments WHERE id = ? AND user_id = ?').bind(comment_id, session.id).run();
    return apiJson({ ok: true }, 200, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}

async function handleLikes(request, env, corsH) {
  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return apiJson({ error: 'post_id required' }, 400, corsH);

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?'
    ).bind(post_id).all();
    const count = results[0]?.count || 0;
    const session = getSession(request);
    let liked = false;
    if (session) {
      const { results: userLike } = await env.DB.prepare(
        'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
      ).bind(post_id, session.id).all();
      liked = userLike.length > 0;
    }
    return apiJson({ count, liked }, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const { results: existing } = await env.DB.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(post_id, session.id).all();
    if (existing.length > 0) {
      await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(post_id, session.id).run();
    } else {
      await env.DB.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').bind(post_id, session.id).run();
    }
    const { results } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?'
    ).bind(post_id).all();
    return apiJson({ ok: true, liked: existing.length === 0, count: results[0]?.count || 0 }, 200, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Solo interceptar rutas /auth/google/*
    // Manejar /api/* directamente en el Worker
    if (path.startsWith('/api/')) {
      const origin = request.headers.get('Origin') || '';
      const corsH = {
        'Access-Control-Allow-Origin': origin || 'https://maqueta-8t9.pages.dev',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsH });
      }
      if (path === '/api/comments') return handleComments(request, env, corsH);
      if (path === '/api/likes') return handleLikes(request, env, corsH);
      return new Response('Not found', { status: 404 });
    }

    if (!path.startsWith('/auth/google/')) {
      // Todo lo demás va al sitio estático
      return env.ASSETS.fetch(request);
    }

    const origin = request.headers.get('Origin') || '';
    const corsH = {
      'Access-Control-Allow-Origin': origin || 'https://maqueta-8t9.pages.dev',
      'Access-Control-Allow-Credentials': 'true'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsH });
    }

    // ── LOGIN ──
    if (path === '/auth/google/login') {
      const redirect = url.searchParams.get('redirect') || url.origin + '/';
      const state = btoa(JSON.stringify({ redirect, n: Math.random().toString(36).slice(2) }));
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: url.origin + '/auth/google/callback',
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'online',
        prompt: 'select_account'
      });
      return Response.redirect(GOOGLE_AUTH_URL + '?' + params.toString(), 302);
    }

    // ── CALLBACK ──
    if (path === '/auth/google/callback') {
      const code = url.searchParams.get('code');
      const stateRaw = url.searchParams.get('state') || '';
      if (!code) return Response.redirect(url.origin + '/?auth_error=no_code', 302);

      let redirectTo = url.origin + '/';
      try { redirectTo = JSON.parse(atob(stateRaw)).redirect || redirectTo; } catch {}

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: url.origin + '/auth/google/callback',
          grant_type: 'authorization_code'
        }).toString()
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error('Token exchange failed:', errBody);
        return Response.redirect(url.origin + '/?auth_error=token', 302);
      }

      const { access_token } = await tokenRes.json();
      const userRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: 'Bearer ' + access_token }
      });
      if (!userRes.ok) return Response.redirect(url.origin + '/?auth_error=userinfo', 302);

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

    // ── SESSION ──
    if (path === '/auth/google/session') {
      const cookies = parseCookies(request.headers.get('Cookie') || '');
      const token = cookies[COOKIE_NAME];
      if (!token) return jsonRes({ authenticated: false }, corsH);
      const session = await verifySessionToken(env.COOKIE_SECRET, token);
      if (!session) {
        return new Response(JSON.stringify({ authenticated: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Set-Cookie': makeCookie('', 0), ...corsH }
        });
      }
      return jsonRes({ authenticated: true, user: session }, corsH);
    }

    // ── LOGOUT ──
    if (path === '/auth/google/logout') {
      const redirect = url.searchParams.get('redirect') || url.origin + '/';
      return new Response(null, {
        status: 302,
        headers: { Location: redirect, 'Set-Cookie': makeCookie('', 0) }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
