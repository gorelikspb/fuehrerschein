/** Repeat questions previously answered wrong (from progress store). */
let questions = [];
let index = 0;
let score = 0;
let answered = false;

const els = {
  loading: document.getElementById("review-loading"),
  empty: document.getElementById("review-empty"),
  emptyText: document.getElementById("review-empty-text"),
  emptyLink: document.getElementById("review-empty-link"),
  quiz: document.getElementById("review-quiz"),
  result: document.getElementById("review-result"),
  progressFill: document.getElementById("review-progress-fill"),
  official: document.getElementById("review-official"),
  counter: document.getElementById("review-counter"),
  image: document.getElementById("review-image"),
  video: document.getElementById("review-video"),
  mediaWrap: document.getElementById("review-media-wrap"),
  text: document.getElementById("review-text"),
  options: document.getElementById("review-options"),
  feedback: document.getElementById("review-feedback"),
  checkBtn: document.getElementById("review-check-btn"),
  nextBtn: document.getElementById("review-next-btn"),
  resultTitle: document.getElementById("review-result-title"),
  resultScore: document.getElementById("review-result-score"),
  restartBtn: document.getElementById("review-restart-btn"),
};

function showScreen(name) {
  els.loading?.classList.toggle("hidden", name !== "loading");
  els.empty?.classList.toggle("hidden", name !== "empty");
  els.quiz?.classList.toggle("hidden", name !== "quiz");
  els.result?.classList.toggle("hidden", name !== "result");
}

function setsEqual(a, b) {
  if (a.length !== b.length) return false;
  return [...a].sort().join(",") === [...b].sort().join(",");
}

function getSelected() {
  return [...els.options.querySelectorAll("input:checked")].map((el) => el.value);
}

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadWrongQuestions() {
  const refs = listWrongQuestionRefs();
  if (!refs.length) return [];

  const byTopic = new Map();
  for (const ref of refs) {
    if (!byTopic.has(ref.topicId)) byTopic.set(ref.topicId, new Set());
    byTopic.get(ref.topicId).add(ref.questionId);
  }

  const loaded = await Promise.all(
    [...byTopic.entries()].map(async ([topicId, idSet]) => {
      const res = await fetch(dataUrl(`${encodeURIComponent(topicId)}.json`));
      if (!res.ok) return [];
      const data = await res.json();
      return (data.questions || [])
        .filter((q) => idSet.has(q.id))
        .map((q) => ({ ...q, topicId }));
    })
  );

  return shuffle(loaded.flat());
}

function renderQuestion() {
  const q = questions[index];
  answered = false;
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

  els.options.innerHTML = "";
  const multiple = q.correct.length > 1;
  for (const opt of q.options) {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = multiple ? "checkbox" : "radio";
    input.name = "review-answer";
    input.value = opt.id;
    const span = document.createElement("span");
    const deOptText =
      deQ && typeof window.getDeOptionTextForPeek === "function"
        ? window.getDeOptionTextForPeek(deQ, opt.id)
        : "";
    buildOptionLabel(span, opt, deOptText);
    label.append(input, span);
    label.addEventListener("change", () => {
      if (!answered) label.classList.toggle("selected", input.checked);
    });
    els.options.appendChild(label);
  }

  els.feedback.className = "feedback hidden";
  els.feedback.innerHTML = "";
  els.checkBtn.classList.remove("hidden");
  els.checkBtn.disabled = false;
  els.nextBtn.classList.add("hidden");
}

function checkAnswer() {
  const q = questions[index];
  const selected = getSelected();
  if (!selected.length) {
    els.feedback.className = "feedback bad";
    els.feedback.innerHTML = `<strong>${t("pickAnswer")}</strong>`;
    els.feedback.classList.remove("hidden");
    return;
  }

  answered = true;
  const correct = setsEqual(selected, q.correct);
  if (correct) score += 1;
  if (q.topicId) {
    if (correct) markQuestionCorrect(q.topicId, q.id);
    else markQuestionWrong(q.topicId, q.id);
  }

  for (const label of els.options.querySelectorAll(".option")) {
    const input = label.querySelector("input");
    label.classList.add("disabled");
    const id = input.value;
    if (q.correct.includes(id)) label.classList.add("correct");
    else if (input.checked) label.classList.add("wrong");
  }

  els.feedback.classList.remove("hidden");
  if (correct) {
    els.feedback.className = "feedback ok";
    els.feedback.innerHTML = `<strong>${t("correct")}</strong>`;
  } else {
    const correctText = q.correct
      .map((id) => {
        const opt = q.options.find((o) => o.id === id);
        return opt ? `${id}. ${opt.text}` : id;
      })
      .join("<br>");
    els.feedback.className = "feedback bad";
    els.feedback.innerHTML = `<strong>${t("wrong")}</strong><p>${t("correctLabel")} ${correctText}</p>`;
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
    index + 1 >= questions.length ? t("showResult") : t("nextQuestion");
}

function showResult() {
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  els.resultTitle.textContent = t("reviewResultTitle");
  els.resultScore.textContent = `${score} / ${total} (${pct}%)`;
  showScreen("result");
}

function applyPageCopy() {
  applyDocumentLang();
  document.title = `${t("reviewPageTitle")} – ${t("siteTitle")}`;
  const back = document.getElementById("back-link");
  if (back) {
    back.textContent = `← ${t("allTopics")}`;
    back.href = localizedHref("index.html");
  }
  const title = document.getElementById("review-page-title");
  if (title) title.textContent = t("reviewPageTitle");
  if (els.checkBtn) els.checkBtn.textContent = t("checkAnswer");
  if (els.restartBtn) els.restartBtn.textContent = t("reviewRestart");
  const home = document.getElementById("review-home-btn");
  if (home) {
    home.textContent = t("allTopics");
    home.href = localizedHref("index.html");
  }
}

function initLangSwitcher() {
  const btn = document.getElementById("lang-switch");
  if (!btn) return;
  btn.textContent = t("langSwitch");
  btn.title = t("langSwitchTitle");
  btn.addEventListener("click", () => setLang(getLang() === "ru" ? "de" : "ru"));
}

async function preloadDePeek() {
  if (getLang() !== "ru" || typeof window.loadDePeekForTopics !== "function") return;
  const topicIds = [...new Set(questions.map((q) => q.topicId).filter(Boolean))];
  await window.loadDePeekForTopics(topicIds);
}

document.addEventListener("DOMContentLoaded", async () => {
  applyPageCopy();
  initLangSwitcher();

  if (els.loading) els.loading.textContent = t("reviewLoading");
  showScreen("loading");

  els.checkBtn?.addEventListener("click", checkAnswer);
  els.nextBtn?.addEventListener("click", () => {
    if (index + 1 >= questions.length) showResult();
    else {
      index += 1;
      renderQuestion();
    }
  });
  els.restartBtn?.addEventListener("click", async () => {
    questions = await loadWrongQuestions();
    if (!questions.length) {
      showScreen("empty");
      return;
    }
    index = 0;
    score = 0;
    showScreen("quiz");
    renderQuestion();
  });

  try {
    questions = await loadWrongQuestions();
    if (!questions.length) {
      if (els.emptyText) els.emptyText.textContent = t("reviewEmpty");
      if (els.emptyLink) {
        els.emptyLink.textContent = t("allTopics");
        els.emptyLink.href = localizedHref("index.html");
      }
      showScreen("empty");
      return;
    }
    await preloadDePeek();
    showScreen("quiz");
    renderQuestion();
  } catch (err) {
    if (els.loading) els.loading.textContent = err.message;
  }
});
