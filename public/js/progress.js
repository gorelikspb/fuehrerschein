/** Per-question progress in localStorage (global across DE/RU). */
const PROGRESS_STORAGE_KEY = "fuehrershein-progress";

function loadProgressStore() {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgressStore(store) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
}

function getQuestionRecord(topicId, questionId) {
  const store = loadProgressStore();
  return store[topicId]?.[questionId] ?? null;
}

/**
 * @param {'correct'|'wrong'} status
 */
function setQuestionRecord(topicId, questionId, status) {
  const store = loadProgressStore();
  if (!store[topicId]) store[topicId] = {};
  const prev = store[topicId][questionId];
  const attempts = (prev?.attempts ?? 0) + 1;
  store[topicId][questionId] = { status, attempts, answered: true };
  saveProgressStore(store);
  window.dispatchEvent(
    new CustomEvent("fuehrershein-progress", {
      detail: { topicId, questionId, status },
    })
  );
}

function markQuestionCorrect(topicId, questionId) {
  setQuestionRecord(topicId, questionId, "correct");
}

function markQuestionWrong(topicId, questionId) {
  setQuestionRecord(topicId, questionId, "wrong");
}

function markQuestionKnown(topicId, questionId) {
  markQuestionCorrect(topicId, questionId);
}

function resetTopicProgress(topicId) {
  const store = loadProgressStore();
  delete store[topicId];
  saveProgressStore(store);
  window.dispatchEvent(
    new CustomEvent("fuehrershein-progress", { detail: { topicId, reset: true } })
  );
}

function countTopicSolved(topicId) {
  const store = loadProgressStore();
  const topic = store[topicId];
  if (!topic) return 0;
  return Object.values(topic).filter((r) => r.status === "correct").length;
}

function getTopicProgressStats(topicId, questions) {
  const total = questions.length;
  let solved = 0;
  let wrong = 0;
  for (const q of questions) {
    const rec = getQuestionRecord(topicId, q.id);
    if (rec?.status === "correct") solved += 1;
    else if (rec?.status === "wrong") wrong += 1;
  }
  const unseen = total - solved - wrong;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return { total, solved, wrong, unseen, pct };
}

function chapterNumberFromQuestion(q) {
  if (q.chapterNumber) return q.chapterNumber;
  const match = q.id && q.id.match(/^(\d+\.\d+\.\d+)/);
  return match ? match[1] : "";
}

function compareChapterNumbers(a, b) {
  const parts = (value) => value.split(".").map((part) => parseInt(part, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function progressGroupByChapter(questions) {
  const map = new Map();
  for (const q of questions) {
    const num = chapterNumberFromQuestion(q);
    const key = num || (q.chapterName || q.chapter || "other").toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        chapterNumber: num,
        chapterName: q.chapterName || q.chapter || "",
        chapterDisplay: q.chapter || q.chapterName || "",
        questions: [],
      });
    }
    map.get(key).questions.push(q);
  }
  return [...map.values()].sort((a, b) => {
    if (a.chapterNumber && b.chapterNumber) {
      return compareChapterNumbers(a.chapterNumber, b.chapterNumber);
    }
    return (a.chapterName || "").localeCompare(b.chapterName || "", "de");
  });
}

function chapterProgressLabel(group) {
  if (getLang() === "ru" && group.chapterDisplay) return group.chapterDisplay;
  if (group.chapterNumber && group.chapterName) {
    return t("chapterHeading", group.chapterNumber, group.chapterName);
  }
  return group.chapterName || group.chapterDisplay || group.chapterNumber;
}

function getChapterProgressStats(topicId, questions) {
  return progressGroupByChapter(questions).map((group) => ({
    chapter: chapterProgressLabel(group),
    ...getTopicProgressStats(topicId, group.questions),
  }));
}

function getTopicPercent(topicId, questionCount) {
  if (!questionCount) return 0;
  return Math.round((countTopicSolved(topicId) / questionCount) * 100);
}

function isQuestionSolved(topicId, questionId) {
  return getQuestionRecord(topicId, questionId)?.status === "correct";
}

/** Any quiz attempt (correct or wrong). */
function isQuestionAnswered(topicId, questionId) {
  const rec = getQuestionRecord(topicId, questionId);
  return rec?.answered === true || rec?.status === "correct" || rec?.status === "wrong";
}

function getQuestionStatus(topicId, questionId) {
  return getQuestionRecord(topicId, questionId)?.status ?? "unseen";
}

function listWrongQuestionRefs() {
  const store = loadProgressStore();
  const refs = [];
  for (const [topicId, questions] of Object.entries(store)) {
    for (const [questionId, rec] of Object.entries(questions)) {
      if (rec?.status === "wrong") {
        refs.push({ topicId, questionId });
      }
    }
  }
  return refs;
}

function countWrongQuestions() {
  return listWrongQuestionRefs().length;
}

function resetAllProgress() {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("fuehrershein-progress", { detail: { resetAll: true } }));
}
