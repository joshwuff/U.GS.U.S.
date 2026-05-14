// --- UPDATED LOCK SCREEN HTML ---
function getLoginHTML(errorMessage) {
  // We create the error display only if an error actually exists
  const errorDisplay = errorMessage ? `<div class="error">${errorMessage}</div>` : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>U.GS.U.S. - Secure Login</title>
      <style>
        body { 
            background-color: #111111; /* Darkened for a cleaner look */
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
      
      ${errorDisplay}
    </body>
    </html>
  `;
}
