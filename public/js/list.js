/** All-questions list view for a topic, one chapter per page. */

(function () {
  let topic = null;
  let filterQuery = "";
  let chapterGroups = [];
  let currentChapterIndex = 0;
  let viewedObserver = null;
  /** Question IDs already viewed in localStorage when this page session started. */
  let viewedAtSessionStart = new Set();
  let shouldScrollToQuestionHash = false;

  const els = {
    section: document.getElementById("list-view"),
    search: document.getElementById("list-search"),
    searchLabel: document.getElementById("list-search-label"),
    count: document.getElementById("list-count"),
    container: document.getElementById("list-questions"),
    empty: document.getElementById("list-empty"),
    chapterNav: document.getElementById("list-chapter-nav"),
    chapterNavLabel: document.getElementById("list-chapter-nav-label"),
    chapterPosition: document.getElementById("list-chapter-position"),
    chapterTitle: document.getElementById("list-chapter-title"),
    chapterSelectLabel: document.getElementById("list-chapter-select-label"),
    chapterSelect: document.getElementById("list-chapter-select"),
    chapterPrev: document.getElementById("list-chapter-prev"),
    chapterNext: document.getElementById("list-chapter-next"),
    chapterProgress: document.getElementById("list-chapter-progress"),
    goNextChapter: document.getElementById("list-go-next-chapter"),
  };

  function chapterNumberFromQuestion(q) {
    if (q.chapterNumber) return q.chapterNumber;
    const match = q.id && q.id.match(/^(\d+\.\d+\.\d+)/);
    return match ? match[1] : "";
  }

  function chapterGroupKey(q) {
    const num = chapterNumberFromQuestion(q);
    if (num) return num;
    return (q.chapterName || q.chapter || "other").toLowerCase();
  }

  function compareChapterNumbers(a, b) {
    const parts = (value) =>
      value.split(".").map((part) => parseInt(part, 10) || 0);
    const pa = parts(a);
    const pb = parts(b);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function chapterHeading(group) {
    if (getLang() === "ru" && group.chapterDisplay) {
      return group.chapterDisplay;
    }
    if (group.chapterNumber && group.chapterName) {
      return t("chapterHeading", group.chapterNumber, group.chapterName);
    }
    return group.chapterName || group.chapterDisplay || group.chapterNumber;
  }

  function chapterOptionLabel(group) {
    return `${chapterHeading(group)} (${group.items.length})`;
  }

  function groupByChapter(items) {
    const groups = new Map();
    for (const entry of items) {
      const key = chapterGroupKey(entry.q);
      if (!groups.has(key)) {
        const num = chapterNumberFromQuestion(entry.q);
        groups.set(key, {
          chapterNumber: num,
          chapterName: entry.q.chapterName || entry.q.chapter || "",
          chapterDisplay: entry.q.chapter || entry.q.chapterName || "",
          items: [],
        });
      }
      groups.get(key).items.push(entry);
    }
    return [...groups.values()].sort((a, b) => {
      if (a.chapterNumber && b.chapterNumber) {
        return compareChapterNumbers(a.chapterNumber, b.chapterNumber);
      }
      return (a.chapterName || "").localeCompare(b.chapterName || "", "de");
    });
  }

  function rebuildChapterGroups() {
    if (!topic) {
      chapterGroups = [];
      return;
    }
    const items = topic.questions.map((q, i) => ({ q, i }));
    chapterGroups = groupByChapter(items);
  }

  function getChapterIndexFromUrl() {
    if (!chapterGroups.length) return 0;
    const params = new URLSearchParams(window.location.search);
    const chapterParam = params.get("chapter");
    if (chapterParam) {
      const idx = chapterGroups.findIndex((g) => g.chapterNumber === chapterParam);
      if (idx >= 0) return idx;
    }
    const pageParam = parseInt(params.get("page"), 10);
    if (Number.isFinite(pageParam) && pageParam >= 1 && pageParam <= chapterGroups.length) {
      return pageParam - 1;
    }
    return 0;
  }

  function persistLastRead(overrides = {}) {
    if (!topic?.id || typeof saveLastReadPosition !== "function") return;
    const group = chapterGroups[currentChapterIndex];
    const pos = { topicId: topic.id, updatedAt: Date.now() };
    if (group?.chapterNumber) pos.chapter = group.chapterNumber;
    else if (chapterGroups.length > 1) pos.page = currentChapterIndex + 1;
    if (group?.chapterName) pos.chapterName = group.chapterName;
    if (overrides.questionId) pos.questionId = overrides.questionId;
    saveLastReadPosition(pos);
  }

  function scrollToQuestionHash() {
    const raw = window.location.hash.slice(1);
    if (!raw || !els.container) return;
    const id = decodeURIComponent(raw);
    const card = els.container.querySelector(
      `.list-question[data-question-id="${CSS.escape(id)}"]`
    );
    if (!card) return;
    const header = card.querySelector(".list-question-header");
    const toggle = card.querySelector(".list-question-toggle");
    setQuestionCollapsed(card, header, toggle, false);
    requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function setChapterInUrl(index) {
    const url = new URL(window.location.href);
    const group = chapterGroups[index];
    if (chapterGroups.length > 1 && group?.chapterNumber) {
      url.searchParams.set("chapter", group.chapterNumber);
      url.searchParams.delete("page");
    } else if (chapterGroups.length > 1) {
      url.searchParams.set("page", String(index + 1));
      url.searchParams.delete("chapter");
    } else {
      url.searchParams.delete("chapter");
      url.searchParams.delete("page");
    }
    history.replaceState(null, "", url.toString());
  }

  function questionMatches(q, query) {
    if (!query) return true;
    const haystack = [
      q.id,
      q.text,
      q.chapter || "",
      q.chapterName || "",
      q.chapterNumber || "",
      ...(q.options || []).map((o) => `${o.id} ${o.text}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function buildOption(opt, correctIds, deQuestion) {
    const li = document.createElement("li");
    li.className = "list-option";
    if (correctIds.includes(opt.id)) li.classList.add("correct");
    const mark = correctIds.includes(opt.id) ? "✓ " : "";
    const deOptText =
      deQuestion && typeof window.getDeOptionTextForPeek === "function"
        ? window.getDeOptionTextForPeek(deQuestion, opt.id)
        : "";
    const span = document.createElement("span");
    buildOptionLabel(span, opt, deOptText, mark);
    li.appendChild(span);
    return li;
  }

  const LIST_PREVIEW_MIN_CHARS = 100;
  const LIST_PREVIEW_MAX_CHARS = 280;

  function stripHtmlToPlainText(value) {
    const div = document.createElement("div");
    div.innerHTML = value == null ? "" : String(value);
    return (div.textContent || "").replace(/\s+/g, " ").trim();
  }

  /** Plain-text preview for collapsed header: at least MIN chars when possible, ellipsis if longer. */
  function formatListQuestionPreview(text) {
    const plain = stripHtmlToPlainText(text);
    if (!plain) return "";
    if (plain.length <= LIST_PREVIEW_MAX_CHARS) return plain;
    const sliceAt = Math.max(LIST_PREVIEW_MIN_CHARS, LIST_PREVIEW_MAX_CHARS);
    return `${plain.slice(0, sliceAt).trimEnd()}…`;
  }

  function setQuestionCollapsed(article, header, toggle, collapsed) {
    article.classList.toggle("is-collapsed", collapsed);
    header?.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (toggle) toggle.textContent = collapsed ? "▶" : "▼";
  }

  function buildQuestionCard(q, index) {
    const deQ =
      typeof window.getDeQuestionForPeek === "function"
        ? window.getDeQuestionForPeek(q)
        : null;

    const article = document.createElement("article");
    article.className = "list-question";
    article.dataset.index = String(index);
    if (topic?.id) {
      article.dataset.questionId = q.id;
      if (isQuestionViewed(topic.id, q.id)) {
        article.classList.add("list-question--viewed");
        article.dataset.viewedObserved = "1";
      }
    }

    const header = document.createElement("button");
    header.type = "button";
    header.className = "list-question-header";
    header.setAttribute("aria-expanded", "true");

    const num = document.createElement("span");
    num.className = "list-question-num";
    num.textContent = String(index + 1);

    const meta = document.createElement("span");
    meta.className = "list-question-meta";
    meta.textContent = formatQuestionOfficialMeta(q);
    if (topic?.id) {
      const status = getQuestionStatus(topic.id, q.id);
      if (status === "correct" || status === "wrong") {
        const badge = document.createElement("span");
        badge.className =
          status === "correct"
            ? "question-status-badge question-status-badge--solved"
            : "question-status-badge question-status-badge--answered";
        badge.textContent =
          status === "correct" ? t("questionSolvedBadge") : t("questionAnsweredBadge");
        meta.append(document.createTextNode(" · "), badge);
      }
    }

    const preview = document.createElement("span");
    preview.className = "list-question-preview";
    const previewText = formatListQuestionPreview(q.text);
    if (typeof window.fillDePeek === "function") {
      window.fillDePeek(preview, previewText, deQ?.text || "");
    } else {
      preview.textContent = previewText;
    }

    const toggle = document.createElement("span");
    toggle.className = "list-question-toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.textContent = "▼";

    header.append(num, meta, preview, toggle);

    const body = document.createElement("div");
    body.className = "list-question-body";

    const text = document.createElement("p");
    text.className = "list-question-text";
    if (typeof window.fillDePeek === "function") {
      window.fillDePeek(text, q.text, deQ?.text || "");
    } else {
      text.textContent = q.text;
    }
    body.appendChild(text);

    appendQuestionMediaTo(body, q);

    const options = document.createElement("ul");
    options.className = "list-options";
    for (const opt of q.options) {
      options.appendChild(buildOption(opt, q.correct, deQ));
    }
    body.appendChild(options);

    const explanation = q.explanation || q.comment;
    if (explanation && String(explanation).trim()) {
      const explLabel = document.createElement("p");
      explLabel.className = "list-explanation-label";
      explLabel.textContent = t("listExplanationLabel");
      body.appendChild(explLabel);

      const expl = document.createElement("p");
      expl.className = "list-explanation";
      const deExpl =
        deQ && typeof window.getDeExplanationForPeek === "function"
          ? window.getDeExplanationForPeek(deQ)
          : "";
      if (typeof window.fillDePeek === "function") {
        window.fillDePeek(expl, explanation, deExpl);
      } else {
        expl.textContent = explanation;
      }
      body.appendChild(expl);
    }

    if (topic?.id) {
      const status = getQuestionStatus(topic.id, q.id);
      if (status === "correct") article.classList.add("list-question--solved");
      else if (status === "wrong") article.classList.add("list-question--wrong");
      if (status === "correct" || status === "wrong") {
        article.classList.add("list-question--answered");
      }

      const actions = document.createElement("div");
      actions.className = "list-question-actions";
      const knowBtn = document.createElement("button");
      knowBtn.type = "button";
      knowBtn.className = "btn btn-secondary btn-know";
      knowBtn.textContent = status === "correct" ? t("progressKnown") : t("markKnown");
      knowBtn.disabled = status === "correct";
      knowBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        markQuestionKnown(topic.id, q.id);
        knowBtn.disabled = true;
        knowBtn.textContent = t("progressKnown");
        article.classList.add("list-question--solved");
        article.classList.remove("list-question--wrong");
      });
      actions.appendChild(knowBtn);
      body.appendChild(actions);
    }

    header.addEventListener("click", () => {
      setQuestionCollapsed(article, header, toggle, !article.classList.contains("is-collapsed"));
    });

    const collapseFromPriorSession =
      topic?.id && viewedAtSessionStart.has(q.id);
    setQuestionCollapsed(article, header, toggle, collapseFromPriorSession);

    article.append(header, body);
    return article;
  }

  function captureViewedAtSessionStart() {
    viewedAtSessionStart = new Set();
    if (!topic?.id) return;
    for (const q of topic.questions) {
      if (isQuestionViewed(topic.id, q.id)) {
        viewedAtSessionStart.add(q.id);
      }
    }
  }

  function markVisibleQuestionViewed(article) {
    if (!topic?.id) return;
    const questionId = article.dataset.questionId;
    if (!questionId || article.dataset.viewedObserved === "1") return;
    article.dataset.viewedObserved = "1";
    if (!isQuestionViewed(topic.id, questionId)) {
      if (markQuestionViewed(topic.id, questionId)) {
        article.classList.add("list-question--viewed");
        updateChapterProgressBars();
        updateGoNextChapter();
      }
    }
    persistLastRead({ questionId });
  }

  function disconnectViewedObserver() {
    if (viewedObserver) {
      viewedObserver.disconnect();
      viewedObserver = null;
    }
  }

  function setupViewedObserver() {
    disconnectViewedObserver();
    if (!topic?.id || !els.container) return;
    const cards = els.container.querySelectorAll(".list-question[data-question-id]");
    if (!cards.length) return;
    viewedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            markVisibleQuestionViewed(entry.target);
          }
        }
      },
      { root: null, rootMargin: "0px 0px -15% 0px", threshold: 0.35 }
    );
    for (const card of cards) {
      viewedObserver.observe(card);
    }
  }

  function updateCount(shown, chapterTotal, topicTotal) {
    if (!els.count) return;
    if (chapterGroups.length > 1) {
      els.count.textContent = filterQuery
        ? t("listCountChapterFiltered", shown, chapterTotal)
        : t("listCountChapter", chapterTotal, topicTotal);
    } else {
      els.count.textContent = filterQuery
        ? t("listCountFiltered", shown, topicTotal)
        : t("listCountAll", topicTotal);
    }
  }

  function updateChapterProgressBars() {
    if (!els.chapterProgress || !topic?.id) return;
    const group = chapterGroups[currentChapterIndex];
    if (!group) {
      els.chapterProgress.classList.add("hidden");
      return;
    }
    const questionIds = group.items.map(({ q }) => q);
    const solvedStats = getTopicProgressStats(topic.id, questionIds);
    const viewedStats = getTopicViewedStats(topic.id, questionIds);
    const solvedPct =
      solvedStats.total > 0
        ? Math.round((solvedStats.solved / solvedStats.total) * 100)
        : 0;
    const viewedPct =
      viewedStats.total > 0
        ? Math.round((viewedStats.viewed / viewedStats.total) * 100)
        : 0;

    els.chapterProgress.classList.remove("hidden");
    els.chapterProgress.innerHTML = `
      <div class="list-chapter-progress-row">
        <span class="list-chapter-progress-label">${escapeHtml(t("progressSolvedShort"))}</span>
        <div class="progress-bar progress-bar-chapter progress-bar-solved" role="progressbar" aria-valuenow="${solvedPct}" aria-valuemin="0" aria-valuemax="100">
          <span class="progress-fill progress-fill-solved" style="width:${solvedPct}%"></span>
        </div>
        <span class="list-chapter-progress-count">${escapeHtml(
          t("progressChapterCount", solvedStats.solved, solvedStats.total)
        )}</span>
      </div>
      <div class="list-chapter-progress-row">
        <span class="list-chapter-progress-label">${escapeHtml(t("progressViewedShort"))}</span>
        <div class="progress-bar progress-bar-chapter progress-bar-viewed" role="progressbar" aria-valuenow="${viewedPct}" aria-valuemin="0" aria-valuemax="100">
          <span class="progress-fill progress-fill-viewed" style="width:${viewedPct}%"></span>
        </div>
        <span class="list-chapter-progress-count">${escapeHtml(
          t("progressViewedCount", viewedStats.viewed, viewedStats.total)
        )}</span>
      </div>`;
  }

  function nextChapterHref() {
    if (!topic?.id || currentChapterIndex >= chapterGroups.length - 1) return null;
    const nextGroup = chapterGroups[currentChapterIndex + 1];
    const params = new URLSearchParams();
    params.set("id", topic.id);
    params.set("view", "list");
    if (nextGroup?.chapterNumber) {
      params.set("chapter", nextGroup.chapterNumber);
    } else {
      params.set("page", String(currentChapterIndex + 2));
    }
    return localizedHref(`topic.html?${params.toString()}`);
  }

  function updateGoNextChapter() {
    if (!els.goNextChapter) return;
    const href = nextChapterHref();
    const hasNext = !!href;
    els.goNextChapter.classList.toggle("hidden", !hasNext);
    if (!hasNext) return;
    els.goNextChapter.textContent = t("listGoNextChapter");
    els.goNextChapter.href = href;
  }

  function updateChapterNav() {
    const multi = chapterGroups.length > 1;
    if (els.chapterNav) {
      els.chapterNav.classList.toggle("hidden", !multi);
    }
    if (!multi) {
      updateChapterProgressBars();
      updateGoNextChapter();
      return;
    }

    const group = chapterGroups[currentChapterIndex];
    const chapterNum = currentChapterIndex + 1;
    const totalChapters = chapterGroups.length;

    if (els.chapterPosition) {
      els.chapterPosition.textContent = t("listChapterOf", chapterNum, totalChapters);
    }
    if (els.chapterTitle) {
      els.chapterTitle.textContent = group ? chapterHeading(group) : "";
    }
    if (els.chapterPrev) {
      els.chapterPrev.textContent = t("listChapterPrev");
      els.chapterPrev.disabled = currentChapterIndex <= 0;
    }
    if (els.chapterNext) {
      els.chapterNext.textContent = t("listChapterNext");
      els.chapterNext.disabled = currentChapterIndex >= totalChapters - 1;
    }
    updateChapterProgressBars();
    updateGoNextChapter();
    if (els.chapterSelect) {
      const prevValue = els.chapterSelect.value;
      els.chapterSelect.innerHTML = "";
      chapterGroups.forEach((g, idx) => {
        const opt = document.createElement("option");
        opt.value = g.chapterNumber || String(idx + 1);
        opt.textContent = chapterOptionLabel(g);
        els.chapterSelect.appendChild(opt);
      });
      const nextValue = group?.chapterNumber || String(chapterNum);
      els.chapterSelect.value =
        [...els.chapterSelect.options].some((o) => o.value === nextValue)
          ? nextValue
          : prevValue;
    }
  }

  function goToChapter(index, options = {}) {
    const { updateUrl = true, scroll = true, clearSearch = false } = options;
    if (!chapterGroups.length) return;
    currentChapterIndex = Math.max(0, Math.min(index, chapterGroups.length - 1));
    if (clearSearch && els.search) {
      els.search.value = "";
      filterQuery = "";
    }
    if (updateUrl) setChapterInUrl(currentChapterIndex);
    persistLastRead();
    renderList();
    if (scroll && els.section) {
      els.section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (shouldScrollToQuestionHash) {
      shouldScrollToQuestionHash = false;
      scrollToQuestionHash();
    }
  }

  function renderList() {
    if (!topic || !els.container) return;

    rebuildChapterGroups();
    if (currentChapterIndex >= chapterGroups.length) {
      currentChapterIndex = Math.max(0, chapterGroups.length - 1);
    }

    const query = filterQuery.trim().toLowerCase();
    const group = chapterGroups[currentChapterIndex];
    const chapterItems = group ? group.items : [];
    const filtered = chapterItems.filter(({ q }) => questionMatches(q, query));

    els.container.innerHTML = "";
    const list = document.createElement("div");
    list.className = "list-chapter-questions";
    for (const { q, i } of filtered) {
      list.appendChild(buildQuestionCard(q, i));
    }
    els.container.appendChild(list);

    const topicTotal = topic.questions.length;
    const chapterTotal = chapterItems.length;
    updateCount(filtered.length, chapterTotal, topicTotal);
    updateChapterNav();

    const noResults = filtered.length === 0 && chapterTotal > 0;
    if (els.empty) {
      els.empty.classList.toggle("hidden", !noResults);
      els.empty.textContent = noResults ? t("listNoResults") : "";
    }
    els.container.classList.toggle("hidden", noResults);
    setupViewedObserver();
    updateGoNextChapter();
    if (shouldScrollToQuestionHash) {
      shouldScrollToQuestionHash = false;
      scrollToQuestionHash();
    }
  }

  function applyListCopy() {
    const multi = chapterGroups.length > 1;
    if (els.search) {
      els.search.placeholder = multi
        ? t("listSearchInChapterPlaceholder")
        : t("listSearchPlaceholder");
    }
    if (els.searchLabel) {
      els.searchLabel.textContent = multi
        ? t("listSearchInChapterLabel")
        : t("listSearchLabel");
    }
    if (els.empty) {
      els.empty.textContent = t("listNoResults");
    }
    if (els.chapterNavLabel) {
      els.chapterNavLabel.textContent = t("listChapterNavLabel");
    }
    if (els.chapterSelectLabel) {
      els.chapterSelectLabel.textContent = t("listChapterSelectLabel");
    }
    updateChapterNav();
    updateGoNextChapter();
  }

  function bindSearch() {
    if (!els.search) return;
    let timer = null;
    els.search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        filterQuery = els.search.value;
        renderList();
      }, 150);
    });
  }

  function bindChapterNav() {
    if (els.chapterPrev) {
      els.chapterPrev.addEventListener("click", () => {
        if (currentChapterIndex > 0) {
          goToChapter(currentChapterIndex - 1, { clearSearch: true });
        }
      });
    }
    if (els.chapterNext) {
      els.chapterNext.addEventListener("click", () => {
        if (currentChapterIndex < chapterGroups.length - 1) {
          goToChapter(currentChapterIndex + 1, { clearSearch: true });
        }
      });
    }
    if (els.chapterSelect) {
      els.chapterSelect.addEventListener("change", () => {
        const value = els.chapterSelect.value;
        const idx = chapterGroups.findIndex(
          (g, i) =>
            g.chapterNumber === value || String(i + 1) === value
        );
        if (idx >= 0 && idx !== currentChapterIndex) {
          goToChapter(idx, { clearSearch: true });
        }
      });
    }
  }

  window.initQuestionList = function (topicData) {
    topic = topicData;
    captureViewedAtSessionStart();
    rebuildChapterGroups();
    currentChapterIndex = getChapterIndexFromUrl();
    shouldScrollToQuestionHash = !!window.location.hash.slice(1);
    applyListCopy();
    bindSearch();
    bindChapterNav();
    persistLastRead();
    renderList();
  };

  window.addEventListener("popstate", () => {
    if (!topic) return;
    const idx = getChapterIndexFromUrl();
    if (idx !== currentChapterIndex) {
      currentChapterIndex = idx;
      if (els.search) {
        els.search.value = "";
        filterQuery = "";
      }
      persistLastRead();
      renderList();
    }
  });

  window.refreshQuestionList = function () {
    applyListCopy();
    renderList();
  };

  window.getChapterGroups = function (topicData) {
    const items = topicData.questions.map((q, i) => ({ q, i }));
    return groupByChapter(items);
  };

  window.addEventListener("fuehrershein-progress", () => {
    if (topic) renderList();
  });

  window.addEventListener("fuehrershein-viewed", () => {
    if (topic) {
      updateChapterProgressBars();
      updateGoNextChapter();
    }
  });
})();
