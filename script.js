export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  const PRECINCT_PASSWORD = "Agents4ssembl32026!"; 
  const COOKIE_NAME = "ugsus_secure_auth";
  
  const cookieHeader = request.headers.get("Cookie") || "";
  const isDark = !cookieHeader.includes("theme=light");

  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) return await next();

  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    if (formData.get("password") === PRECINCT_PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: { "Location": "/", "Set-Cookie": COOKIE_NAME + "=true; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000" }
      });
    } else {
      return new Response(getLoginHTML("Incorrect password.", isDark), { headers: { "Content-Type": "text/html" } });
    }
  }

  if (cookieHeader.includes(COOKIE_NAME + "=true")) return await next();
  return new Response(getLoginHTML("", isDark), { headers: { "Content-Type": "text/html" } });
}

function getLoginHTML(errorMessage, isDark) {
  const bg = isDark ? "#111" : "#f0f0f0";
  const text = isDark ? "white" : "#333";
  const inputBg = isDark ? "#222" : "white";
  const border = isDark ? "#444" : "#ccc";
  const errorHTML = errorMessage ? '<div style="color:#ff5252; margin-top:15px; font-weight:bold;">' + errorMessage + '</div>' : "";

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>U.GS.U.S. - Login</title><style>' +
    'body { background:' + bg + '; color:' + text + '; font-family:Arial; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; }' +
    '.logo { width:100%; max-width:500px; margin-bottom:20px; }' +
    '.input { width:300px; padding:12px; border:1px solid ' + border + '; background:' + inputBg + '; color:' + text + '; border-radius:4px; margin-bottom:15px; text-align:center; }' +
    '.btn { background:#f57c00; color:white; border:none; padding:12px 24px; border-radius:4px; cursor:pointer; width:300px; font-size:18px; font-weight:bold; }' +
    '.toggle { position:absolute; top:20px; right:20px; cursor:pointer; font-size:24px; background:none; border:none; }' +
    '</style></head><body>' +
    '<button class="toggle" onclick="t()">' + (isDark ? '☀️' : '🌙') + '</button>' +
    '<img src="/U.GS.U.S-logo.png" class="logo"><h2>U.GS.U.S. Portal</h2>' +
    '<form method="POST" action="/login" style="display:flex; flex-direction:column; align-items:center;">' +
    '<input type="password" name="password" class="input" placeholder="Password" required autofocus>' +
    '<button type="submit" class="btn">Access System</button></form>' +
    errorHTML +
    '<script>function t(){ const c = document.cookie.includes("theme=light") ? "dark" : "light"; document.cookie = "theme=" + c + "; path=/; max-age=31536000"; location.reload(); }</script></body></html>';
}
