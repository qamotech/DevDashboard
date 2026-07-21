const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const clean = (value, limit) => String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, limit);

async function sendLocMeInContact(request, url, env) {
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "This form only accepts messages from the Loc Me In page." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Invalid form format." }, 415);
  if (Number(request.headers.get("content-length") || 0) > 18_000) return json({ error: "That message is too large." }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ error: "The form could not be read." }, 400); }
  if (clean(body.company, 40)) return json({ ok: true });

  const name = clean(body.name, 80), email = clean(body.email, 160), phone = clean(body.phone, 30);
  const service = clean(body.service, 100), message = clean(body.message, 1800), stylePlan = clean(body.stylePlan, 600);
  const elapsed = Date.now() - Number(body.startedAt || 0);
  if (elapsed < 1800 || elapsed > 86_400_000) return json({ error: "Please refresh the page and try again." }, 400);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return json({ error: "Please provide your name, a valid reply email, and a short message." }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  try {
    const limiter = new Request(`${url.origin}/__locmein-rate/${encodeURIComponent(ip)}`);
    if (await caches.default.match(limiter)) return json({ error: "Your message was received recently. Please wait a minute before sending another." }, 429);
    await caches.default.put(limiter, new Response("1", { headers: { "cache-control": "max-age=60" } }));
  } catch {}

  const destination = String(env.LOCMEIN_CONTACT_EMAIL || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) return json({ error: "Studio message delivery is not configured yet." }, 503);
  let delivery;
  try {
    delivery = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({
        _subject: `New Loc Me In inquiry from ${name.replace(/[\r\n]/g, " ")}`,
        _template: "table",
        _url: `${url.origin}/locmein`,
        name,
        email,
        phone: phone || "Not provided",
        service: service || "Not sure",
        message,
        "Current style plan": stylePlan || "Not configured"
      })
    });
  } catch { return json({ error: "Message delivery is temporarily unavailable. Please try again shortly." }, 502); }
  if (!delivery.ok) return json({ error: "Message delivery is temporarily unavailable. Please try again shortly." }, 502);
  return json({ ok: true });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/locmein-contact") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { allow: "POST" });
      return sendLocMeInContact(request, url, env);
    }
    if (url.pathname === "/") {
      url.pathname = "/n8Prompt.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/funpromptz" || url.pathname === "/funpromptz/") {
      url.pathname = "/funPromptz.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/masterprompt" || url.pathname === "/masterprompt/") {
      url.pathname = "/masterPrompt.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/locmein" || url.pathname === "/locmein/") {
      url.pathname = "/loc-me-in-llc.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};

export default worker;
