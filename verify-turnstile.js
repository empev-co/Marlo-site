// Cloudflare Pages Function — server-side Turnstile verification.
//
// The patient-facing page (main.js) posts the token it gets from the
// Turnstile widget here. This function checks that token against
// Cloudflare's own verification endpoint using your SECRET key (which
// never appears in any file served to the browser), and only then tells
// the page it's safe to continue.
//
// Setup (one-time, in the Cloudflare dashboard):
//   1. Cloudflare dashboard -> Turnstile -> Add widget -> for seekmarlo.com.
//      Copy the "Site Key" into config.js (TURNSTILE_SITE_KEY) and the
//      "Secret Key" into step 2 below.
//   2. Cloudflare dashboard -> Workers & Pages -> your Marlo project ->
//      Settings -> Environment variables -> add a Production variable
//      named TURNSTILE_SECRET_KEY with that Secret Key as the value
//      (click "Encrypt" so it's stored securely). Redeploy after saving.
//
// Until TURNSTILE_SECRET_KEY is set, this function safely fails closed
// (returns success: false) rather than silently allowing every request through.

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const token = body && body.token;

    if (!token) {
      return jsonResponse({ success: false, error: "missing-token" }, 400);
    }

    const secret = context.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error("TURNSTILE_SECRET_KEY is not set as an environment variable on this Pages project.");
      return jsonResponse({ success: false, error: "not-configured" }, 500);
    }

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    const ip = context.request.headers.get("CF-Connecting-IP");
    if (ip) formData.append("remoteip", ip);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData
    });
    const outcome = await verifyRes.json();

    return jsonResponse({ success: !!outcome.success });
  } catch (e) {
    console.error("Turnstile verification error:", e);
    return jsonResponse({ success: false, error: "server-error" }, 500);
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}
