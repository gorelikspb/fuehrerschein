const params = new URLSearchParams(window.location.search);
const topicId = params.get("id");

let topic = null;
let allQuestions = [];
let activeQuestions = [];
let selectedChapter = "";
let index = 0;
let score = 0;
let answered = false;

let currentMode = "quiz";

const els = {
  loading: document.getElementById("loading"),
  quiz: document.getElementById("quiz"),
  list: document.getElementById("list-view"),
  result: document.getElementById("result"),
  modeTabs: document.getElementById("mode-tabs"),
  modeQuiz: document.getElementById("mode-quiz"),
  modeList: document.getElementById("mode-list"),
  modeProgress: document.getElementById("mode-progress"),
  progressView: document.getElementById("progress-view"),
  masteryText: document.getElementById("quiz-mastery-text"),
  masteryFill: document.getElementById("quiz-mastery-fill"),
  masteryBar: document.getElementById("quiz-mastery-bar"),
  chapterWrap: document.getElementById("quiz-chapter-wrap"),
  chapterLabel: document.getElementById("quiz-chapter-label"),
  chapterSelect: document.getElementById("quiz-chapter"),
  title: document.getElementById("topic-title"),
  progress: document.getElementById("progress-fill"),
  official: document.getElementById("question-official"),
  counter: document.getElementById("question-counter"),
  answeredBadge: document.getElementById("question-answered-badge"),
  randomBtn: document.getElementById("random-btn"),
  quizCard: document.querySelector("#quiz .quiz-card"),
  text: document.getElementById("question-text"),
  image: document.getElementById("question-image"),
  video: document.getElementById("question-video"),
  mediaWrap: document.getElementById("question-media-wrap"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  checkBtn: document.getElementById("check-btn"),
  nextBtn: document.getElementById("next-btn"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  restartBtn: document.getElementById("restart-btn"),
};

function setsEqual(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort().join(",");
  const sb = [...b].sort().join(",");
  return sa === sb;
}

function getSelected() {
  return getAnswerSelection(els.options);
}

function getViewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view === "list" || view === "progress") return view;
  return "quiz";
}

function setViewInUrl(view) {
  const url = new URL(window.location.href);
  if (view === "list" || view === "progress") url.searchParams.set("view", view);
  else url.searchParams.delete("view");
  history.replaceState(null, "", url.toString());
}

function showScreen(name) {
  els.loading.classList.toggle("hidden", name !== "loading");
  els.quiz.classList.toggle("hidden", name !== "quiz");
  els.result.classList.toggle("hidden", name !== "result");
  if (els.list) els.list.classList.toggle("hidden", name !== "list");
  if (els.progressView) els.progressView.classList.toggle("hidden", name !== "progress");
  if (els.modeTabs) {
    els.modeTabs.classList.toggle("hidden", name === "loading" || name === "result");
  }
}

function setMode(mode) {
  currentMode = mode;
  if (els.modeQuiz) els.modeQuiz.classList.toggle("is-active", mode === "quiz");
  if (els.modeList) els.modeList.classList.toggle("is-active", mode === "list");
  if (els.modeProgress) els.modeProgress.classList.toggle("is-active", mode === "progress");
  setViewInUrl(mode === "quiz" ? null : mode);
  const screen =
    mode === "list" ? "list" : mode === "progress" ? "progress" : "quiz";
  showScreen(screen);
  if (els.chapterWrap) {
    els.chapterWrap.classList.toggle("hidden", mode !== "quiz");
  }
  if (mode === "list" && typeof window.refreshQuestionList === "function") {
    window.refreshQuestionList();
  }
  if (mode === "progress" && typeof window.refreshProgressView === "function") {
    window.refreshProgressView();
  }
}

function updateQuizMasteryBar() {
  if (!topicId || !allQuestions.length) return;
  const stats = getTopicProgressStats(topicId, allQuestions);
  const pct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
  if (els.masteryText) {
    els.masteryText.textContent = t("progressOverall", stats.solved, stats.total);
  }
  if (els.masteryFill) els.masteryFill.style.width = `${pct}%`;
  if (els.masteryBar) els.masteryBar.setAttribute("aria-valuenow", String(pct));
}

window.updateQuizMasteryBar = updateQuizMasteryBar;

function chapterNumberFromQuestion(q) {
  if (q.chapterNumber) return q.chapterNumber;
  const match = q.id && q.id.match(/^(\d+\.\d+\.\d+)/);
  return match ? match[1] : "";
}

function chapterOptionLabel(group) {
  if (getLang() === "ru" && group.chapterDisplay) {
    return group.chapterDisplay;
  }
  if (group.chapterNumber && group.chapterName) {
    return t("chapterHeading", group.chapterNumber, group.chapterName);
  }
  return group.chapterName || group.chapterDisplay || group.chapterNumber;
}

function applyChapterFilter() {
  if (!topic) return;
  activeQuestions = selectedChapter
    ? allQuestions.filter((q) => chapterNumberFromQuestion(q) === selectedChapter)
    : allQuestions.slice();
  topic.questions = activeQuestions;
  index = 0;
  score = 0;
}

