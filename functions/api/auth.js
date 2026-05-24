export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/auth') {
    const redirectUri = `${url.origin}/api/auth/callback/github`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
    return Response.redirect(githubAuthUrl, 302);
  }

  if (path === '/api/auth/callback/github') {
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response('No code provided', { status: 400 });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Auth error: ${tokenData.error_description}`, { status: 400 });
    }

    const token = tokenData.access_token;

    const content = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;margin-top:3rem;">Authenticating, please wait...</p>
<script>
(function() {
  var token = "${token}";
  var provider = "github";
  var data = JSON.stringify({ token: token, provider: provider });
  var message = "authorization:" + provider + ":success:" + data;

  if (window.opener) {
    window.opener.postMessage(message, "*");
    setTimeout(function() { window.close(); }, 500);
  } else {
    try {
      localStorage.setItem("netlify-cms-user", JSON.stringify({ token: token, provider: provider, backendName: "github" }));
      localStorage.setItem("decap-cms-user", JSON.stringify({ token: token, provider: provider, backendName: "github" }));
    } catch(e) {}
    window.location.href = "/admin/";
  }
})();
</script>
</body>
</html>`;

    return new Response(content, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response('Not found', { status: 404 });
}
