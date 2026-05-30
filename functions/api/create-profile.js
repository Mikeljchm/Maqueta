export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json' };

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