function initChapterSelector() {
  if (!els.chapterSelect || !topic) return;
  const groups =
    typeof window.getChapterGroups === "function"
      ? window.getChapterGroups({ questions: allQuestions })
      : [];

  els.chapterSelect.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = t("quizChapterAll");
  els.chapterSelect.appendChild(allOpt);

  for (const group of groups) {
    if (!group.chapterNumber) continue;
    const opt = document.createElement("option");
    opt.value = group.chapterNumber;
    opt.textContent = `${chapterOptionLabel(group)} (${group.items.length})`;
    els.chapterSelect.appendChild(opt);
  }

  els.chapterSelect.value = selectedChapter;
  if (els.chapterWrap) {
    els.chapterWrap.classList.toggle("hidden", groups.length <= 1);
  }
}

function onChapterChange() {
  selectedChapter = els.chapterSelect?.value || "";
  applyChapterFilter();
  if (currentMode === "quiz") {
    renderQuestion();
  }
  if (typeof window.refreshQuestionList === "function") {
    window.refreshQuestionList();
  }
}

function initModeTabs() {
  if (!els.modeTabs) return;
  if (els.modeQuiz) {
    els.modeQuiz.textContent = t("modeQuiz");
    els.modeQuiz.addEventListener("click", () => setMode("quiz"));
  }
  if (els.modeList) {
    els.modeList.textContent = t("modeList");
    els.modeList.addEventListener("click", () => setMode("list"));
  }
  if (els.modeProgress) {
    els.modeProgress.textContent = t("modeProgress");
    els.modeProgress.addEventListener("click", () => setMode("progress"));
  }
  currentMode = getViewFromUrl();
  setMode(currentMode);
}

async function loadTopic() {
  if (!topicId) throw new Error(t("noTopic"));
  const [res] = await Promise.all([
    fetch(dataUrl(`${encodeURIComponent(topicId)}.json`)),
    typeof window.loadDePeekForTopic === "function"
      ? window.loadDePeekForTopic(topicId)
      : Promise.resolve(),
  ]);
  if (!res.ok) throw new Error(t("topicNotFound"));
  return res.json();
}

function updateQuestionAnsweredBadge(q) {
  if (!els.answeredBadge || !topicId) return;
  const status = getQuestionStatus(topicId, q.id);
  els.answeredBadge.classList.add("hidden");
  els.answeredBadge.classList.remove(
    "question-status-badge--solved",
    "question-status-badge--answered"
  );
  if (status === "correct") {
    els.answeredBadge.textContent = t("questionSolvedBadge");
    els.answeredBadge.classList.add("question-status-badge--solved");
    els.answeredBadge.classList.remove("hidden");
  } else if (status === "wrong") {
    els.answeredBadge.textContent = t("questionAnsweredBadge");
    els.answeredBadge.classList.add("question-status-badge--answered");
    els.answeredBadge.classList.remove("hidden");
  }
  if (els.quizCard) {
    els.quizCard.classList.toggle("quiz-card--answered", status !== "unseen");
    els.quizCard.classList.toggle("quiz-card--mastered", status === "correct");
  }
}

function jumpToRandomQuestion() {
  if (!activeQuestions.length) return;
  if (activeQuestions.length === 1) {
    index = 0;
    renderQuestion();
    return;
  }
  let next = index;
  let guard = 0;
  while (next === index && guard < 20) {
    next = Math.floor(Math.random() * activeQuestions.length);
    guard += 1;
  }
  index = next;
  renderQuestion();
}

function renderQuestion() {
  const q = activeQuestions[index];
  answered = false;

  const total = activeQuestions.length;
  const pct = ((index + 1) / total) * 100;
  els.progress.style.width = `${pct}%`;
  if (els.official) els.official.textContent = formatQuestionOfficialMeta(q);
  els.counter.textContent = t("sessionCounter", index + 1, total);
  updateQuestionAnsweredBadge(q);
  const deQ =
    typeof window.getDeQuestionForPeek === "function"
      ? window.getDeQuestionForPeek(q)
      : null;
  if (typeof window.fillDePeek === "function") {
    window.fillDePeek(els.text, q.text, deQ?.text || "");
  } else {
    els.text.textContent = q.text;
  }

  applyQuestionMedia(
    { image: els.image, video: els.video, wrap: els.mediaWrap },
    q
  );

  renderQuestionAnswers(els.options, q, {
    inputName: "answer",
    deQ,
    onChange: (input, label) => {
      if (answered) return;
      if (input.type === "text") {
        label.classList.toggle("selected", Boolean(input.value.trim()));
      } else {
        label.classList.toggle("selected", input.checked);
      }
    },
  });
  syncCheckButtonVisibility(els.checkBtn, q);
  bindAnswerInputSync(els.options, els.checkBtn);

  els.feedback.className = "feedback hidden";
  els.feedback.innerHTML = "";
  if (hasAnswerInputs(q)) {
    els.checkBtn.classList.remove("hidden");
  }
  els.nextBtn.classList.add("hidden");
}

