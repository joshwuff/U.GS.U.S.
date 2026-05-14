export async function onRequest(context) {
  const { request } = context;

  // --- SET YOUR UNIVERSAL PRECINCT PASSWORD HERE ---
  const PRECINCT_PASSWORD = "Agents4ssembl3"; 
  // -------------------------------------------------

  // We use 'precinct' as the username, and your password
  const expectedAuth = btoa(`precinct:${PRECINCT_PASSWORD}`);
  const authHeader = request.headers.get("Authorization");

  // If they don't have the password, the server physically rejects them
  if (!authHeader || authHeader !== `Basic ${expectedAuth}`) {
    return new Response("Unauthorized Access. Please enter the precinct credentials.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="U.GS.U.S. Secure Portal"',
      },
    });
  }

  // If the password is correct, Cloudflare hands them the real website
  return await context.next();
}
