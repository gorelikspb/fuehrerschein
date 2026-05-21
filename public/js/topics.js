async function loadTopics() {
  const res = await fetch(dataUrl("topics.json"));
  if (!res.ok) throw new Error(t("topicsError"));
  return res.json();
}

function applyTopicProgressIndicators() {
  for (const block of document.querySelectorAll(".topic-progress")) {
    const id = block.dataset.topicId;
    const total = parseInt(block.dataset.total, 10) || 0;
    const solvedPct = getTopicPercent(id, total);
    const viewedPct = getTopicViewedPercent(id, total);
    const solvedFill = block.querySelector(".topic-progress-fill--solved");
    const viewedFill = block.querySelector(".topic-progress-fill--viewed");
    const solvedBar = block.querySelector(".topic-progress-bar--solved");
    const viewedBar = block.querySelector(".topic-progress-bar--viewed");
    const label = block.querySelector(".topic-progress-label");
    if (solvedFill) solvedFill.style.width = `${solvedPct}%`;
    if (viewedFill) viewedFill.style.width = `${viewedPct}%`;
    if (solvedBar) solvedBar.setAttribute("aria-valuenow", String(solvedPct));
    if (viewedBar) viewedBar.setAttribute("aria-valuenow", String(viewedPct));
    if (label) label.textContent = t("topicProgressDualLabel", solvedPct, viewedPct);
  }
}

function renderTopicCard(topic) {
  const emptyRu = getLang() === "ru" && topic.questionCount === 0;
  const ruNote =
    getLang() === "ru" && topic.ruComplete === false
      ? `<p class="topic-ru-partial">${escapeHtml(
          t("ruPartialMeta", topic.questionCount, topic.deQuestionCount ?? topic.questionCount)
        )}</p>`
      : "";
  if (emptyRu) {
    return `
    <li>
      <div class="topic-card topic-card--disabled" aria-disabled="true">
        <div class="topic-card-head">
          <span class="topic-theme-number">${escapeHtml(topic.themeNumber || "")}</span>
          <h2>${renderTopicHeadingHtml(topic)}</h2>
        </div>
        ${ruNote}
      </div>
    </li>`;
  }
  return `
    <li>
      <a class="topic-card" href="${localizedHref(`topic.html?id=${encodeURIComponent(topic.id)}`)}">
        <div class="topic-card-head">
          <span class="topic-theme-number">${escapeHtml(topic.themeNumber || "")}</span>
          <h2>${renderTopicHeadingHtml(topic)}</h2>
        </div>
        <div class="topic-meta">${t("questionsMeta", topic.questionCount)}</div>
        ${ruNote}
        <div class="topic-progress" data-topic-id="${escapeHtml(topic.id)}" data-total="${topic.questionCount}">
          <div class="topic-progress-bar topic-progress-bar--solved" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${escapeHtml(t("progressSolvedShort"))}">
            <span class="topic-progress-fill topic-progress-fill--solved"></span>
          </div>
          <div class="topic-progress-bar topic-progress-bar--viewed" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${escapeHtml(t("progressViewedShort"))}">
            <span class="topic-progress-fill topic-progress-fill--viewed"></span>
          </div>
          <span class="topic-progress-label"></span>
        </div>
      </a>
    </li>`;
}

function renderTopics(data) {
  const list = document.getElementById("topic-list");
  const sections = [
    { key: "grundstoff", topics: [] },
    { key: "zusatzstoff", topics: [] },
  ];
  const other = [];

  for (const topic of data.topics) {
    if (topic.section === "grundstoff") sections[0].topics.push(topic);
    else if (topic.section === "zusatzstoff") sections[1].topics.push(topic);
    else other.push(topic);
  }

  const parts = [];
  for (const section of sections) {
    if (!section.topics.length) continue;
    parts.push(
      `<li class="topic-section"><h2 class="topic-section-title">${escapeHtml(
        t(`section_${section.key}`)
      )}</h2><ul class="topic-section-list">${section.topics
        .map(renderTopicCard)
        .join("")}</ul></li>`
    );
  }
  if (other.length) {
    parts.push(
      `<li class="topic-section"><ul class="topic-section-list">${other
        .map(renderTopicCard)
        .join("")}</ul></li>`
    );
  }

  const totalNote =
    data.totalQuestions != null
      ? `<p class="catalog-total">${escapeHtml(t("catalogTotal", data.totalQuestions))}</p>`
      : "";

  list.innerHTML = parts.join("") + totalNote;
  applyTopicProgressIndicators();
  if (typeof applyLocaleToAnchors === "function") applyLocaleToAnchors(list);
}

function initLangSwitcher() {
  const btn = document.getElementById("lang-switch");
  if (!btn) return;
  btn.textContent = t("langSwitch");
  btn.title = t("langSwitchTitle");
  btn.addEventListener("click", () => {
    setLang(getLang() === "ru" ? "de" : "ru");
  });
}