function checkAnswer() {
  const q = activeQuestions[index];
  const selected = getSelected();
  if (selected.length === 0) {
    els.feedback.className = "feedback bad";
    els.feedback.classList.remove("hidden");
    els.feedback.innerHTML = `<strong>${t(isFreeTextQuestion(q) ? "enterAnswer" : "pickAnswer")}</strong>`;
    return;
  }

  answered = true;
  const correct = compareAnswerSets(selected, q.correct);
  if (correct) score += 1;
  if (topicId) {
    if (correct) markQuestionCorrect(topicId, q.id);
    else markQuestionWrong(topicId, q.id);
    updateQuizMasteryBar();
  }

  applyAnswerCheckedStyles(els.options, q, selected);

  els.feedback.classList.remove("hidden");
  if (correct) {
    els.feedback.className = "feedback ok";
    els.feedback.innerHTML = `<strong>${t("correct")}</strong>`;
  } else {
    els.feedback.className = "feedback bad";
    els.feedback.innerHTML = `<strong>${t("wrong")}</strong><p>${t("correctLabel")} ${formatCorrectAnswers(q)}</p>`;
  }

  const explanation = q.explanation || q.comment;
  if (explanation) {
    const expl = document.createElement("p");
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
    els.feedback.appendChild(expl);
  }

  els.checkBtn.classList.add("hidden");
  els.nextBtn.classList.remove("hidden");
  els.nextBtn.textContent =
    index + 1 >= activeQuestions.length ? t("showResult") : t("nextQuestion");
  updateQuestionAnsweredBadge(q);
}

function showResult() {
  const total = activeQuestions.length;
  const pct = Math.round((score / total) * 100);
  els.resultTitle.textContent = getTopicDisplayTitle(topic).document;
  els.resultScore.textContent = `${score} / ${total} (${pct}%)`;
  showScreen("result");
}

function nextQuestion() {
  if (index + 1 >= activeQuestions.length) {
    showResult();
    return;
  }
  index += 1;
  renderQuestion();
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

function applyPageCopy() {
  applyDocumentLang();
  const back = document.getElementById("back-link");
  if (back) {
    back.textContent = `← ${t("allTopics")}`;
    back.href = localizedHref("index.html");
  }
  els.checkBtn.textContent = t("checkAnswer");
  if (els.randomBtn) els.randomBtn.textContent = t("randomQuestion");
  const allTopicsLink = document.querySelector("#result a.btn-secondary");
  if (allTopicsLink) {
    allTopicsLink.textContent = t("allTopics");
    allTopicsLink.href = localizedHref("index.html");
  }
  els.restartBtn.textContent = t("practiceAgain");
  if (els.modeQuiz) els.modeQuiz.textContent = t("modeQuiz");
  if (els.modeList) els.modeList.textContent = t("modeList");
  if (els.modeProgress) els.modeProgress.textContent = t("modeProgress");
  const progressHeading = document.getElementById("progress-heading");
  if (progressHeading) progressHeading.textContent = t("progressHeading");
  if (els.chapterLabel) els.chapterLabel.textContent = t("quizChapterLabel");
  applySiteDisclaimer();
}

document.addEventListener("DOMContentLoaded", async () => {
  applyPageCopy();
  initLangSwitcher();

  els.checkBtn.addEventListener("click", checkAnswer);
  els.nextBtn.addEventListener("click", nextQuestion);
  if (els.randomBtn) els.randomBtn.addEventListener("click", jumpToRandomQuestion);
  els.restartBtn.addEventListener("click", () => {
    index = 0;
    score = 0;
    setMode("quiz");
    renderQuestion();
  });

  if (els.chapterSelect) {
    els.chapterSelect.addEventListener("change", onChapterChange);
  }

  try {
    topic = await loadTopic();
    if (!topic.questions?.length) {
      throw new Error(getLang() === "ru" ? t("ruTopicEmpty") : t("topicEmpty"));
    }
    allQuestions = topic.questions.slice();
    applyChapterFilter();
    const topicTitle = getTopicDisplayTitle(topic);
    document.title = `${topicTitle.document} – ${t("siteTitle")}`;
    applyTopicHeading(els.title, topic);
    els.loading.textContent = t("questionsLoading");
    initChapterSelector();
    if (typeof window.initQuestionList === "function") {
      window.initQuestionList(topic);
    }
    if (typeof window.initProgressView === "function") {
      window.initProgressView({ ...topic, questions: allQuestions }, topicId);
    }
    updateQuizMasteryBar();
    window.addEventListener("fuehrershein-progress", updateQuizMasteryBar);
    initModeTabs();
    if (currentMode === "quiz") {
      renderQuestion();
    }
  } catch (err) {
    showScreen("loading");
    els.loading.textContent = err.message;
  }
});
