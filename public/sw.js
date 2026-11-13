const CACHE_NAME = "fuehrerschein-v1";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/exam.html",
  "/review.html",
  "/topic.html",
  "/formulas.html",
  "/css/styles.css",
  "/js/i18n.js",
  "/js/topics.js",
  "/js/progress.js",
  "/js/exam-pool.js?v=mix",
  "/js/exam.js",
  "/js/quiz.js",
  "/js/list.js",
  "/js/de-peek.js",
  "/js/question-answers.js",
  "/js/question-media.js",
  "/js/study-stats.js",
  "/js/time-tracker.js",
  "/js/account.js",
  "/js/review.js",
  "/data/topics.json",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip API calls and external services (Clarity, external GCS videos)
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigation: Network first, fall back to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match("/index.html");
        })
    );
    return;
  }

  // Static assets and questions: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
