/** Open Graph / Twitter copy for link previews (crawlers do not run JS). */
export const SITE_ORIGIN = "https://fuehrerschein.pages.dev";
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/**
 * @typedef {{ title: string; ogTitle: string; description: string; ogPath: string }} PageMeta
 */

/** @type {Record<string, { de: PageMeta; ru: PageMeta }>} */
export const PAGE_META = {
  "/": {
    de: {
      title: "Führerschein Theorie – Klasse B",
      ogTitle: "Führerschein Theorie · Klasse B",
      description:
        "Amtlicher Fragenkatalog: Themen üben, Quiz, Prüfungssimulation · Deutsch / Русский",
      ogPath: "/",
    },
    ru: {
      title: "Теория ПДД Германия · Класс B",
      ogTitle: "Теория ПДД Германия · Класс B",
      description:
        "Официальный каталог вопросов: темы, квиз, экзамен · интерфейс DE/RU",
      ogPath: "/ru/",
    },
  },
  "/exam.html": {
    de: {
      title: "Probeklausur – Führerschein Theorie",
      ogTitle: "Probeklausur · Führerschein Theorie",
      description:
        "30 Fragen nach TÜV-Regeln, Fehlerpunkte-Bewertung · Prüfungssimulation Klasse B · DE/RU",
      ogPath: "/exam.html",
    },
    ru: {
      title: "Пробный экзамен · Теория ПДД",
      ogTitle: "Пробный экзамен · Теория ПДД",
      description:
        "30 вопросов по правилам TÜV, штрафные баллы · симуляция экзамена класса B · DE/RU",
      ogPath: "/ru/exam.html",
    },
  },
  "/topic.html": {
    de: {
      title: "Thema – Führerschein Theorie",
      ogTitle: "Thema üben · Führerschein Theorie",
      description:
        "Quiz, alle Fragen und Fortschritt pro Thema · amtlicher Katalog Klasse B · DE/RU",
      ogPath: "/topic.html",
    },
    ru: {
      title: "Тема · Теория ПДД",
      ogTitle: "Тема · Теория ПДД",
      description:
        "Квиз, все вопросы и прогресс по теме · официальный каталог класса B · DE/RU",
      ogPath: "/ru/topic.html",
    },
  },
  "/review.html": {
    de: {
      title: "Fehler wiederholen – Führerschein Theorie",
      ogTitle: "Fehler wiederholen · Führerschein Theorie",
      description:
        "Gespeicherte Fehler aus Themen und Probeklausur gezielt wiederholen · DE/RU",
      ogPath: "/review.html",
    },
    ru: {
      title: "Повтор ошибок · Теория ПДД",
      ogTitle: "Повтор ошибок · Теория ПДД",
      description:
        "Повтор сохранённых ошибок из тем и пробного экзамена · интерфейс DE/RU",
      ogPath: "/ru/review.html",
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

  let out = html;
  out = out.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);
  out = setTitle(out, meta.title);
  out = setMetaContent(out, 'name="description"', meta.description);
  out = setMetaContent(out, 'property="og:title"', meta.ogTitle);
  out = setMetaContent(out, 'property="og:description"', meta.description);
  out = setMetaContent(out, 'property="og:url"', `${SITE_ORIGIN}${meta.ogPath}`);
  out = setMetaContent(out, 'property="og:image"', OG_IMAGE);
  out = setMetaContent(out, 'name="twitter:title"', meta.ogTitle);
  out = setMetaContent(out, 'name="twitter:description"', meta.description);
  out = setMetaContent(out, 'name="twitter:image"', OG_IMAGE);
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
