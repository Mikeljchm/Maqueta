export async function onRequestGet({ env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = 'https://maqueta-8t9.pages.dev/api/auth/callback';
  const scope = 'read:user';
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  
  return Response.redirect(url, 302);
}
