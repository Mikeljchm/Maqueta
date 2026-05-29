export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json' };

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
