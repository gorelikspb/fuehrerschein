/** Inline peek at original German text while studying in Russian. */
(function () {
  let deQuestionsById = null;
  let popoverEl = null;
  let openTrigger = null;
  let hoverCloseTimer = null;

  function isPeekEnabled() {
    return getLang() === "ru";
  }

  function deTopicUrl(topicId) {
    return `data/${encodeURIComponent(topicId)}.json`;
  }

  async function loadDeTopic(topicId, merge = false) {
    if (!merge) deQuestionsById = null;
    if (!isPeekEnabled() || !topicId) return;

    try {
      const res = await fetch(deTopicUrl(topicId));
      if (!res.ok) {
        if (!deQuestionsById) deQuestionsById = new Map();
        return;
      }
      const data = await res.json();
      if (!deQuestionsById) deQuestionsById = new Map();
      for (const q of data.questions || []) {
        deQuestionsById.set(q.id, q);
      }
    } catch {
      if (!deQuestionsById) deQuestionsById = new Map();
    }
  }

  async function loadDePeekForTopics(topicIds) {
    if (!isPeekEnabled() || !topicIds?.length) return;
    deQuestionsById = new Map();
    for (const topicId of topicIds) {
      await loadDeTopic(topicId, true);
    }
  }

  function getDeQuestion(ruQuestion) {
    if (!deQuestionsById || !ruQuestion?.id) return null;
    return deQuestionsById.get(ruQuestion.id) || null;
  }

  function getDeOptionText(deQuestion, optionId) {
    if (!deQuestion?.options) return "";
    const opt = deQuestion.options.find((o) => o.id === optionId);
    return opt?.text || "";
  }

  function getDeExplanation(deQuestion) {
    if (!deQuestion) return "";
    return deQuestion.explanation || deQuestion.comment || "";
  }

  function ensurePopover() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement("div");
    popoverEl.className = "de-peek-popover";
    popoverEl.setAttribute("role", "tooltip");
    popoverEl.hidden = true;
    document.body.appendChild(popoverEl);

    popoverEl.addEventListener("mouseenter", () => {
      clearTimeout(hoverCloseTimer);
    });
    popoverEl.addEventListener("mouseleave", () => {
      scheduleHidePopover();
    });

    document.addEventListener("click", (e) => {
      if (!openTrigger) return;
      if (openTrigger.contains(e.target) || popoverEl.contains(e.target)) return;
      hidePopover();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hidePopover();
    });

    window.addEventListener(
      "scroll",
      () => {
        if (openTrigger) positionPopover(openTrigger);
      },
      true
    );
    window.addEventListener("resize", () => {
      if (openTrigger) positionPopover(openTrigger);
    });

    return popoverEl;
  }

  function positionPopover(trigger) {
    const pop = ensurePopover();
    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const gap = 6;

    pop.style.left = "0";
    pop.style.top = "0";
    pop.style.maxWidth = `${Math.min(360, window.innerWidth - margin * 2)}px`;

    const popRect = pop.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + gap;

    if (left + popRect.width > window.innerWidth - margin) {
      left = window.innerWidth - margin - popRect.width;
    }
    if (left < margin) left = margin;

    if (top + popRect.height > window.innerHeight - margin) {
      top = rect.top - gap - popRect.height;
    }
    if (top < margin) top = margin;

    pop.style.position = "fixed";
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function showPopover(trigger, deText) {
    if (!deText) return;
    const pop = ensurePopover();
    const label = t("dePeekLabel");

    pop.innerHTML = "";
    const labelEl = document.createElement("span");
    labelEl.className = "de-peek-popover-label";
    labelEl.textContent = label;
    const body = document.createElement("p");
    body.className = "de-peek-popover-text";
    body.textContent = deText;
    pop.append(labelEl, body);

    pop.hidden = false;
    openTrigger = trigger;
    trigger.classList.add("is-peek-open");
    trigger.setAttribute("aria-expanded", "true");
    positionPopover(trigger);
  }

  function hidePopover() {
    clearTimeout(hoverCloseTimer);
    if (openTrigger) {
      openTrigger.classList.remove("is-peek-open");
      openTrigger.setAttribute("aria-expanded", "false");
      openTrigger = null;
    }
    if (popoverEl) popoverEl.hidden = true;
  }

  function scheduleHidePopover() {
    clearTimeout(hoverCloseTimer);
    hoverCloseTimer = setTimeout(hidePopover, 120);
  }

  function stopAnswerLabelActivation(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function togglePopover(trigger, deText) {
    if (openTrigger === trigger && popoverEl && !popoverEl.hidden) {
      hidePopover();
    } else {
      showPopover(trigger, deText);
    }
  }

  function bindPeekTrigger(trigger, deText) {
    if (!deText) return;

    trigger.setAttribute("aria-label", `${t("dePeekLabel")}: ${deText}`);
    trigger.setAttribute("aria-expanded", "false");
    let skipNextClick = false;
    let openedByFocus = false;

    function activatePopover() {
      if (openedByFocus && openTrigger === trigger && popoverEl && !popoverEl.hidden) {
        openedByFocus = false;
        showPopover(trigger, deText);
        return;
      }
      openedByFocus = false;
      togglePopover(trigger, deText);
    }

    trigger.addEventListener("mouseenter", (e) => {
      if (e.target !== trigger) return;
      clearTimeout(hoverCloseTimer);
      showPopover(trigger, deText);
    });
    trigger.addEventListener("mouseleave", (e) => {
      if (e.relatedTarget && trigger.contains(e.relatedTarget)) return;
      scheduleHidePopover();
    });

    trigger.addEventListener("focus", () => {
      openedByFocus = true;
      showPopover(trigger, deText);
    });
    trigger.addEventListener("blur", () => {
      openedByFocus = false;
      setTimeout(() => {
        if (document.activeElement === trigger) return;
        if (popoverEl && popoverEl.matches(":hover")) return;
        hidePopover();
      }, 0);
    });

    trigger.addEventListener("pointerdown", (e) => {
      skipNextClick = false;
      stopAnswerLabelActivation(e);
    });

    trigger.addEventListener("mousedown", (e) => {
      stopAnswerLabelActivation(e);
    });

    trigger.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      stopAnswerLabelActivation(e);
      activatePopover();
      skipNextClick = true;
    });

    trigger.addEventListener(
      "touchstart",
      (e) => {
        skipNextClick = false;
        stopAnswerLabelActivation(e);
      },
      { passive: false }
    );

    trigger.addEventListener(
      "touchend",
      (e) => {
        stopAnswerLabelActivation(e);
        if (skipNextClick) return;
        activatePopover();
        skipNextClick = true;
      },
      { passive: false }
    );

    trigger.addEventListener("click", (e) => {
      stopAnswerLabelActivation(e);
      if (skipNextClick) {
        skipNextClick = false;
        return;
      }
      activatePopover();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        stopAnswerLabelActivation(e);
        openedByFocus = false;
        togglePopover(trigger, deText);
      }
    });
  }

  function fillDePeek(el, displayText, deText) {
    if (!el) return;
    el.textContent = "";
    el.classList.remove("has-de-peek");

    if (!isPeekEnabled() || !deText || deText === displayText) {
      el.textContent = displayText;
      return;
    }

    const line = document.createElement("span");
    line.className = "de-peek-line";

    const textSpan = document.createElement("span");
    textSpan.className = "de-peek-text";
    textSpan.textContent = displayText;

    const trigger = document.createElement("span");
    trigger.className = "de-peek-trigger";
    trigger.setAttribute("role", "button");
    trigger.tabIndex = 0;
    trigger.textContent = "DE";
    bindPeekTrigger(trigger, deText);

    line.append(textSpan, document.createTextNode(" "), trigger);
    el.classList.add("has-de-peek");
    el.appendChild(line);
  }

  window.loadDePeekForTopic = loadDeTopic;
  window.loadDePeekForTopics = loadDePeekForTopics;
  window.getDeQuestionForPeek = getDeQuestion;
  window.getDeOptionTextForPeek = getDeOptionText;
  window.getDeExplanationForPeek = getDeExplanation;
  window.fillDePeek = fillDePeek;
})();
