/** TÜV-style exam simulation: 30 questions, per-question check feedback with explanation. */
const EXAM_SIZE = 30;
const EXAM_SHOW_EXPLANATIONS_KEY = "fuehrershein-exam-show-explanations";
const EXAM_GRUND = 20;
const EXAM_ZUSATZ = 10;
let pool = null;
let questions = [];
let index = 0;
/** @type {Record<string, string[]>} */
let answers = {};
/** @type {Record<string, boolean>} */
let checked = {};
const els = {
  intro: document.getElementById("exam-intro"),
  loading: document.getElementById("exam-loading"),
  run: document.getElementById("exam-run"),
  result: document.getElementById("exam-result"),
  rules: document.getElementById("exam-rules"),
  poolNote: document.getElementById("exam-pool-note"),
  startBtn: document.getElementById("exam-start-btn"),
  progressFill: document.getElementById("exam-progress-fill"),
  official: document.getElementById("exam-official"),
  counter: document.getElementById("exam-counter"),
  image: document.getElementById("exam-image"),
  video: document.getElementById("exam-video"),
  mediaWrap: document.getElementById("exam-media-wrap"),
  text: document.getElementById("exam-text"),
  options: document.getElementById("exam-options"),
  feedback: document.getElementById("exam-feedback"),
  checkBtn: document.getElementById("exam-check-btn"),
  prevBtn: document.getElementById("exam-prev-btn"),
  nextBtn: document.getElementById("exam-next-btn"),
  submitBtn: document.getElementById("exam-submit-btn"),
  hint: document.getElementById("exam-answered-hint"),
  resultTitle: document.getElementById("exam-result-title"),
  resultVerdict: document.getElementById("exam-result-verdict"),
  resultDetail: document.getElementById("exam-result-detail"),
  resultStreak: document.getElementById("exam-result-streak"),
  resultRulesList: document.getElementById("exam-result-rules-list"),
  reviewList: document.getElementById("exam-review-list"),
  retryBtn: document.getElementById("exam-retry-btn"),
  showExplanations: document.getElementById("exam-show-explanations"),
  showExplanationsLabel: document.getElementById("exam-show-explanations-label"),
};

function getShowExplanations() {
  const stored = localStorage.getItem(EXAM_SHOW_EXPLANATIONS_KEY);
  if (stored === "false") return false;
  if (stored === "true") return true;
  return true;
}

function setShowExplanations(enabled) {
  localStorage.setItem(EXAM_SHOW_EXPLANATIONS_KEY, enabled ? "true" : "false");
}

function appendExplanationToFeedback(feedbackEl, q) {
  const explanation = q.explanation || q.comment;
  if (!explanation || !String(explanation).trim()) return;
  const expl = document.createElement("p");
  expl.className = "exam-explanation";
  const deQ =
    typeof window.getDeQuestionForPeek === "function"
      ? window.getDeQuestionForPeek(q)
      : null;
  const deExpl =
    deQ && typeof window.getDeExplanationForPeek === "function"
      ? window.getDeExplanationForPeek(deQ)
      : "";
  if (typeof window.fillDePeek === "function") {
    window.fillDePeek(expl, explanation, deExpl);
  } else {
    expl.textContent = explanation;
  }
  feedbackEl.appendChild(expl);
}
function showPhase(phase) {
  els.intro?.classList.toggle("hidden", phase !== "intro");
  els.loading?.classList.toggle("hidden", phase !== "loading");
  els.run?.classList.toggle("hidden", phase !== "run");
  els.result?.classList.toggle("hidden", phase !== "result");
}
function getSelectedForQuestion() {
  return getAnswerSelection(els.options);
}
function saveCurrentAnswer() {
  const q = questions[index];
  if (!q) return;
  answers[q.id] = getSelectedForQuestion();
}
function restoreAnswer(q) {
  restoreAnswerSelection(els.options, answers[q.id] || [], q);
}
function resetQuestionFeedbackUI() {
  const q = questions[index];
  if (els.feedback) {
    els.feedback.className = "feedback hidden";
    els.feedback.innerHTML = "";
  }
  syncCheckButtonVisibility(els.checkBtn, q);
  if (els.nextBtn) els.nextBtn.classList.add("hidden");
}
function formatCorrectOptions(q) {
  return formatCorrectAnswers(q);
}
function applyCheckedUI(q) {
  const selected = answers[q.id] || getSelectedForQuestion();
  const isCorrect = applyAnswerCheckedStyles(els.options, q, selected);
  if (els.feedback) {
    els.feedback.classList.remove("hidden");
    if (isCorrect) {
      els.feedback.className = "feedback ok";
      els.feedback.innerHTML = `<strong>${t("correct")}</strong>`;
    } else {
      els.feedback.className = "feedback bad";
      els.feedback.innerHTML = `<strong>${t("wrong")}</strong><p>${t("correctLabel")} ${formatCorrectOptions(q)}</p>`;
    }
    if (getShowExplanations()) {
      appendExplanationToFeedback(els.feedback, q);
    }
  }
  if (els.checkBtn) els.checkBtn.classList.add("hidden");
  if (els.nextBtn) {
    const total = questions.length;
    if (index + 1 < total) {
      els.nextBtn.classList.remove("hidden");
      els.nextBtn.textContent = t("nextQuestion");
    } else {
      els.nextBtn.classList.add("hidden");
    }
  }
}
function checkAnswer() {
  const q = questions[index];
  if (!q) return;
  const selected = getSelectedForQuestion();
  if (selected.length === 0) {
    if (els.feedback) {
      els.feedback.className = "feedback bad";
      els.feedback.classList.remove("hidden");
      els.feedback.innerHTML = `<strong>${t(isFreeTextQuestion(q) ? "enterAnswer" : "pickAnswer")}</strong>`;
    }
    return;
  }
  answers[q.id] = selected;
  checked[q.id] = true;
  applyCheckedUI(q);
  updateAnsweredHint();
}
function renderListItems(el, items) {
  if (!el) return;
  el.innerHTML = (Array.isArray(items) ? items : [])
    .map((line) => `<li>${line}</li>`)
    .join("");
}

