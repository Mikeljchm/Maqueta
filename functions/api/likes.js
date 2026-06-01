// functions/api/likes.js
// Maneja GET y POST de likes via D1

function cors(origin) {
  const allowed = ['https://hottwrestling.com','https://www.hottwrestling.com','https://maqueta-8t9.pages.dev'];
  const o = allowed.includes(origin) ? origin : 'https://maqueta-8t9.pages.dev';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
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

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const corsH = cors(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsH });
  }

  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');

  if (!post_id) return json({ error: 'post_id required' }, 400, corsH);

  // GET — obtener conteo de likes y si el usuario ya dio like
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
    return json({ count, liked }, 200, corsH);
  }

  // POST — toggle like
  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return json({ error: 'Not authenticated' }, 401, corsH);

    // Ver si ya dio like
    const { results: existing } = await env.DB.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(post_id, session.id).all();

    if (existing.length > 0) {
      // Quitar like
      await env.DB.prepare(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?'
      ).bind(post_id, session.id).run();
    } else {
      // Dar like
      await env.DB.prepare(
        'INSERT INTO likes (post_id, user_id) VALUES (?, ?)'
      ).bind(post_id, session.id).run();
    }

    const { results } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE post_id = ?'
    ).bind(post_id).all();

    return json({ ok: true, liked: existing.length === 0, count: results[0]?.count || 0 }, 200, corsH);
  }

  return json({ error: 'Method not allowed' }, 405, corsH);
}
