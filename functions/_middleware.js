import { injectOgMeta, normalizePath, resolveLang } from "./og-meta.js";

const RU_HOME_JSON_LD = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebApplication","name":"Теория ПДД Германия Klasse B","url":"https://fuehrerschein.pages.dev/ru/","applicationCategory":"EducationalApplication","inLanguage":["ru","de"],"isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"EUR"},"description":"Бесплатный тренажёр теории прав в Германии, класс B. 1316 вопросов, пробный экзамен, русский и немецкий, без регистрации."}
</script>`;

/** Inject Russian OG/Twitter meta for crawlers (?lang=ru and /ru/ URLs). */
export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const lang = resolveLang(url);
  if (lang !== "ru") return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const path = normalizePath(url.pathname);
  let html = await response.text();
  html = html.replace(
    /<script type="application\/ld\+json" class="seo-de">[\s\S]*?<\/script>/gi,
    ""
  );
  if (path === "/") {
    html = html.replace(/<\/head>/i, `${RU_HOME_JSON_LD}\n</head>`);
  }
  const body = injectOgMeta(html, path, "ru");

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  return new Response(body, { status: response.status, headers });
}
