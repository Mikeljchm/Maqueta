export async function onRequestPost({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Verify admin session cookie
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/hw_admin=([^;]+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const session = JSON.parse(atob(match[1]));
    if (session.login !== 'Mikeljchm') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const { filePath, title, description, category } = await request.json();
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    // Get current file SHA + content
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'HottWrestling-Admin'
      }
    });

    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;
    const currentContent = atob(fileData.content.replace(/\n/g, ''));

    // Update frontmatter fields
    let newContent = currentContent;
    if (title) newContent = newContent.replace(/^title:.*$/m, `title: "${title}"`);
    if (description) newContent = newContent.replace(/^description:.*$/m, `description: "${description.replace(/"/g, '\\"')}"`);
    if (category) newContent = newContent.replace(/^category:.*$/m, `category: ${category}`);

    // Encode and save
    const encoded = btoa(unescape(encodeURIComponent(newContent)));

    const saveRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'HottWrestling-Admin'
      },
      body: JSON.stringify({
        message: `Edit: ${filePath}`,
        content: encoded,
        sha: sha
      })
    });

    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      return new Response(JSON.stringify({ error: saveData.message }), { status: saveRes.status, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
