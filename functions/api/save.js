export async function onRequestPost({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const { filePath, title, description, category, poster, date, adult, featured, draft, images, videos, links } = await request.json();
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
