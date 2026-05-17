/** Track visible study time across pages (Page Visibility API). */
const TIME_STORAGE_KEY = "fuehrershein-time";
const TICK_MS = 1000;

function loadTimeSeconds() {
  try {
    const raw = localStorage.getItem(TIME_STORAGE_KEY);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveTimeSeconds(seconds) {
  localStorage.setItem(TIME_STORAGE_KEY, String(Math.max(0, Math.floor(seconds))));
}

function resetTimeSeconds() {
  saveTimeSeconds(0);
  window.dispatchEvent(new CustomEvent("fuehrershein-time", { detail: { seconds: 0 } }));
}

function formatStudyTime(totalSeconds, lang) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (lang === "ru") {
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
  }
  if (h > 0) return `${h} Std. ${m} Min.`;
  return `${m} Min.`;
}

function getFormattedStudyTime() {
  return formatStudyTime(loadTimeSeconds(), getLang());
}

(function initTimeTracker() {
  let seconds = loadTimeSeconds();
  let intervalId = null;

  function tick() {
    if (document.visibilityState !== "visible") return;
    seconds += 1;
    if (seconds % 5 === 0) saveTimeSeconds(seconds);
    window.dispatchEvent(
      new CustomEvent("fuehrershein-time", { detail: { seconds } })
    );
  }

  function start() {
    if (intervalId) return;
    intervalId = window.setInterval(tick, TICK_MS);
  }

  function stop() {
    if (!intervalId) return;
    window.clearInterval(intervalId);
    intervalId = null;
    saveTimeSeconds(seconds);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
    else {
      saveTimeSeconds(seconds);
      stop();
    }
  });

  window.addEventListener("beforeunload", () => saveTimeSeconds(seconds));
  window.addEventListener("pagehide", () => saveTimeSeconds(seconds));

  if (document.visibilityState === "visible") start();

  window.getStudyTimeSeconds = () => seconds;
  window.formatStudyTime = formatStudyTime;
  window.resetStudyTime = resetTimeSeconds;
})();

function bindTimeDisplay(el) {
  if (!el) return;
  const update = () => {
    el.textContent = t("timeInApp", getFormattedStudyTime());
  };
  update();
  window.addEventListener("fuehrershein-time", update);
  window.addEventListener("languagechange", update);
}
