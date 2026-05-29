export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return new Response('Auth failed', { status: 401 });
  }

  // Get GitHub user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HottWrestling-Admin'
    }
  });

  const user = await userRes.json();

  // Only allow Mikeljchm
  if (user.login !== 'Mikeljchm') {
    return new Response('Unauthorized', { status: 403 });
  }

  // Set session cookie and redirect to home
  const sessionData = JSON.stringify({ login: user.login, name: user.name, avatar: user.avatar_url, ts: Date.now() });
  const encoded = btoa(sessionData);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': `hw_admin=${encoded}; Path=/; Max-Age=2592000; SameSite=Lax`
    }
  });
}
