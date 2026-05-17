import { injectOgMeta, normalizePath, resolveLang } from "./og-meta.js";

/** Inject Russian OG/Twitter meta for crawlers (?lang=ru and /ru/ URLs). */
export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const lang = resolveLang(url);
  if (lang !== "ru") return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const path = normalizePath(url.pathname);
  const html = await response.text();
  const body = injectOgMeta(html, path, "ru");

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  return new Response(body, { status: response.status, headers });
}
