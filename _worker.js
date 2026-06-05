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


async function handleSave(request, env, corsH) {
  const headers = { ...corsH, 'Content-Type': 'application/json' };

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const { filePath, title, description, category, poster, date, adult, featured, draft, images, videos, links, cover, banner, bio } = await request.json();
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'HottWrestling-Admin' }
    });
    if (!getRes.ok) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });

    const fileData = await getRes.json();
    const sha = fileData.sha;
    const current = atob(fileData.content.replace(/\n/g, ''));

    // Rebuild frontmatter preserving unknown fields
    const fmMatch = current.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return new Response(JSON.stringify({ error: 'Invalid frontmatter' }), { status: 400, headers });

    let fm = fmMatch[1];
    const body = current.slice(fmMatch[0].length);

    // Update simple fields
    const setField = (key, val) => {
      const re = new RegExp(`^${key}:.*$`, 'm');
      if (re.test(fm)) { fm = fm.replace(re, `${key}: ${val}`); }
      else { fm += `\n${key}: ${val}`; }
    };

    if (title !== undefined) setField('title', `"${title}"`);
    if (description !== undefined) setField('description', `"${description.replace(/"/g, '\\"')}"`);
    if (category !== undefined) setField('category', category);
    if (poster !== undefined && poster) setField('poster', poster);
    if (cover !== undefined && cover) setField('cover', cover);
    if (banner !== undefined && banner) setField('banner', banner);
    if (bio !== undefined && bio) setField('bio', '"' + bio.replace(/"/g, '\"') + '"');
    if (date !== undefined && date) setField('date', date);
    if (adult !== undefined) setField('adult', adult ? 'true' : 'false');
    if (featured !== undefined) setField('featured', featured ? 'true' : 'false');
    if (draft !== undefined) setField('published', draft ? 'false' : 'true');

    // Update images array
    if (images && images.length > 0) {
      const imgYaml = 'images:\n' + images.map(i => `  - ${i}`).join('\n');
      if (/^images:/m.test(fm)) { fm = fm.replace(/^images:[\s\S]*?(?=\n\w|\n*$)/m, imgYaml); }
      else { fm += '\n' + imgYaml; }
    }

    // Update videos array
    if (videos && videos.length > 0) {
      const vidYaml = 'videos:\n' + videos.map(v => `  - url: ${v.url}${v.poster ? '\n    poster: ' + v.poster : ''}`).join('\n');
      if (/^videos:/m.test(fm)) { fm = fm.replace(/^videos:[\s\S]*?(?=\n\w|\n*$)/m, vidYaml); }
      else { fm += '\n' + vidYaml; }
    }

    // Update links array
    if (links && links.length > 0) {
      const linkYaml = 'links:\n' + links.map(l => `  - label: ${l.label}\n    url: ${l.url}`).join('\n');
      if (/^links:/m.test(fm)) { fm = fm.replace(/^links:[\s\S]*?(?=\n\w|\n*$)/m, linkYaml); }
      else { fm += '\n' + linkYaml; }
    }

    const newContent = `---\n${fm}\n---${body}`;
    const encoded = btoa(unescape(encodeURIComponent(newContent)));

    const saveRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'HottWrestling-Admin' },
      body: JSON.stringify({ message: `Edit: ${filePath}`, content: encoded, sha })
    });

    const saveData = await saveRes.json();
    if (!saveRes.ok) return new Response(JSON.stringify({ error: saveData.message }), { status: saveRes.status, headers });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}


