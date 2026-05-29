export async function onRequestPost({ request, env }) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { filePath, title, description, category, idToken } = await request.json();

    // Verify Google ID token
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const tokenInfo = await verifyRes.json();

    if (tokenInfo.email !== 'chuellomikel@gmail.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'Mikeljchm/Maqueta';

    // Get current file from GitHub (need SHA + content)
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers });
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    // Decode current content
    const currentContent = atob(fileData.content.replace(/\n/g, ''));

    // Update frontmatter fields
    let newContent = currentContent;

    if (title) {
      newContent = newContent.replace(/^title:.*$/m, `title: "${title}"`);
    }
    if (description) {
      newContent = newContent.replace(/^description:.*$/m, `description: "${description.replace(/"/g, '\\"')}"`);
    }
    if (category) {
      newContent = newContent.replace(/^category:.*$/m, `category: ${category}`);
    }

    // Encode to base64
    const encoded = btoa(unescape(encodeURIComponent(newContent)));

    // Save to GitHub
    const saveRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
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
