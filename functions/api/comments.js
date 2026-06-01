// functions/api/comments.js
// Maneja GET y POST de comentarios via D1

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

  // GET — obtener comentarios
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT id, user_name, user_avatar, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 50'
    ).bind(post_id).all();
    return json({ comments: results }, 200, corsH);
  }

  // POST — agregar comentario
  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return json({ error: 'Not authenticated' }, 401, corsH);

    const { body } = await request.json();
    if (!body || body.trim().length === 0) return json({ error: 'Empty comment' }, 400, corsH);
    if (body.length > 500) return json({ error: 'Too long' }, 400, corsH);

    const result = await env.DB.prepare(
      'INSERT INTO comments (post_id, user_id, user_name, user_avatar, body) VALUES (?, ?, ?, ?, ?)'
    ).bind(post_id, session.id, session.name || session.email, session.picture || '', body.trim()).run();

    return json({ ok: true, id: result.meta.last_row_id }, 200, corsH);
  }

  // DELETE — borrar comentario (solo el autor)
  if (request.method === 'DELETE') {
    const session = getSession(request);
    if (!session) return json({ error: 'Not authenticated' }, 401, corsH);
    const comment_id = url.searchParams.get('id');
    if (!comment_id) return json({ error: 'id required' }, 400, corsH);
    await env.DB.prepare(
      'DELETE FROM comments WHERE id = ? AND user_id = ?'
    ).bind(comment_id, session.id).run();
    return json({ ok: true }, 200, corsH);
  }

  return json({ error: 'Method not allowed' }, 405, corsH);
}
