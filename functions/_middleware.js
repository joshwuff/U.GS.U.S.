export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // --- YOUR NEW UNIVERSAL PRECINCT PASSWORD ---
  const PRECINCT_PASSWORD = "Agents4ssembl32026!"; 
  const COOKIE_NAME = "ugsus_secure_auth";
  // --------------------------------------------

  // 1. Let images bypass the bouncer so your logo can load on the login screen!
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) {
    return await next();
  }

  // 2. Check if they are actively trying to log in
  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    const password = formData.get("password");

    if (password === PRECINCT_PASSWORD) {
      // Success! Give them a secure cookie (valid for 30 days) and redirect to the app
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `${COOKIE_NAME}=true; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`
        }
      });
    } else {
      // Failed! Reload the login screen with an error message
      return new Response(getLoginHTML("Incorrect password. Please try again."), {
        headers: { "Content-Type": "text/html" }
      });
    }
  }

  // 3. Check if they already have the VIP wristband (Cookie)
  const cookies = request.headers.get("Cookie") || "";
  if (cookies.includes(`${COOKIE_NAME}=true`)) {
     // Let them through to the real app!
     return await next();
  }

  // 4. If they have no cookie and aren't logging in, show them the pretty login screen
  return new Response(getLoginHTML(""), {
    headers: { "Content-Type": "text/html" }
  });
}

// --- THIS IS THE CUSTOM HTML FOR YOUR LOCK SCREEN ---
function getLoginHTML(errorMessage) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>U.GS.U.S. - Secure Login</title>
      <style>
        body { 
            background-color: #111111; 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            padding: 20px;
            box-sizing: border-box;
            color: white;
        }
        .login-logo { 
            width: 100%;
            max-width: 600px; 
            height: auto;
            margin-bottom: 20px; 
        }
        .login-input { 
            width: 100%; 
            max-width: 300px; 
            padding: 12px; 
            font-size: 16px; 
            border: 1px solid #444; 
            border-radius: 4px; 
            margin-bottom: 15px; 
            text-align: center; 
            box-sizing: border-box;
            background: #222;
            color: white;
        }
        button { 
            background-color: #f57c00; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            font-size: 18px; 
            border-radius: 4px; 
            cursor: pointer; 
            width: 100%; 
            max-width: 300px; 
            box-sizing: border-box;
        }
        button:hover { background-color: #e66a00; }
        .error { color: #ff5252; margin-top: 15px; font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <img src="/U.GS.U.S-logo.png" alt="U.GS.U.S. Logo" class="login-logo">
      <h2 style="margin-bottom: 20px;">U.GS.U.S. Portal</h2>
      
      <form method="POST" action="/login" style="display:flex; flex-direction:column; align-items:center; width:100%;">
        <input type="password" name="password" class="login-input" placeholder="Enter Precinct Password" required autofocus autocomplete="off">
        <button type="submit">Access System</button>
      </form>
      
      ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    </body>
    </html>
  `;
}
