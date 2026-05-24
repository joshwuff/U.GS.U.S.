export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const PRECINCT_PASSWORD = "Agents4ssembl32026!"; 
  const COOKIE_NAME = "ugsus_secure_auth";
  const cookieHeader = request.headers.get("Cookie") || "";
  
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) return await next();
  if (url.pathname === "/logout") return new Response(null, { status: 302, headers: { "Location": "/", "Set-Cookie": COOKIE_NAME + "=; Path=/; Max-Age=0" } });
  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    if (formData.get("password") === PRECINCT_PASSWORD) return new Response(null, { status: 302, headers: { "Location": "/", "Set-Cookie": COOKIE_NAME + "=true; Path=/; Max-Age=43200" } });
    return new Response("Incorrect password.", { status: 401 });
  }
  if (cookieHeader.includes(COOKIE_NAME + "=true")) return await next();
  return new Response("Unauthorized", { status: 401 });
}
