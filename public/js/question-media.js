/** Shared image/video rendering for question views (video takes priority over image). */

const EXTRA_STEM_IMG_CLASS = "question-image-extra";

function isValidMediaUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed, window.location.href);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function showMediaError(container) {
  if (!container) return;
  let msg = container.querySelector(".question-media-error");
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "question-media-error";
    container.appendChild(msg);
  }
  msg.textContent = t("mediaLoadError");
  msg.classList.remove("hidden");
}

function hideMediaError(container) {
  const msg = container?.querySelector(".question-media-error");
  if (msg) {
    msg.textContent = "";
    msg.classList.add("hidden");
  }
}

function clearExtraStemImages(wrap) {
  if (!wrap) return;
  wrap.querySelectorAll(`.${EXTRA_STEM_IMG_CLASS}`).forEach((el) => el.remove());
}

/** Stem images only (not per-option). */
function getStemImageUrls(q) {
  if (!q || isValidMediaUrl(q.video)) return [];
  const urls = [];
  if (Array.isArray(q.image_urls)) {
    for (const url of q.image_urls) {
      if (isValidMediaUrl(url)) urls.push(url.trim());
    }
  }
  if (!urls.length && isValidMediaUrl(q.image)) urls.push(q.image.trim());
  return urls;
}

function createStemImage(url, wrap) {
  const img = document.createElement("img");
  img.className = "question-image";
  img.src = url;
  img.alt = t("questionImageAlt");
  img.onerror = () => {
    img.classList.add("hidden");
    img.removeAttribute("src");
    showMediaError(wrap);
  };
  return img;
}

/**
 * @param {{ image?: HTMLElement|null, video?: HTMLElement|null, wrap?: HTMLElement|null }} els
 * @param {{ image?: string|null, image_urls?: string[]|null, video?: string|null }} q
 */
function applyQuestionMedia(els, q) {
  const wrap = els.wrap || els.video?.parentElement || els.image?.parentElement;
  hideMediaError(wrap);
  clearExtraStemImages(wrap);

  const videoUrl = isValidMediaUrl(q.video) ? q.video.trim() : null;
  const stemUrls = videoUrl ? [] : getStemImageUrls(q);

  if (els.video) {
    els.video.pause();
    els.video.removeAttribute("src");
    els.video.load();
    els.video.onerror = null;

    if (videoUrl) {
      els.video.src = videoUrl;
      els.video.classList.remove("hidden");
      els.video.onerror = () => {
        els.video.classList.add("hidden");
        els.video.removeAttribute("src");
        showMediaError(wrap);
      };
    } else {
      els.video.classList.add("hidden");
    }
  }

  if (els.image) {
    els.image.onerror = null;
    const firstUrl = stemUrls[0] || null;
    if (firstUrl) {
      els.image.src = firstUrl;
      els.image.alt = t("questionImageAlt");
      els.image.classList.remove("hidden");
      els.image.onerror = () => {
        els.image.classList.add("hidden");
        els.image.removeAttribute("src");
        showMediaError(wrap);
      };
      for (let i = 1; i < stemUrls.length; i++) {
        const extra = createStemImage(stemUrls[i], wrap);
        extra.classList.add(EXTRA_STEM_IMG_CLASS);
        if (wrap) {
          const err = wrap.querySelector(".question-media-error");
          wrap.insertBefore(extra, err || null);
        }
      }
    } else {
      els.image.removeAttribute("src");
      els.image.classList.add("hidden");
    }
  }

  if (wrap) {
    const hasMedia = Boolean(videoUrl || stemUrls.length);
    wrap.classList.toggle("hidden", !hasMedia);
  }
}

/**
 * Fill an option label span with text and/or a sign image.
 * @param {HTMLElement} span
 * @param {{ id: string, text?: string, image?: string|null }} opt
 * @param {string} [deOptText]
 * @param {string} [prefix] Optional prefix before option letter (e.g. "✓ ")
 */
function buildOptionLabel(span, opt, deOptText = "", prefix = "") {
  span.textContent = "";
  const text = (opt.text || "").trim();
  const imgUrl = isValidMediaUrl(opt.image) ? opt.image.trim() : null;

  if (text) {
    const main = `${prefix}${opt.id}. ${text}`;
    const deMain = deOptText ? `${prefix}${opt.id}. ${deOptText}` : "";
    if (typeof window.fillDePeek === "function") {
      const line = document.createElement("span");
      line.className = "option-label-line";
      span.appendChild(line);
      window.fillDePeek(line, main, deMain);
    } else {
      span.textContent = main;
    }
  } else {
    const letter = document.createElement("span");
    letter.className = "option-label-letter";
    letter.textContent = `${prefix}${opt.id}.`;
    span.appendChild(letter);
  }

  if (imgUrl) {
    const img = document.createElement("img");
    img.className = "option-image";
    img.src = imgUrl;
    img.alt = `${t("questionImageAlt")} ${opt.id}`;
    img.loading = "lazy";
    img.onerror = () => {
      img.classList.add("hidden");
      img.removeAttribute("src");
    };
    span.appendChild(img);
  }
}

/** Append video (priority) or image(s) to a list card body. */
function appendQuestionMediaTo(body, q) {
  const videoUrl = isValidMediaUrl(q.video) ? q.video.trim() : null;
  if (videoUrl) {
    const outer = document.createElement("div");
    outer.className = "question-media-wrap";

    const video = document.createElement("video");
    video.className = "question-video";
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("aria-label", t("questionVideoAlt"));
    video.src = videoUrl;
    video.onerror = () => {
      video.classList.add("hidden");
      video.removeAttribute("src");
      showMediaError(outer);
    };
    outer.appendChild(video);
    body.appendChild(outer);
    return;
  }

  const stemUrls = getStemImageUrls(q);
  if (!stemUrls.length) return;

  const outer = document.createElement("div");
  outer.className = "question-media-wrap";
  for (const url of stemUrls) {
    const img = createStemImage(url, outer);
    img.loading = "lazy";
    outer.appendChild(img);
  }
  body.appendChild(outer);
}
