/** Open Graph / Twitter / SEO copy for crawlers (they do not run JS). */
export const SITE_ORIGIN = "https://fuehrerschein.pages.dev";
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/**
 * @typedef {{ title: string; ogTitle: string; description: string; ogPath: string; locale: string }} PageMeta
 */

/** @type {Record<string, { de: PageMeta; ru: PageMeta }>} */
export const PAGE_META = {
  "/": {
    de: {
      title: "Führerschein Theorie Klasse B kostenlos – ohne Anmeldung",
      ogTitle: "Führerschein Theorie Klasse B kostenlos",
      description:
        "Kostenloser Theorie-Trainer Klasse B: 1316 Fragen, Probeklausur mit 30 Fragen nach TÜV-Regeln. Ohne Anmeldung, auf Deutsch und Russisch.",
      ogPath: "/",
      locale: "de_DE",
    },
    ru: {
      title: "Теория ПДД Германия (Klasse B) — бесплатный тренажёр",
      ogTitle: "Теория ПДД Германия — бесплатный тренажёр",
      description:
        "Бесплатный тренажёр теории прав в Германии, класс B: 1316 вопросов, пробный экзамен 30 вопросов по правилам TÜV. Без регистрации, на русском и немецком.",
      ogPath: "/ru/",
      locale: "ru_RU",
    },
  },
  "/exam.html": {
    de: {
      title: "Probeklausur Klasse B kostenlos – 30 Fragen, TÜV-Regeln",
      ogTitle: "Probeklausur Klasse B kostenlos",
      description:
        "Prüfungssimulation Führerschein Theorie Klasse B: 20 Grundstoff + 10 Zusatzstoff, Fehlerpunkte, ohne Anmeldung. Deutsch und Russisch.",
      ogPath: "/exam.html",
      locale: "de_DE",
    },
    ru: {
      title: "Пробный экзамен ПДД Германия — 30 вопросов, класс B",
      ogTitle: "Пробный экзамен теории ПДД — класс B",
      description:
        "Симуляция теоретического экзамена в Германии: 30 вопросов, штрафные баллы как у TÜV/DEKRA. Бесплатно, без регистрации, на русском.",
      ogPath: "/ru/exam.html",
      locale: "ru_RU",
    },
  },
  "/topic.html": {
    de: {
      title: "Theoriefragen nach Themen – Klasse B kostenlos üben",
      ogTitle: "Theoriefragen nach Themen · Klasse B",
      description:
        "Amtliche Theoriefragen Klasse B nach Themen üben: Quiz, Liste, Fortschritt. Kostenlos, ohne Anmeldung, Deutsch / Russisch.",
      ogPath: "/topic.html",
      locale: "de_DE",
    },
    ru: {
      title: "Билеты ПДД Германия по темам — класс B бесплатно",
      ogTitle: "Билеты ПДД Германия по темам",
      description:
        "Официальные вопросы теории прав Германии по темам: квиз, список, прогресс. Бесплатно, без регистрации, на русском.",
      ogPath: "/ru/topic.html",
      locale: "ru_RU",
    },
  },
  "/review.html": {
    de: {
      title: "Fehler wiederholen – Führerschein Theorie kostenlos",
      ogTitle: "Fehler wiederholen · Theorie Klasse B",
      description:
        "Falsche Theoriefragen aus Themen und Probeklausur gezielt wiederholen. Kostenloser Klasse-B-Trainer, ohne Anmeldung.",
      ogPath: "/review.html",
      locale: "de_DE",
    },
    ru: {
      title: "Повтор ошибок — теория ПДД Германия бесплатно",
      ogTitle: "Повтор ошибок · теория ПДД",
      description:
        "Повтор неправильных ответов из тем и пробного экзамена. Бесплатный тренажёр класса B, без регистрации.",
      ogPath: "/ru/review.html",
      locale: "ru_RU",
    },
  },
};

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePath(pathname) {
  let p = pathname;
  if (p === "/ru" || p === "/ru/") return "/";
  if (p.startsWith("/ru/")) {
    p = p.slice(3) || "/";
  }
  if (p === "/index.html") return "/";
  return p;
}

/**
 * @param {URL} url
 * @returns {"de"|"ru"|null}
 */
export function resolveLang(url) {
  if (url.pathname === "/ru" || url.pathname.startsWith("/ru/")) return "ru";
  if (url.searchParams.get("lang") === "ru") return "ru";
  return null;
}

/**
 * @param {string} html
 * @param {string} path
 * @param {"ru"} lang
 * @returns {string}
 */
export function injectOgMeta(html, path, lang) {
  const entry = PAGE_META[path];
  if (!entry) return html;
  const meta = entry[lang];
  if (!meta) return html;

  const canonical = `${SITE_ORIGIN}${meta.ogPath}`;
  let out = html;
  out = out.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);
  out = setTitle(out, meta.title);
  out = setMetaContent(out, 'name="description"', meta.description);
  out = setMetaContent(out, 'property="og:title"', meta.ogTitle);
  out = setMetaContent(out, 'property="og:description"', meta.description);
  out = setMetaContent(out, 'property="og:url"', canonical);
  out = setMetaContent(out, 'property="og:locale"', meta.locale);
  out = setMetaContent(out, 'property="og:image"', OG_IMAGE);
  out = setMetaContent(out, 'name="twitter:title"', meta.ogTitle);
  out = setMetaContent(out, 'name="twitter:description"', meta.description);
  out = setMetaContent(out, 'name="twitter:image"', OG_IMAGE);
  out = setLinkHref(out, 'rel="canonical"', canonical);
  return out;
}

/**
 * @param {string} html
 * @param {string} text
 */
function setTitle(html, text) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(text)}</title>`);
}

/**
 * @param {string} html
 * @param {string} attrFragment e.g. name="description"
 * @param {string} value
 */
function setMetaContent(html, attrFragment, value) {
  const escaped = escapeAttr(value);
  const re = new RegExp(
    `(<meta[^>]*${attrFragment}[^>]*content=")[^"]*(")`,
    "i"
  );
  if (re.test(html)) {
    return html.replace(re, `$1${escaped}$2`);
  }
  return html;
}

/**
 * @param {string} html
 * @param {string} relFragment e.g. rel="canonical"
 * @param {string} href
 */
function setLinkHref(html, relFragment, href) {
  const escaped = escapeAttr(href);
  const re = new RegExp(
    `(<link[^>]*${relFragment}[^>]*href=")[^"]*(")`,
    "i"
  );
  if (re.test(html)) {
    return html.replace(re, `$1${escaped}$2`);
  }
  return html.replace(
    /<\/head>/i,
    `<link ${relFragment} href="${escaped}">\n</head>`
  );
}

/**
 * @param {string} s
 */
function escapeAttr(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return escapeAttr(s);
}
