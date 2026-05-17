/** Exam history in localStorage; official pass via scoreExamAnswers / entry.passed. */
const EXAM_HISTORY_KEY = "fuehrershein-exams";

function loadExamHistory() {
  try {
    const raw = localStorage.getItem(EXAM_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveExamHistory(history) {
  localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

/**
 * @param {{ passed: boolean, faultPoints: number, wrongCount: number, fivePointWrong: number, questionCount: number }} result
 */
function recordExamResult(result) {
  const entry = {
    date: new Date().toISOString(),
    passed: !!result.passed,
    faultPoints: result.faultPoints ?? 0,
    wrongCount: result.wrongCount ?? 0,
    fivePointWrong: result.fivePointWrong ?? 0,
    questionCount: result.questionCount ?? 30,
  };
  const history = loadExamHistory();
  history.unshift(entry);
  saveExamHistory(history);
  window.dispatchEvent(new CustomEvent("fuehrershein-exam", { detail: entry }));
  return entry;
}

function clearExamHistory() {
  localStorage.removeItem(EXAM_HISTORY_KEY);
  window.dispatchEvent(new CustomEvent("fuehrershein-exam", { detail: { cleared: true } }));
}

function getExamCountTaken() {
  return loadExamHistory().length;
}

/** Passed by TÜV rules: ≤10 fault points and fewer than 2 wrong 5-point questions. */
function getExamCountPassed() {
  return loadExamHistory().filter((entry) => entry.passed).length;
}

function setsEqualAnswers(selected, correct) {
  if (typeof compareAnswerSets === "function") {
    return compareAnswerSets(selected, correct);
  }
  if (selected.length !== correct.length) return false;
  const sa = [...selected].sort().join(",");
  const sb = [...correct].sort().join(",");
  return sa === sb;
}

/**
 * @param {Array<{ id: string, correct: string[], points?: number }>} questions
 * @param {Record<string, string[]>} answersByQuestionId
 */
function scoreExamAnswers(questions, answersByQuestionId) {
  let faultPoints = 0;
  let wrongCount = 0;
  let fivePointWrong = 0;

  for (const q of questions) {
    const selected = answersByQuestionId[q.id] || [];
    if (setsEqualAnswers(selected, q.correct)) continue;
    wrongCount += 1;
    const pts = q.points > 0 ? q.points : 2;
    faultPoints += pts;
    if (pts === 5) fivePointWrong += 1;
  }

  const passed = faultPoints <= 10 && fivePointWrong < 2;
  return { faultPoints, wrongCount, fivePointWrong, passed };
}
