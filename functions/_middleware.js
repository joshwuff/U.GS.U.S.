function getLoginHTML(errorMessage, isDark = true) {
  const bg = isDark ? "#111" : "#f0f0f0";
  const text = isDark ? "white" : "#333";
  const inputBg = isDark ? "#222" : "white";
  const inputBorder = isDark ? "#444" : "#ccc";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>U.GS.U.S. - Secure Login</title>
      <style>
        body { background-color: ${bg}; color: ${text}; font-family: Arial; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; transition: all 0.3s; }
        .login-logo { width: 100%; max-width: 500px; margin-bottom: 20px; }
        .login-input { width: 300px; padding: 12px; border: 1px solid ${inputBorder}; background: ${inputBg}; color: ${text}; border-radius: 4px; margin-bottom: 15px; text-align: center; }
        button { background-color: #f57c00; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; width: 300px; font-size: 16px; }
        .theme-toggle { position: absolute; top: 20px; right: 20px; cursor: pointer; font-size: 24px; background: none; border: none; width: auto; }
        .error { color: #ff5252; margin-top: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <button class="theme-toggle" onclick="toggleTheme()">${isDark ? '☀️' : '🌙'}</button>
      <img src="/U.GS.U.S-logo.png" class="login-logo">
      <form method="POST" action="/login" style="display:flex; flex-direction:column; align-items:center;">
        <input type="password" name="password" class="login-input" placeholder="Password" required autofocus>
        <button type="submit">Access System</button>
      </form>
      ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
      <script>
        function toggleTheme() {
          const current = document.cookie.includes('theme=light') ? 'dark' : 'light';
          document.cookie = "theme=" + current + "; path=/; max-age=31536000";
          location.reload();
        }
      </script>
    </body>
    </html>
  `;
}
