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


function containsLink(text) {
  /* Permitir stickers — quitar el contenido [sticker]...[/sticker] antes de chequear */
  var stripped = String(text||'').replace(/\[sticker\][^\[]*\[\/sticker\]/g, '');
  return /https?:\/\/|www\.|\.(com|net|org|io|co|xyz|tv|me|gg|ly|link|app|site|web|info|biz|us|uk|ru|de|br|mx)(\/|\s|$)/i.test(stripped);
}

async function handleComments(request, env, corsH) {
  const url = new URL(request.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return apiJson({ error: 'post_id required' }, 400, corsH);

  /* Migración: agregar parent_id si no existe */
  try { await env.DB.prepare('ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL').run(); } catch(e){}

  if (request.method === 'GET') {
    const parent_id = url.searchParams.get('parent_id');

    if (parent_id) {
      /* Replies de un comentario específico */
      const { results } = await env.DB.prepare(
        'SELECT id, user_id, user_name, user_avatar, body, created_at, parent_id FROM comments WHERE post_id=? AND parent_id=? ORDER BY created_at ASC LIMIT 50'
      ).bind(post_id, parseInt(parent_id)).all();
      return apiJson({ comments: results }, 200, corsH);
    }

    /* Top-level comments con reply_count */
    const { results } = await env.DB.prepare(
      'SELECT id, user_id, user_name, user_avatar, body, created_at FROM comments WHERE post_id=? AND (parent_id IS NULL OR parent_id=0) ORDER BY created_at ASC LIMIT 50'
    ).bind(post_id).all();

    /* Contar replies para cada top-level */
    const ids = results.map(function(r){ return r.id; });
    var replyCounts = {};
    if (ids.length) {
      const placeholders = ids.map(function(){ return '?'; }).join(',');
      const { results: rc } = await env.DB.prepare(
        'SELECT parent_id, COUNT(*) as cnt FROM comments WHERE parent_id IN ('+placeholders+') GROUP BY parent_id'
      ).bind(...ids).all();
      rc.forEach(function(r){ replyCounts[r.parent_id] = r.cnt; });
    }
    results.forEach(function(r){ r.reply_count = replyCounts[r.id] || 0; });

    return apiJson({ comments: results }, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const reqBody = await request.json();
    const { body, parent_id } = reqBody;
    if (!body || body.trim().length === 0) return apiJson({ error: 'Empty comment' }, 400, corsH);
    if (body.length > 500) return apiJson({ error: 'Too long' }, 400, corsH);
    if (containsLink(body)) return apiJson({ error: 'Links are not allowed in comments.' }, 400, corsH);
    const result = await env.DB.prepare(
      'INSERT INTO comments (post_id, user_id, user_name, user_avatar, body, parent_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(post_id, session.id, session.name || session.email, session.picture || '', body.trim(), parent_id || null).run();
    await addPoints(env, session.id, 2);
    return apiJson({ ok: true, id: result.meta.last_row_id }, 200, corsH);
  }

  if (request.method === 'DELETE') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const comment_id = url.searchParams.get('id');
    if (!comment_id) return apiJson({ error: 'id required' }, 400, corsH);
    await env.DB.prepare('DELETE FROM comments WHERE id=? AND user_id=?').bind(comment_id, session.id).run();
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
      await addPoints(env, session.id, 1);
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
        await addPoints(env, uid, 1);
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
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  try { await env.DB.prepare("ALTER TABLE user_profiles ADD COLUMN bio TEXT DEFAULT ''").run(); } catch(e){}

  const session = getSession(request);
  if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT username, bio FROM user_profiles WHERE user_id=?'
    ).bind(session.id).all();
    return apiJson({ username: results[0]?.username || null, bio: results[0]?.bio || '' }, 200, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const username = (body.username || '').replace(/[^a-zA-Z0-9_]/g,'').slice(0,30);
    const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0,120) : null;
    if (!username && bio === null) return apiJson({ error: 'Nothing to update' }, 400, corsH);
    try {
      if (username) {
        await env.DB.prepare(
          'INSERT INTO user_profiles (user_id, username) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET username=excluded.username'
        ).bind(session.id, username).run();
      }
      if (bio !== null) {
        await env.DB.prepare(
          'INSERT INTO user_profiles (user_id, bio) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET bio=excluded.bio'
        ).bind(session.id, bio).run();
      }
      return apiJson({ ok: true, username: username||null, bio: bio }, 200, corsH);
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


async function handleTrending(request, env, corsH) {
  const url  = new URL(request.url);
  const type = url.searchParams.get('type') || 'hot';

  let results;
  if (type === 'hot') {
    const r = await env.DB.prepare(
      "SELECT post_id, COUNT(*) as count FROM likes WHERE created_at > datetime('now','-24 hours') GROUP BY post_id ORDER BY count DESC LIMIT 20"
    ).all();
    results = r.results;
  } else if (type === 'saved') {
    const r = await env.DB.prepare(
      'SELECT post_id, COUNT(*) as count FROM collection_items GROUP BY post_id ORDER BY count DESC LIMIT 20'
    ).all();
    results = r.results;
  } else {
    /* new: posts with any likes/comments in last 7 days, ordered by total activity */
    const r = await env.DB.prepare(
      "SELECT post_id, COUNT(*) as count FROM likes WHERE created_at > datetime('now','-7 days') GROUP BY post_id ORDER BY count DESC LIMIT 20"
    ).all();
    results = r.results;
  }

  return apiJson({ post_ids: (results||[]).map(function(r){ return r.post_id; }) }, 200, corsH);
}


function getBadge(points) {
  if (points >= 501) return { badge: '👿', level: 'VIP' };
  if (points >= 201) return { badge: '🔥', level: 'Soldier' };
  if (points >= 51)  return { badge: '⭐', level: 'Regular' };
  return { badge: '🔰', level: 'Rookie' };
}

async function addPoints(env, userId, amount) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_points (
      user_id TEXT PRIMARY KEY,
      points INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await env.DB.prepare(
      'INSERT INTO user_points (user_id, points) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET points = points + ?, updated_at = CURRENT_TIMESTAMP'
    ).bind(userId, amount, amount).run();
  } catch(e) {}
}

async function handlePoints(request, env, corsH) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_points (
    user_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const userId = url.searchParams.get('user_id');
    if (!userId) return apiJson({ error: 'user_id required' }, 400, corsH);
    const { results } = await env.DB.prepare(
      'SELECT points FROM user_points WHERE user_id = ?'
    ).bind(userId).all();
    const pts = results[0]?.points || 0;
    return apiJson({ points: pts, ...getBadge(pts) }, 200, corsH);
  }

  if (request.method === 'POST') {
    const session = getSession(request);
    if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
    const body = await request.json();
    if (body.action !== 'add') return apiJson({ error: 'action must be add' }, 400, corsH);
    const amount = Math.min(Math.max(parseInt(body.amount) || 0, 0), 100);
    await addPoints(env, session.id, amount);
    const { results } = await env.DB.prepare(
      'SELECT points FROM user_points WHERE user_id = ?'
    ).bind(session.id).all();
    const pts = results[0]?.points || 0;
    return apiJson({ ok: true, points: pts, ...getBadge(pts) }, 200, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleConfessions(request, env, corsH) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS confessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT DEFAULT '',
    body TEXT NOT NULL,
    category TEXT DEFAULT 'confession',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  /* Agregar columna title si ya existe la tabla sin ella */
  try { await env.DB.prepare("ALTER TABLE confessions ADD COLUMN title TEXT DEFAULT ''").run(); } catch(e){}

  const url    = new URL(request.url);
  const isAdmin = (function(){
    const cookies = request.headers.get('Cookie') || '';
    const m = cookies.match(/hw_admin=([^;]+)/);
    if (!m) return false;
    try { const s = JSON.parse(atob(m[1])); return s && s.login === 'Mikeljchm'; } catch(e){ return false; }
  })();

  if (request.method === 'GET') {
    const status = url.searchParams.get('status');
    if (status === 'pending') {
      if (!isAdmin) return apiJson({ error: 'Forbidden' }, 403, corsH);
      const { results } = await env.DB.prepare(
        "SELECT id, title, body, category, created_at FROM confessions WHERE status='pending' ORDER BY created_at ASC"
      ).all();
      return apiJson({ confessions: results }, 200, corsH);
    }
    const { results } = await env.DB.prepare(
      "SELECT id, title, body, category, created_at FROM confessions WHERE status='approved' ORDER BY created_at DESC LIMIT 50"
    ).all();
    return apiJson({ confessions: results }, 200, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const action = body.action;

    if (action === 'submit') {
      const text = (body.body || '').trim();
      if (!text) return apiJson({ error: 'Empty' }, 400, corsH);
      if (text.length > 1000) return apiJson({ error: 'Too long' }, 400, corsH);
      if (containsLink(text)) return apiJson({ error: 'Links are not allowed.' }, 400, corsH);
      const cat = ['confession','fantasy','experience','rumor'].includes(body.category)
        ? body.category : 'confession';
      const title = (body.title || '').trim().slice(0, 100);
      await env.DB.prepare(
        "INSERT INTO confessions (title, body, category) VALUES (?, ?, ?)"
      ).bind(title, text, cat).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    if (action === 'approve') {
      if (!isAdmin) return apiJson({ error: 'Forbidden' }, 403, corsH);
      await env.DB.prepare(
        "UPDATE confessions SET status='approved' WHERE id=?"
      ).bind(parseInt(body.id)).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    if (action === 'reject') {
      if (!isAdmin) return apiJson({ error: 'Forbidden' }, 403, corsH);
      await env.DB.prepare(
        "DELETE FROM confessions WHERE id=?"
      ).bind(parseInt(body.id)).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    return apiJson({ error: 'Unknown action' }, 400, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleBattles(request, env, corsH) {
  /* Crear tabla battles */
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS battles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    wrestler1_name TEXT NOT NULL,
    wrestler1_image TEXT NOT NULL,
    wrestler2_name TEXT NOT NULL,
    wrestler2_image TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  /* Ensure poll_votes exists (reutilizar) */
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    option_idx INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(post_id, user_id)
  )`).run();

  const isAdmin = (function(){
    const m = (request.headers.get('Cookie')||'').match(/hw_admin=([^;]+)/);
    if (!m) return false;
    try { const s = JSON.parse(atob(m[1])); return s && s.login === 'Mikeljchm'; } catch(e){ return false; }
  })();

  if (request.method === 'GET') {
    const { results: battles } = await env.DB.prepare(
      "SELECT * FROM battles WHERE status='active' ORDER BY created_at DESC"
    ).all();

    /* Para cada batalla obtener votos y voto del usuario */
    const session = getSession(request);
    const enriched = await Promise.all(battles.map(async function(b) {
      const postId = 'battle_' + b.id;
      const { results: votes } = await env.DB.prepare(
        'SELECT option_idx, COUNT(*) as count FROM poll_votes WHERE post_id=? GROUP BY option_idx'
      ).bind(postId).all();
      const v1 = (votes.find(function(v){ return v.option_idx === 0; }) || {count:0}).count;
      const v2 = (votes.find(function(v){ return v.option_idx === 1; }) || {count:0}).count;
      let userVote = null;
      if (session) {
        const { results: uv } = await env.DB.prepare(
          'SELECT option_idx FROM poll_votes WHERE post_id=? AND user_id=?'
        ).bind(postId, session.id).all();
        if (uv.length) userVote = uv[0].option_idx;
      }
      return Object.assign({}, b, { v1, v2, total: v1+v2, userVote });
    }));
    return apiJson({ battles: enriched }, 200, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();

    if (body.action === 'create') {
      if (!isAdmin) return apiJson({ error: 'Forbidden' }, 403, corsH);
      const { title, wrestler1_name, wrestler1_image, wrestler2_name, wrestler2_image } = body;
      if (!title || !wrestler1_name || !wrestler1_image || !wrestler2_name || !wrestler2_image)
        return apiJson({ error: 'Missing fields' }, 400, corsH);
      await env.DB.prepare(
        'INSERT INTO battles (title,wrestler1_name,wrestler1_image,wrestler2_name,wrestler2_image) VALUES (?,?,?,?,?)'
      ).bind(title, wrestler1_name, wrestler1_image, wrestler2_name, wrestler2_image).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    if (body.action === 'vote') {
      const session = getSession(request);
      if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
      const battleId = parseInt(body.id);
      const wrestler = parseInt(body.wrestler); /* 1 o 2 → option_idx 0 o 1 */
      if (!battleId || (wrestler !== 1 && wrestler !== 2)) return apiJson({ error: 'Invalid' }, 400, corsH);
      const postId = 'battle_' + battleId;
      const optionIdx = wrestler - 1;
      try {
        await env.DB.prepare(
          'INSERT INTO poll_votes (post_id,option_idx,user_id) VALUES (?,?,?)'
        ).bind(postId, optionIdx, session.id).run();
      } catch(e) { /* Ya votó */ }
      /* Devolver resultados actualizados */
      const { results: votes } = await env.DB.prepare(
        'SELECT option_idx, COUNT(*) as count FROM poll_votes WHERE post_id=? GROUP BY option_idx'
      ).bind(postId).all();
      const v1 = (votes.find(function(v){ return v.option_idx === 0; }) || {count:0}).count;
      const v2 = (votes.find(function(v){ return v.option_idx === 1; }) || {count:0}).count;
      return apiJson({ ok: true, v1, v2, total: v1+v2, userVote: optionIdx }, 200, corsH);
    }

    return apiJson({ error: 'Unknown action' }, 400, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


/* ── USER POSTS ── */
async function handleUserPosts(request, env, corsH) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT DEFAULT '',
    body TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    report_count INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  try { await env.DB.prepare("ALTER TABLE user_posts ADD COLUMN image_url TEXT DEFAULT ''").run(); } catch(e){}
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS post_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    reporter_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, reporter_id)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS banned_users (
    user_id TEXT PRIMARY KEY,
    reason TEXT DEFAULT '',
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const session = getSession(request);
  const url = new URL(request.url);
  const isAdmin = (function(){
    const m = (request.headers.get('Cookie')||'').match(/hw_admin=([^;]+)/);
    if (!m) return false;
    try { const s = JSON.parse(atob(m[1])); return s && s.login === 'Mikeljchm'; } catch(e){ return false; }
  })();

  if (request.method === 'GET') {
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('user_id');

    /* Feed global — solo posts no ocultos */
    if (!action && !userId) {
      const { results } = await env.DB.prepare(
        'SELECT id,user_id,user_name,user_avatar,body,image_url,report_count,created_at FROM user_posts WHERE hidden=0 ORDER BY created_at DESC LIMIT 50'
      ).all();
      return apiJson({ posts: results }, 200, corsH);
    }
    /* Posts de un usuario específico */
    if (userId) {
      const { results } = await env.DB.prepare(
        'SELECT id,user_id,user_name,user_avatar,body,created_at FROM user_posts WHERE user_id=? AND hidden=0 ORDER BY created_at DESC LIMIT 50'
      ).bind(userId).all();
      return apiJson({ posts: results }, 200, corsH);
    }
    /* Admin: posts reportados */
    if (action === 'reported' && isAdmin) {
      const { results } = await env.DB.prepare(
        'SELECT id,user_id,user_name,body,report_count,created_at FROM user_posts WHERE report_count > 0 AND hidden=0 ORDER BY report_count DESC LIMIT 50'
      ).all();
      return apiJson({ posts: results }, 200, corsH);
    }
    return apiJson({ error: 'Invalid request' }, 400, corsH);
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const action = body.action;

    /* Publicar post */
    if (action === 'post') {
      if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
      /* Verificar ban */
      const { results: banned } = await env.DB.prepare(
        'SELECT user_id FROM banned_users WHERE user_id=?'
      ).bind(session.id).all();
      if (banned.length) return apiJson({ error: 'Your account has been suspended.' }, 403, corsH);

      const text = (body.body||'').trim();
      if (!text) return apiJson({ error: 'Empty post' }, 400, corsH);
      if (text.length > 500) return apiJson({ error: 'Max 500 characters.' }, 400, corsH);
      if (containsLink(text)) return apiJson({ error: 'Links are not allowed in posts.' }, 400, corsH);

      const image_url = (body.image_url || '').trim().slice(0, 500);
      const result = await env.DB.prepare(
        'INSERT INTO user_posts (user_id,user_name,user_avatar,body,image_url) VALUES (?,?,?,?,?)'
      ).bind(session.id, session.name||session.email, session.picture||'', text, image_url).run();
      await addPoints(env, session.id, 1);
      return apiJson({ ok: true, id: result.meta.last_row_id }, 200, corsH);
    }

    /* Reportar post */
    if (action === 'report') {
      if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);
      const postId = parseInt(body.post_id);
      try {
        await env.DB.prepare(
          'INSERT INTO post_reports (post_id,reporter_id) VALUES (?,?)'
        ).bind(postId, session.id).run();
        /* Incrementar count */
        await env.DB.prepare(
          'UPDATE user_posts SET report_count=report_count+1 WHERE id=?'
        ).bind(postId).run();
        /* Auto-ocultar si >= 3 reportes */
        await env.DB.prepare(
          'UPDATE user_posts SET hidden=1 WHERE id=? AND report_count >= 3'
        ).bind(postId).run();
      } catch(e) { /* Ya reportó */ }
      return apiJson({ ok: true }, 200, corsH);
    }

    /* Admin: ocultar/restaurar post */
    if (action === 'hide' && isAdmin) {
      await env.DB.prepare('UPDATE user_posts SET hidden=1 WHERE id=?').bind(parseInt(body.post_id)).run();
      return apiJson({ ok: true }, 200, corsH);
    }
    if (action === 'restore' && isAdmin) {
      await env.DB.prepare('UPDATE user_posts SET hidden=0,report_count=0 WHERE id=?').bind(parseInt(body.post_id)).run();
      return apiJson({ ok: true }, 200, corsH);
    }
    /* Admin: banear usuario */
    if (action === 'ban' && isAdmin) {
      await env.DB.prepare(
        'INSERT OR REPLACE INTO banned_users (user_id,reason) VALUES (?,?)'
      ).bind(body.user_id, body.reason||'').run();
      return apiJson({ ok: true }, 200, corsH);
    }
    /* Admin: desbanear */
    if (action === 'unban' && isAdmin) {
      await env.DB.prepare('DELETE FROM banned_users WHERE user_id=?').bind(body.user_id).run();
      return apiJson({ ok: true }, 200, corsH);
    }

    return apiJson({ error: 'Unknown action' }, 400, corsH);
  }

  return apiJson({ error: 'Method not allowed' }, 405, corsH);
}


async function handleUpload(request, env, corsH) {
  const session = getSession(request);
  if (!session) return apiJson({ error: 'Not authenticated' }, 401, corsH);

  const key = env.BUNNY_STORAGE_KEY;
  if (!key) return apiJson({ error: 'Storage not configured' }, 500, corsH);

  const contentType = request.headers.get('Content-Type') || 'image/webp';
  const arrayBuffer = await request.arrayBuffer();
  if (!arrayBuffer.byteLength) return apiJson({ error: 'Empty file' }, 400, corsH);
  if (arrayBuffer.byteLength > 30 * 1024 * 1024) return apiJson({ error: 'Max 30MB' }, 400, corsH);

  const ext = contentType.includes('jpeg') ? 'jpg'
    : contentType.includes('mp4') ? 'mp4'
    : contentType.includes('webm') ? 'webm'
    : contentType.includes('gif') ? 'gif'
    : 'webp';
  const filename = session.id.replace(/[^a-zA-Z0-9]/g,'').slice(0,16) + '_' + Date.now() + '.' + ext;
  const storageUrl = 'https://ny.storage.bunnycdn.com/hottwrestling/user-posts/' + filename;

  const res = await fetch(storageUrl, {
    method: 'PUT',
    headers: { 'AccessKey': key, 'Content-Type': contentType },
    body: arrayBuffer
  });

  if (!res.ok) {
    const txt = await res.text();
    return apiJson({ error: 'Upload failed: ' + txt }, 500, corsH);
  }

  const cdnUrl = 'https://hottwrestling.b-cdn.net/user-posts/' + filename;
  return apiJson({ ok: true, url: cdnUrl }, 200, corsH);
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
      if (path === '/api/upload') return handleUpload(request, env, corsH);
      if (path === '/api/posts') return handleUserPosts(request, env, corsH);
      if (path === '/api/battles') return handleBattles(request, env, corsH);
      if (path === '/api/comments') return handleComments(request, env, corsH);
      if (path === '/api/likes') return handleLikes(request, env, corsH);
      if (path === '/api/polls') return handlePolls(request, env, corsH);
      if (path === '/api/confessions') return handleConfessions(request, env, corsH);
      if (path === '/api/points') return handlePoints(request, env, corsH);
      if (path === '/api/trending') return handleTrending(request, env, corsH);
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












