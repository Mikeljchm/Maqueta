const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function createAdminToken(secret, login) {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
    login: login, iat: Math.floor(Date.now() / 1000)
  })))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const sig = await hmacSign(secret, payload);
  return payload + '.' + sig;
}

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

  // Cookie firmada con HMAC (mismo esquema que hw_fan y que el Worker usa para
  // verificar) - antes esto era btoa() sin firma, lo que permitia forjar la
  // cookie a mano desde la consola del navegador y volverse admin sin pasar
  // por GitHub en absoluto.
  const encoded = await createAdminToken(env.COOKIE_SECRET, user.login);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': `hw_admin=${encoded}; Path=/; Max-Age=${ADMIN_COOKIE_MAX_AGE}; Secure; SameSite=Lax`
    }
  });
}
