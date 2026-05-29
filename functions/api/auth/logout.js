export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'hw_admin=; Path=/; Max-Age=0; SameSite=Lax'
    }
  });
}
