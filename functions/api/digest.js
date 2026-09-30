const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function digestKey(email) {
  return `digest:${email}`;
}

async function rateOk(kv, ip) {
  const key = `rl:digest:${ip || "unknown"}`;
  const n = parseInt((await kv.get(key)) || "0", 10);
  if (n >= 10) return false;
  await kv.put(key, String(n + 1), { expirationTtl: 300 });
  return true;
}

async function bumpStat(kv, key) {
  const n = parseInt((await kv.get(key)) || "0", 10);
  await kv.put(key, String(Number.isFinite(n) ? n + 1 : 1));
}

function tokenFromBytes(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function onRequest(context) {
  const kv = context.env && context.env.ACCOUNTS;
  if (!kv) return json({ ok: false, error: "no_kv" }, 503);

  const url = new URL(context.request.url);
  const ip = context.request.headers.get("cf-connecting-ip") || "unknown";

  if (context.request.method === "GET") {
    const token = String(url.searchParams.get("token") || "");
    if (token.length < 16) return json({ ok: false, error: "token" }, 400);
    const email = await kv.get(`digesttok:${token}`);
    if (!email) return json({ ok: false, error: "unknown" }, 404);
    const raw = await kv.get(digestKey(email));
    if (raw) {
      try {
        const rec = JSON.parse(raw);
        rec.unsubscribedAt = new Date().toISOString();
        await kv.put(digestKey(email), JSON.stringify(rec));
      } catch {
        /* ignore */
      }
    }
    return json({ ok: true, unsubscribed: true });
  }

  if (context.request.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  if (!(await rateOk(kv, ip))) return json({ ok: false, error: "limit" }, 429);

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "json" }, 400);
  }

  if (body.company) return json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  const lang = body.lang === "ru" ? "ru" : "de";
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return json({ ok: false, error: "email" }, 400);
  }
  if (body.consent !== true) return json({ ok: false, error: "consent" }, 400);

  const existingRaw = await kv.get(digestKey(email));
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      if (existing.unsubscribedAt) {
        delete existing.unsubscribedAt;
        existing.lang = lang;
        existing.at = new Date().toISOString();
        await kv.put(digestKey(email), JSON.stringify(existing));
      }
    } catch {
      /* keep */
    }
    return json({ ok: true, already: true });
  }

  const token = tokenFromBytes(crypto.getRandomValues(new Uint8Array(18)));
  await kv.put(
    digestKey(email),
    JSON.stringify({
      email,
      lang,
      at: new Date().toISOString(),
      token,
    })
  );
  await kv.put(`digesttok:${token}`, email);
  await bumpStat(kv, "stats:digest");
  return json({ ok: true });
}