async function handleCreate(request, env, corsH) {
  const headers = { ...corsH, 'Content-Type': 'application/json' };

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const { title, description, category, poster, date, adult, featured, draft, images, videos, links } = await request.json();

    if (!title) return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400, headers });

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    const postDate = date || new Date().toISOString().split('T')[0];
    const filePath = `_posts/${postDate}-${slug}.md`;

    // Build frontmatter
    let fm = `title: "${title}"`;
    fm += `\ncategory: ${category || 'wrestling'}`;
    fm += `\ndate: ${postDate}`;
    if (description) fm += `\ndescription: "${description.replace(/"/g, '\\"')}"`;
    if (poster) fm += `\nposter: ${poster}`;
    fm += `\nadult: ${adult ? 'true' : 'false'}`;
    if (featured) fm += `\nfeatured: true`;
    if (draft) fm += `\npublished: false`;

    if (images && images.length > 0) {
      fm += `\nimages:`;
      images.forEach(i => { fm += `\n  - ${i}`; });
    }

    if (videos && videos.length > 0) {
      fm += `\nvideos:`;
      videos.forEach(v => {
        fm += `\n  - url: ${v.url}`;
        if (v.poster) fm += `\n    poster: ${v.poster}`;
      });
    }

    if (links && links.length > 0) {
      fm += `\nlinks:`;
      links.forEach(l => {
        fm += `\n  - label: ${l.label}`;
        fm += `\n    url: ${l.url}`;
      });
    }

    const content = `---\n${fm}\n---\n`;
    const encoded = btoa(unescape(encodeURIComponent(content)));

    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    const createRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'HottWrestling-Admin'
      },
      body: JSON.stringify({
        message: `New post: ${title}`,
        content: encoded
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) return new Response(JSON.stringify({ error: createData.message }), { status: createRes.status, headers });

    return new Response(JSON.stringify({ ok: true, filePath }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}


async function handleDelete(request, env, corsH) {
  const headers = { ...corsH, 'Content-Type': 'application/json' };

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const { filePath } = await request.json();
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    // Get current SHA
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'HottWrestling-Admin' }
    });
    if (!getRes.ok) return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
    const fileData = await getRes.json();

    // Delete file
    const delRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'DELETE',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'HottWrestling-Admin' },
      body: JSON.stringify({ message: `Delete: ${filePath}`, sha: fileData.sha })
    });

    if (!delRes.ok) {
      const d = await delRes.json();
      return new Response(JSON.stringify({ error: d.message }), { status: delRes.status, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}


async function handleCreateProfile(request, env, corsH) {
  const headers = { ...corsH, 'Content-Type': 'application/json' };

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const { title, description, category, cover, banner, bio, adult, images, videos, links, collection } = await request.json();

    if (!title) return new Response(JSON.stringify({ error: 'Title required' }), { status: 400, headers });
    if (!collection) return new Response(JSON.stringify({ error: 'Collection required' }), { status: 400, headers });

    // Generate slug
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
    const filePath = `${collection}/${slug}.md`;

    // Build frontmatter based on collection
    let fm = `title: "${title}"`;
    if (category) fm += `\ncategory: ${category}`;
    if (cover) fm += `\ncover: ${cover}`;
    if (banner) fm += `\nbanner: ${banner}`;
    if (bio) fm += `\nbio: "${bio.replace(/"/g, '\\"')}"`;
    if (description) fm += `\ndescription: "${description.replace(/"/g, '\\"')}"`;
    fm += `\nadult: ${adult ? 'true' : 'false'}`;

    if (images && images.length > 0) {
      fm += `\nimages:`;
      images.forEach(i => { fm += `\n  - ${i}`; });
    }
    if (videos && videos.length > 0) {
      fm += `\nvideos:`;
      videos.forEach(v => { fm += `\n  - url: ${v.url}`; if(v.poster) fm += `\n    poster: ${v.poster}`; });
    }
    if (links && links.length > 0) {
      fm += `\nlinks:`;
      links.forEach(l => { fm += `\n  - label: ${l.label}\n    url: ${l.url}`; });
    }

    const fileContent = `---\n${fm}\n---\n`;
    const encoded = btoa(unescape(encodeURIComponent(fileContent)));
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    const createRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'HottWrestling-Admin' },
      body: JSON.stringify({ message: `New profile: ${title}`, content: encoded })
    });

    const createData = await createRes.json();
    if (!createRes.ok) return new Response(JSON.stringify({ error: createData.message }), { status: createRes.status, headers });

    return new Response(JSON.stringify({ ok: true, filePath }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}



async function handlePolls(request, env, corsH) {
  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return apiJson({ error: 'post_id required' }, 400, corsH);

  // Crear tablas si no existen
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    option_idx INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(post_id, user_id)
  )`).run();

  if (request.method === 'GET') {
    // Obtener encuesta y votos
    const { results: pollRows } = await env.DB.prepare(
      'SELECT * FROM polls WHERE post_id = ? LIMIT 1'
    ).bind(post_id).all();
    if (!pollRows.length) return apiJson({ poll: null }, 200, corsH);
    const poll = pollRows[0];
    const options = JSON.parse(poll.options);
    // Contar votos por opción
    const { results: votes } = await env.DB.prepare(
      'SELECT option_idx, COUNT(*) as count FROM poll_votes WHERE post_id = ? GROUP BY option_idx'
    ).bind(post_id).all();
    const counts = new Array(options.length).fill(0);
    votes.forEach(v => { counts[v.option_idx] = v.count; });
    const total = counts.reduce((a,b) => a+b, 0);
    // Ver si el usuario ya votó
    const session = getSession(request);
    let userVote = null;
    if (session) {
      const { results: uv } = await env.DB.prepare(
        'SELECT option_idx FROM poll_votes WHERE post_id = ? AND user_id = ?'
      ).bind(post_id, session.id).all();
      if (uv.length) userVote = uv[0].option_idx;
    }
    return apiJson({ poll: { question: poll.question, options, counts, total, userVote }}, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    const body = await request.json();
    // Admin puede crear/actualizar encuesta
    const adminCookie = (request.headers.get('Cookie')||'').match(/hw_admin=([^;]+)/);
    if (body.action === 'create' && adminCookie) {
      const { question, options } = body;
      if (!question || !options || options.length < 2) return apiJson({ error: 'Invalid poll' }, 400, corsH);
      const { results: existing } = await env.DB.prepare('SELECT id FROM polls WHERE post_id = ?').bind(post_id).all();
      if (existing.length) {
        await env.DB.prepare('UPDATE polls SET question=?,options=? WHERE post_id=?')
          .bind(question, JSON.stringify(options), post_id).run();
        await env.DB.prepare('DELETE FROM poll_votes WHERE post_id=?').bind(post_id).run();
      } else {
        await env.DB.prepare('INSERT INTO polls (post_id,question,options) VALUES (?,?,?)')
          .bind(post_id, question, JSON.stringify(options)).run();
      }
      return apiJson({ ok: true }, 200, corsH);
    }
    // Usuario vota
    if (body.action === 'vote') {
      if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
      const { option_idx } = body;
      if (option_idx === undefined) return apiJson({ error: 'option_idx required' }, 400, corsH);
      try {
        await env.DB.prepare('INSERT INTO poll_votes (post_id,option_idx,user_id) VALUES (?,?,?)')
          .bind(post_id, option_idx, session.id).run();
      } catch(e) {
        // Ya votó — no hacer nada
      }
      // Devolver resultados actualizados
      const { results: votes } = await env.DB.prepare(
        'SELECT option_idx, COUNT(*) as count FROM poll_votes WHERE post_id = ? GROUP BY option_idx'
      ).bind(post_id).all();
      const { results: pollRows } = await env.DB.prepare('SELECT options FROM polls WHERE post_id=?').bind(post_id).all();
      const options = JSON.parse(pollRows[0].options);
      const counts = new Array(options.length).fill(0);
      votes.forEach(v => { counts[v.option_idx] = v.count; });
      return apiJson({ ok: true, counts, total: counts.reduce((a,b)=>a+b,0), userVote: option_idx }, 200, corsH);
    }
    return apiJson({ error: 'Invalid action' }, 400, corsH);
  }
  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleCollections(request, env, corsH) {
  // Crear tablas si no existen
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS collection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    post_url TEXT,
    post_image TEXT,
    post_title TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, post_id)
  )`).run();

  const session = getSession(request);
  if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
  const uid = session.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'GET') {
    if (action === 'items') {
      // Get items of a collection
      const col_id = url.searchParams.get('col_id');
      if (!col_id) return apiJson({ error: 'col_id required' }, 400, corsH);
      const { results } = await env.DB.prepare(
        'SELECT * FROM collection_items WHERE collection_id=? AND user_id=? ORDER BY added_at DESC'
      ).bind(col_id, uid).all();
      return apiJson({ items: results }, 200, corsH);
    }
    if (action === 'saved_posts') {
      // Return all post_ids saved by user across ALL collections — single query
      const { results: sp } = await env.DB.prepare(
        'SELECT DISTINCT post_id FROM collection_items WHERE user_id=?'
      ).bind(uid).all();
      return apiJson({ post_ids: sp.map(function(r){ return r.post_id; }) }, 200, corsH);
    }
    // Get all collections for user
    const { results } = await env.DB.prepare(
      'SELECT c.*, COUNT(ci.id) as count FROM collections c LEFT JOIN collection_items ci ON c.id=ci.collection_id WHERE c.user_id=? GROUP BY c.id ORDER BY c.created_at DESC'
    ).bind(uid).all();
    // For each collection get first 4 images
    for (var col of results) {
      const { results: imgs } = await env.DB.prepare(
        'SELECT post_image FROM collection_items WHERE collection_id=? AND post_image<>"" LIMIT 4'
      ).bind(col.id).all();
      col.images = imgs.map(function(i){ return i.post_image; });
    }
    return apiJson({ collections: results }, 200, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();

    if (action === 'create') {
      const { name } = body;
      if (!name) return apiJson({ error: 'name required' }, 400, corsH);
      const result = await env.DB.prepare(
        'INSERT INTO collections (user_id, name) VALUES (?, ?)'
      ).bind(uid, name.trim()).run();
      return apiJson({ ok: true, id: result.meta.last_row_id }, 200, corsH);
    }

    if (action === 'save') {
      const { col_id, post_id, post_url, post_image, post_title } = body;
      if (!col_id || !post_id) return apiJson({ error: 'col_id and post_id required' }, 400, corsH);
      // Check ownership
      const { results: own } = await env.DB.prepare(
        'SELECT id FROM collections WHERE id=? AND user_id=?'
      ).bind(col_id, uid).all();
      if (!own.length) return apiJson({ error: 'Not your collection' }, 403, corsH);
      try {
        await env.DB.prepare(
          'INSERT INTO collection_items (collection_id, user_id, post_id, post_url, post_image, post_title) VALUES (?,?,?,?,?,?)'
        ).bind(col_id, uid, post_id, post_url||'', post_image||'', post_title||'').run();
        return apiJson({ ok: true, saved: true }, 200, corsH);
      } catch(e) {
        // Already saved — remove it (toggle)
        await env.DB.prepare(
          'DELETE FROM collection_items WHERE collection_id=? AND user_id=? AND post_id=?'
        ).bind(col_id, uid, post_id).run();
        return apiJson({ ok: true, saved: false }, 200, corsH);
      }
    }

    if (action === 'delete') {
      const { col_id } = body;
      if (!col_id) return apiJson({ error: 'col_id required' }, 400, corsH);
      await env.DB.prepare('DELETE FROM collection_items WHERE collection_id=? AND user_id=?').bind(col_id, uid).run();
      await env.DB.prepare('DELETE FROM collections WHERE id=? AND user_id=?').bind(col_id, uid).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    if (action === 'check') {
      // Check if post is saved in any collection
      const { post_id } = body;
      const { results } = await env.DB.prepare(
        'SELECT collection_id FROM collection_items WHERE user_id=? AND post_id=?'
      ).bind(uid, post_id).all();
      return apiJson({ saved_in: results.map(function(r){ return r.collection_id; }) }, 200, corsH);
    }
  }
  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleReactions(request, env, corsH) {
  /* Ensure table exists */
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reaction TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
  )`).run();

  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return apiJson({ error: 'post_id required' }, 400, corsH);

  if (request.method === 'GET') {
    /* Return counts per reaction + current user's reaction */
    const { results } = await env.DB.prepare(
      'SELECT reaction, COUNT(*) as n FROM reactions WHERE post_id=? GROUP BY reaction'
    ).bind(post_id).all();
    const counts = {};
    results.forEach(function(r){ counts[r.reaction] = r.n; });

    const session = getSession(request);
    let my = null;
    if (session) {
      const { results: mine } = await env.DB.prepare(
        'SELECT reaction FROM reactions WHERE post_id=? AND user_id=?'
      ).bind(post_id, session.id).all();
      if (mine.length) my = mine[0].reaction;
    }
    return apiJson({ counts, my }, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const body = await request.json();
    const reaction = body.reaction; /* null = remove */

    if (!reaction) {
      /* Remove user's reaction */
      await env.DB.prepare(
        'DELETE FROM reactions WHERE post_id=? AND user_id=?'
      ).bind(post_id, session.id).run();
      return apiJson({ ok: true, my: null }, 200, corsH);
    }

    /* Upsert — one reaction per user per post */
    await env.DB.prepare(
      'INSERT INTO reactions (post_id, user_id, reaction) VALUES (?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET reaction=excluded.reaction, created_at=CURRENT_TIMESTAMP'
    ).bind(post_id, session.id, reaction).run();

    /* Return fresh counts */
    const { results } = await env.DB.prepare(
      'SELECT reaction, COUNT(*) as n FROM reactions WHERE post_id=? GROUP BY reaction'
    ).bind(post_id).all();
    const counts = {};
    results.forEach(function(r){ counts[r.reaction] = r.n; });
    return apiJson({ ok: true, my: reaction, counts }, 200, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleProfile(request, env, corsH) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const session = getSession(request);
  if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT username FROM user_profiles WHERE user_id=?'
    ).bind(session.id).all();
    return apiJson({ username: results[0]?.username || null }, 200, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const username = (body.username || '').replace(/[^a-zA-Z0-9_]/g,'').slice(0,30);
    if (!username) return apiJson({ error: 'Invalid username' }, 400, corsH);
    try {
      await env.DB.prepare(
        'INSERT INTO user_profiles (user_id, username) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET username=excluded.username'
      ).bind(session.id, username).run();
      return apiJson({ ok: true, username }, 200, corsH);
    } catch(e) {
      /* Username taken (UNIQUE constraint) */
      return apiJson({ error: 'Username taken' }, 409, corsH);
    }
  }
  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleActivity(request, env, corsH) {
  const session = getSession(request);
  if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);

  const url  = new URL(request.url);
  const type = url.searchParams.get('type'); /* likes | comments */

  if (type === 'likes') {
    const { results } = await env.DB.prepare(
      'SELECT post_id FROM likes WHERE user_id=? ORDER BY rowid DESC LIMIT 100'
    ).bind(session.id).all();
    return apiJson({ post_ids: results.map(function(r){ return r.post_id; }) }, 200, corsH);
  }

  if (type === 'comments') {
    const { results } = await env.DB.prepare(
      'SELECT post_id, body, created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 100'
    ).bind(session.id).all();
    return apiJson({ comments: results }, 200, corsH);
  }

  return apiJson({ error: 'type required: likes|comments' }, 400, corsH);
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
      if (path === '/api/debug') {
        const cookies = request.headers.get('Cookie') || '';
        const hasFanCookie = cookies.includes('hw_fan=');
        const session = getSession(request);
        const hasCookieSecret = !!env.COOKIE_SECRET;
        // Test D1
        let dbTest = 'not tested';
        try {
          const { results } = await env.DB.prepare('SELECT COUNT(*) as c FROM likes').all();
          dbTest = 'ok: ' + results[0].c + ' likes';
        } catch(e) { dbTest = 'error: ' + e.message; }
        return new Response(JSON.stringify({
          hasDB: !!env.DB,
          hasCookieSecret,
          hasFanCookie,
          session: session ? { id: session.id, name: session.name } : null,
          dbTest
        }), { headers: { 'Content-Type': 'application/json', ...corsH } });
      }
      if (path === '/api/comments') return handleComments(request, env, corsH);
      if (path === '/api/likes') return handleLikes(request, env, corsH);
      if (path === '/api/polls') return handlePolls(request, env, corsH);
      if (path === '/api/activity') return handleActivity(request, env, corsH);
      if (path === '/api/profile') return handleProfile(request, env, corsH);
      if (path === '/api/reactions') return handleReactions(request, env, corsH);
      if (path === '/api/collections') return handleCollections(request, env, corsH);
      if (path === '/api/save') return handleSave(request, env, corsH);
      if (path === '/api/create') return handleCreate(request, env, corsH);
      if (path === '/api/delete') return handleDelete(request, env, corsH);
      if (path === '/api/create-profile') return handleCreateProfile(request, env, corsH);
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