function renderRules() {
  renderListItems(els.rules, t("examRulesList"));
}

function renderPassRulesIntro() {
  const title = document.getElementById("exam-pass-rules-title");
  const officialTitle = document.getElementById("exam-pass-rules-official-title");
  const officialList = document.getElementById("exam-pass-rules-official");
  const trainingTitle = document.getElementById("exam-pass-rules-training-title");
  const trainingText = document.getElementById("exam-pass-rules-training");
  const detailsSummary = document.getElementById("exam-rules-details-summary");
  if (title) title.textContent = t("examPassRulesTitle");
  if (officialTitle) officialTitle.textContent = t("examPassRulesOfficialTitle");
  renderListItems(officialList, t("examPassRulesOfficialList"));
  if (trainingTitle) trainingTitle.textContent = t("examPassRulesTrainingTitle");
  if (trainingText) trainingText.textContent = t("examPassRulesTrainingText");
  if (detailsSummary) detailsSummary.textContent = t("examRulesDetailsSummary");
}

function renderResultRulesExplanation(score) {
  const title = document.getElementById("exam-result-rules-title");
  if (title) title.textContent = t("examResultRulesTitle");
  if (!els.resultRulesList) return;

  const items = [
    t("examResultExplainWrong", score.wrongCount),
    t("examResultExplainFaultPoints", score.faultPoints),
    t("examResultExplainFivePoint", score.fivePointWrong),
  ];
  if (score.passed) {
    items.push(t("examResultExplainPassed"));
  } else {
    if (score.fivePointWrong >= 2) items.push(t("examResultExplainFailTwoFive"));
    if (score.faultPoints > 10) items.push(t("examResultExplainFailPoints", score.faultPoints));
  }
  renderListItems(els.resultRulesList, items);
}
function renderQuestion() {
  const q = questions[index];
  if (!q) return;
  const total = questions.length;
  const pct = ((index + 1) / total) * 100;
  if (els.progressFill) els.progressFill.style.width = `${pct}%`;
  if (els.official) els.official.textContent = formatQuestionOfficialMeta(q);
  if (els.counter) els.counter.textContent = t("sessionCounter", index + 1, total);
  const deQ =
    typeof window.getDeQuestionForPeek === "function"
      ? window.getDeQuestionForPeek(q)
      : null;
  if (typeof window.fillDePeek === "function") {
    window.fillDePeek(els.text, q.text, deQ?.text || "");
  } else if (els.text) {
    els.text.textContent = q.text;
  }
  applyQuestionMedia(
    { image: els.image, video: els.video, wrap: els.mediaWrap },
    q
  );
  const isChecked = Boolean(checked[q.id]);
  if (els.options) {
    renderQuestionAnswers(els.options, q, {
      inputName: "exam-answer",
      deQ,
      onChange: (input, label) => {
        if (checked[q.id]) return;
        if (input.type === "text") {
          label.classList.toggle("selected", Boolean(input.value.trim()));
        } else {
          label.classList.toggle("selected", input.checked);
        }
        updateAnsweredHint();
      },
    });
    syncCheckButtonVisibility(els.checkBtn, q);
    if (!isChecked) {
      bindAnswerInputSync(els.options, els.checkBtn, updateAnsweredHint);
    }
  }
  restoreAnswer(q);
  if (isChecked) {
    applyCheckedUI(q);
  } else {
    resetQuestionFeedbackUI();
    if (els.checkBtn && hasAnswerInputs(q)) {
      els.checkBtn.disabled = getSelectedForQuestion().length === 0;
    }
  }
  if (els.prevBtn) els.prevBtn.disabled = index <= 0;
  updateAnsweredHint();
}
function countAnswered() {
  return questions.filter((q) => (answers[q.id] || []).length > 0).length;
}
function countChecked() {
  return questions.filter((q) => checked[q.id]).length;
}
function updateAnsweredHint() {
  const q = questions[index];
  const current = getSelectedForQuestion();
  if (current.length) answers[q.id] = current;
  const answered = countAnswered();
  const verified = countChecked();
  if (els.hint) {
    els.hint.textContent = t("examAnsweredCount", answered, questions.length, verified);
  }
}
async function preloadDePeekForExam() {
  if (getLang() !== "ru" || typeof window.loadDePeekForTopics !== "function") return;
  const topicIds = [...new Set(questions.map((q) => q.topicId).filter(Boolean))];
  await window.loadDePeekForTopics(topicIds);
}
async function startExam() {
  showPhase("loading");
  if (els.loading) els.loading.textContent = t("examPreparing");
  try {
    pool = await loadExamPool();
    questions = pickExamQuestions(pool, EXAM_GRUND, EXAM_ZUSATZ);
    if (questions.length < EXAM_SIZE) {
      throw new Error(t("examPoolTooSmall"));
    }
    answers = {};
    checked = {};
    index = 0;
    await preloadDePeekForExam();
    showPhase("run");
    renderQuestion();
  } catch (err) {
    showPhase("intro");
    if (els.poolNote) els.poolNote.textContent = err.message;
  }
}
function goNext() {
  const q = questions[index];
  if (!q || !checked[q.id]) return;
  saveCurrentAnswer();
  if (index + 1 < questions.length) {
    index += 1;
    renderQuestion();
  }
}
function goPrev() {
  saveCurrentAnswer();
  if (index > 0) {
    index -= 1;
    renderQuestion();
  }
}
function submitExam() {
  saveCurrentAnswer();
  const unanswered = questions.length - countAnswered();
  if (unanswered > 0) {
    const ok = window.confirm(t("examSubmitConfirm", unanswered));
    if (!ok) return;
  }
  const unchecked = questions.length - countChecked();
  if (unchecked > 0) {
    const ok = window.confirm(t("examSubmitUncheckedConfirm", unchecked));
    if (!ok) return;
  }
  const score = scoreExamAnswers(questions, answers);
  recordExamResult({ ...score, questionCount: questions.length });
  for (const q of questions) {
    if (!q.topicId) continue;
    const selected = answers[q.id] || [];
    if (setsEqualAnswers(selected, q.correct)) {
      markQuestionCorrect(q.topicId, q.id);
    } else {
      markQuestionWrong(q.topicId, q.id);
    }
  }
  showResult(score);
}
function escapeHtml(text) {
  const el = document.createElement("div");
  el.textContent = text;
  return el.innerHTML;
}
function showResult(score) {
  showPhase("result");
  if (els.resultTitle) els.resultTitle.textContent = t("examResultTitle");
  if (els.resultVerdict) {
    els.resultVerdict.textContent = score.passed ? t("examPassed") : t("examFailed");
    els.resultVerdict.className = `exam-result-verdict ${score.passed ? "is-pass" : "is-fail"}`;
  }
  if (els.resultDetail) {
    els.resultDetail.textContent = t(
      "examResultDetail",
      score.wrongCount,
      score.faultPoints,
      score.fivePointWrong
    );
  }
  if (els.resultStreak) {
    els.resultStreak.textContent = t(
      "examResultStats",
      getExamCountTaken(),
      getExamCountPassed()
    );
    els.resultStreak.className = "exam-result-streak";
  }
  renderResultRulesExplanation(score);
  if (els.reviewList) {
    const wrongItems = questions.filter(
      (q) => !setsEqualAnswers(answers[q.id] || [], q.correct)
    );
    if (wrongItems.length) {
      els.reviewList.classList.remove("hidden");
      els.reviewList.innerHTML =
        `<h3>${t("examWrongHeading")}</h3>` +
        wrongItems
          .map((q) => {
            const correctText = formatCorrectAnswers(q, "; ");
            const meta = formatQuestionOfficialMeta(q);
            const metaHtml = meta
              ? `<p class="exam-review-meta">${escapeHtml(meta)}</p>`
              : "";
            return `<article class="exam-review-item">${metaHtml}<p class="exam-review-q">${escapeHtml(q.text)}</p><p class="exam-review-a">${t("correctLabel")} ${escapeHtml(correctText)}</p></article>`;
          })
          .join("");
    } else {
      els.reviewList.classList.add("hidden");
      els.reviewList.innerHTML = "";
    }
  }
}
function applyPageCopy() {
  applyDocumentLang();
  document.title = `${t("examPageTitle")} – ${t("siteTitle")}`;
  const back = document.getElementById("back-link");
  if (back) {
    back.textContent = `← ${t("allTopics")}`;
    back.href = localizedHref("index.html");
  }
  const title = document.getElementById("exam-page-title");
  if (title) title.textContent = t("examPageTitle");
  const introTitle = document.getElementById("exam-intro-title");
  if (introTitle) introTitle.textContent = t("examIntroTitle");
  if (els.startBtn) els.startBtn.textContent = t("examStart");
  if (els.prevBtn) els.prevBtn.textContent = t("examPrev");
  if (els.checkBtn) els.checkBtn.textContent = t("checkAnswer");
  if (els.nextBtn) els.nextBtn.textContent = t("nextQuestion");
  if (els.submitBtn) els.submitBtn.textContent = t("examSubmit");
  if (els.retryBtn) els.retryBtn.textContent = t("examRetry");
  if (els.showExplanationsLabel) {
    els.showExplanationsLabel.textContent = t("examShowExplanations");
  }
  if (els.showExplanations) {
    els.showExplanations.checked = getShowExplanations();
  }
  const home = document.getElementById("exam-home-btn");
  if (home) {
    home.textContent = t("allTopics");
    home.href = localizedHref("index.html");
  }
  renderPassRulesIntro();
  renderRules();
  applySiteDisclaimer();
}
function initLangSwitcher() {
  const btn = document.getElementById("lang-switch");
  if (!btn) return;
  btn.textContent = t("langSwitch");
  btn.title = t("langSwitchTitle");
  btn.addEventListener("click", () => setLang(getLang() === "ru" ? "de" : "ru"));
}
document.addEventListener("DOMContentLoaded", async () => {
  applyPageCopy();
  initLangSwitcher();
  if (els.startBtn) els.startBtn.addEventListener("click", startExam);
  if (els.prevBtn) els.prevBtn.addEventListener("click", goPrev);
  if (els.checkBtn) els.checkBtn.addEventListener("click", checkAnswer);
  if (els.nextBtn) els.nextBtn.addEventListener("click", goNext);
  if (els.submitBtn) els.submitBtn.addEventListener("click", submitExam);
  if (els.retryBtn) {
    els.retryBtn.addEventListener("click", () => {
      showPhase("intro");
      if (typeof clearExamPoolCache === "function") clearExamPoolCache();
    });
  }
  if (els.showExplanations) {
    els.showExplanations.checked = getShowExplanations();
    els.showExplanations.addEventListener("change", () => {
      setShowExplanations(els.showExplanations.checked);
      const q = questions[index];
      if (q && checked[q.id]) {
        applyCheckedUI(q);
      }
    });
  }
  showPhase("intro");
  try {
    pool = await loadExamPool();
    if (els.poolNote) {
      els.poolNote.textContent = t("examPoolNote", pool.total, EXAM_GRUND, EXAM_ZUSATZ);
    }
  } catch (err) {
    if (els.poolNote) els.poolNote.textContent = err.message;
    if (els.startBtn) els.startBtn.disabled = true;
  }
});