function findTopicById(topics, topicId) {
  return topics.find((topic) => topic.id === topicId) ?? null;
}

function chapterSubtitleFromLastRead(pos) {
  if (!pos) return "";
  if (pos.chapterName) return pos.chapterName;
  if (pos.chapter) return pos.chapter;
  if (Number.isFinite(pos.page) && pos.page >= 1) {
    return getLang() === "ru"
      ? `Глава ${pos.page}`
      : `Kapitel ${pos.page}`;
  }
  return "";
}

function renderContinueReading(topics) {
  const wrap = document.getElementById("continue-reading-wrap");
  const link = document.getElementById("continue-reading-link");
  const desc = document.getElementById("continue-reading-desc");
  if (!wrap || !link) return;

  const pos =
    typeof loadLastReadPosition === "function" ? loadLastReadPosition() : null;
  const topic = pos?.topicId && topics?.length ? findTopicById(topics, pos.topicId) : null;
  const href =
    topic && typeof buildLastReadListHref === "function"
      ? buildLastReadListHref(pos)
      : null;

  if (!href) {
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  link.href = href;
  link.textContent = t("continueReadingCta");
  if (desc) {
    const topicLabel = getTopicDisplayTitle(topic).document;
    const chapterLabel = chapterSubtitleFromLastRead(pos);
    desc.textContent = t("continueReadingSubtitle", topicLabel, chapterLabel);
  }
  if (typeof applyLocaleToAnchors === "function") applyLocaleToAnchors(wrap);
}

function renderStudyHub(topics) {
  const hubTitle = document.getElementById("study-hub-title");
  if (hubTitle) hubTitle.textContent = t("studyHubTitle");

  renderContinueReading(topics);

  const examLink = document.getElementById("study-exam-link");
  const examHeading = document.getElementById("study-exam-heading");
  const examDesc = document.getElementById("study-exam-desc");
  if (examLink) examLink.href = localizedHref("exam.html");
  if (examHeading) examHeading.textContent = t("studyExamLink");
  if (examDesc) examDesc.textContent = t("studyExamDesc");

  const reviewLink = document.getElementById("study-review-link");
  const reviewHeading = document.getElementById("study-review-heading");
  const reviewDesc = document.getElementById("study-review-desc");
  const wrongCount = countWrongQuestions();
  if (reviewLink) reviewLink.href = localizedHref("review.html");
  if (reviewHeading) reviewHeading.textContent = t("studyReviewLink");
  if (reviewDesc) reviewDesc.textContent = t("studyReviewDesc", wrongCount);
  if (reviewLink && wrongCount === 0) {
    reviewLink.classList.add("study-card--muted");
  }

  const readiness = document.getElementById("study-readiness");
  if (readiness) {
    readiness.textContent = t(
      "studyReadiness",
      getExamCountTaken(),
      getExamCountPassed()
    );
  }

  const tipSession = document.getElementById("study-tip-session");
  const tipExam = document.getElementById("study-tip-exam");
  if (tipSession) tipSession.textContent = t("studyTipSession");
  if (tipExam) tipExam.textContent = t("studyTipExamGoal");

  const footerTime = document.getElementById("footer-time");
  bindTimeDisplay(footerTime);

  const resetBtn = document.getElementById("time-reset-btn");
  if (resetBtn) {
    resetBtn.textContent = t("timeReset");
    resetBtn.addEventListener("click", () => {
      if (!window.confirm(t("timeResetConfirm"))) return;
      resetStudyTime();
      bindTimeDisplay(footerTime);
    });
  }
}

let catalogTopics = [];

function applyPageCopy() {
  applyDocumentLang();
  document.title = `${t("siteTitle")} – Klasse B`;
  const h1 = document.querySelector(".app-header h1");
  const sub = document.querySelector(".app-header p");
  if (h1) h1.textContent = t("siteTitle");
  if (sub) sub.textContent = t("siteSubtitle");
  const footerLabel = document.getElementById("footer-data-label");
  if (footerLabel) footerLabel.textContent = t("footerData");
  applySiteDisclaimer();
  renderStudyHub(catalogTopics);
}

window.addEventListener("fuehrershein-exam", () => renderStudyHub(catalogTopics));
window.addEventListener("fuehrershein-progress", () => {
  applyTopicProgressIndicators();
  renderStudyHub(catalogTopics);
});
window.addEventListener("fuehrershein-viewed", () => applyTopicProgressIndicators());
window.addEventListener("fuehrershein-last-read", () => renderContinueReading(catalogTopics));

document.addEventListener("DOMContentLoaded", async () => {
  applyPageCopy();
  initLangSwitcher();

  const list = document.getElementById("topic-list");
  try {
    const data = await loadTopics();
    catalogTopics = data.topics || [];
    renderTopics(data);
    renderContinueReading(catalogTopics);
  } catch (err) {
    list.innerHTML = `<li><p style="color:var(--bad)">${escapeHtml(err.message)}</p></li>`;
  }
});
