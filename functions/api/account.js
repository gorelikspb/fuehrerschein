const USER_RE = /^[^\s\\/<>"'`%]{3,24}$/;
const ALLOWED_KEYS = [
  "fuehrershein-progress",
  "fuehrershein-viewed",
  "fuehrershein-last-read",
  "fuehrershein-exams",
  "fuehrershein-time",
  "fuehrerschein-lang",
  "fuehrershein-exam-show-explanations",
];
const SESSION_TTL = 60 * 60 * 24 * 90;
const PBKDF2_ITERS = 12000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function bytesToB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

function tokenFromBytes(bytes) {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERS,
      hash: "SHA-256",
    },
    key,
    256
  );
  return bytesToB64(new Uint8Array(bits));
}

function normalizeUser(raw) {
  return String(raw || "").trim();
}

function userKey(name) {
  return `user:${name.toLowerCase()}`;
}

function sessionKey(token) {
  return `sess:${token}`;
}

function sanitizeKeys(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const keys = {};
  for (const k of ALLOWED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, k)) continue;
    const val = input[k];
    if (typeof val !== "string") continue;
    if (val.length > 200000) continue;
    keys[k] = val;
  }
  return keys;
}

function keysHaveData(keys) {
  return Object.keys(keys).some((k) => keys[k]);
}

async function bumpStat(kv, key) {
  const n = parseInt((await kv.get(key)) || "0", 10);
  await kv.put(key, String(Number.isFinite(n) ? n + 1 : 1));
}

async function markAccountUsed(kv, name) {
  const flag = `used:${name}`;
  if (await kv.get(flag)) return;
  await kv.put(flag, "1");
  await bumpStat(kv, "stats:active");
}

async function rateOk(kv, ip, action) {
  const key = `rl:${action}:${ip || "unknown"}`;
  const n = parseInt((await kv.get(key)) || "0", 10);
  if (n >= 25) return false;
  await kv.put(key, String(n + 1), { expirationTtl: 300 });
  return true;
}

async function readUser(kv, name) {
  const raw = await kv.get(userKey(name));
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function writeUser(kv, name, data) {
  await kv.put(userKey(name), JSON.stringify(data));
}

async function makeSession(kv, name) {
  const token = tokenFromBytes(randomBytes(24));
  await kv.put(sessionKey(token), name.toLowerCase(), { expirationTtl: SESSION_TTL });
  return token;
}

async function sessionUser(kv, token) {
  if (!token || typeof token !== "string" || token.length < 16 || token.length > 80) {
    return null;
  }
  return kv.get(sessionKey(token));
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  const kv = context.env && context.env.ACCOUNTS;
  if (!kv) return json({ ok: false, error: "unavailable" }, 503);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }

  const action = body && body.action;
  const ip = context.request.headers.get("cf-connecting-ip") || "unknown";

  if (action === "register" || action === "login") {
    if (!(await rateOk(kv, ip, action))) {
      return json({ ok: false, error: "limit" }, 429);
    }
    const name = normalizeUser(body.user);
    const password = String(body.password || "");
    if (name.length < 3 || password.length < 4) {
      return json({ ok: false, error: "short" }, 400);
    }
    if (password.length > 72 || !USER_RE.test(name)) {
      return json({ ok: false, error: "invalid" }, 400);
    }

    if (action === "register") {
      const existing = await readUser(kv, name);
      if (existing) return json({ ok: false, error: "taken" }, 409);
      const salt = randomBytes(16);
      const record = {
        v: 1,
        name,
        salt: bytesToB64(salt),
        hash: await hashPassword(password, salt),
        keys: sanitizeKeys(body.keys),
        updatedAt: new Date().toISOString(),
      };
      await writeUser(kv, name, record);
      const token = await makeSession(kv, name);
      await bumpStat(kv, "stats:register");
      if (keysHaveData(record.keys)) await markAccountUsed(kv, name.toLowerCase());
      return json({ ok: true, token, user: name, keys: record.keys });
    }

    const record = await readUser(kv, name);
    if (!record || !record.salt || !record.hash) {
      return json({ ok: false, error: "bad" }, 401);
    }
    const hash = await hashPassword(password, b64ToBytes(record.salt));
    if (!timingEqual(hash, record.hash)) {
      return json({ ok: false, error: "bad" }, 401);
    }
    const incoming = sanitizeKeys(body.keys);
    if (!keysHaveData(record.keys || {}) && keysHaveData(incoming)) {
      record.keys = incoming;
      record.updatedAt = new Date().toISOString();
      await writeUser(kv, name, record);
    }
    const token = await makeSession(kv, name);
    await bumpStat(kv, "stats:login");
    if (keysHaveData(record.keys || {})) await markAccountUsed(kv, name.toLowerCase());
    return json({
      ok: true,
      token,
      user: record.name || name,
      keys: record.keys || {},
    });
  }

  if (action === "save") {
    const name = await sessionUser(kv, body.token);
    if (!name) return json({ ok: false, error: "unauthorized" }, 401);
    const record = await readUser(kv, name);
    if (!record) return json({ ok: false, error: "unauthorized" }, 401);
    record.keys = sanitizeKeys(body.keys);
    record.updatedAt = new Date().toISOString();
    await writeUser(kv, name, record);
    if (keysHaveData(record.keys)) await markAccountUsed(kv, name);
    return json({ ok: true });
  }

  if (action === "load") {
    const name = await sessionUser(kv, body.token);
    if (!name) return json({ ok: false, error: "unauthorized" }, 401);
    const record = await readUser(kv, name);
    if (!record) return json({ ok: false, error: "unauthorized" }, 401);
    return json({
      ok: true,
      user: record.name || name,
      keys: record.keys || {},
    });
  }

  if (action === "logout") {
    const token = body.token;
    if (token && typeof token === "string") await kv.delete(sessionKey(token));
    return json({ ok: true });
  }

  return json({ ok: false, error: "invalid" }, 400);
}
