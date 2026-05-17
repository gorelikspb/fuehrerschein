/** Progress tab UI for a topic. */
(function () {
  let topic = null;
  let topicId = null;

  const els = {
    section: document.getElementById("progress-view"),
    overallBar: document.getElementById("progress-overall-bar"),
    overallFill: document.getElementById("progress-overall-fill"),
    overallText: document.getElementById("progress-overall-text"),
    chapters: document.getElementById("progress-chapters"),
    resetBtn: document.getElementById("progress-reset-btn"),
  };

  function renderBar(fillEl, pct) {
    if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  function buildChapterRow(ch) {
    const row = document.createElement("div");
    row.className = "progress-chapter";

    const head = document.createElement("div");
    head.className = "progress-chapter-head";
    const title = document.createElement("span");
    title.className = "progress-chapter-title";
    title.textContent = ch.chapter;
    const count = document.createElement("span");
    count.className = "progress-chapter-count";
    count.textContent = t("progressChapterCount", ch.solved, ch.total);
    head.appendChild(title);
    head.appendChild(count);

    const bar = document.createElement("div");
    bar.className = "progress-bar progress-bar-chapter";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuenow", String(ch.pct));
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    const fill = document.createElement("span");
    fill.className = "progress-fill";
    const pct = ch.total > 0 ? Math.round((ch.solved / ch.total) * 100) : 0;
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    row.appendChild(head);
    row.appendChild(bar);
    return row;
  }

  function render() {
    if (!topic || !topicId || !els.section) return;

    const stats = getTopicProgressStats(topicId, topic.questions);
    const pct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

    if (els.overallText) {
      els.overallText.textContent = t("progressOverall", stats.solved, stats.total);
    }
    if (els.overallBar) {
      els.overallBar.setAttribute("aria-valuenow", String(pct));
    }
    renderBar(els.overallFill, pct);

    if (els.chapters) {
      els.chapters.innerHTML = "";
      const chapters = getChapterProgressStats(topicId, topic.questions);
      const fragment = document.createDocumentFragment();
      for (const ch of chapters) {
        fragment.appendChild(buildChapterRow(ch));
      }
      els.chapters.appendChild(fragment);
    }
  }

  let resetBound = false;

  function bindReset() {
    if (!els.resetBtn || resetBound) return;
    resetBound = true;
    els.resetBtn.addEventListener("click", () => {
      if (!topicId) return;
      if (!window.confirm(t("progressResetConfirm"))) return;
      resetTopicProgress(topicId);
      render();
      if (typeof window.updateQuizMasteryBar === "function") {
        window.updateQuizMasteryBar();
      }
      if (typeof window.refreshQuestionList === "function") {
        window.refreshQuestionList();
      }
    });
  }

  window.initProgressView = function (topicData, id) {
    topic = topicData;
    topicId = id;
    const heading = document.getElementById("progress-heading");
    if (heading) heading.textContent = t("progressHeading");
    if (els.resetBtn) els.resetBtn.textContent = t("progressReset");
    render();
    bindReset();
  };

  window.refreshProgressView = function () {
    if (els.resetBtn) els.resetBtn.textContent = t("progressReset");
    render();
  };

  window.addEventListener("fuehrershein-progress", () => {
    if (topic) render();
  });
})();
