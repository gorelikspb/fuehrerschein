/** MCQ vs free-text answer rendering and comparison (catalog numeric / text questions). */

function getMcqOptions(q) {
  return (q.options || []).filter(
    (o) => (o.text || "").trim() || isValidMediaUrl(o.image)
  );
}

function isFreeTextQuestion(q) {
  return (
    getMcqOptions(q).length === 0 &&
    Array.isArray(q.correct) &&
    q.correct.length > 0
  );
}

function hasAnswerInputs(q) {
  return getMcqOptions(q).length > 0 || isFreeTextQuestion(q);
}

function normalizeAnswerValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(",", ".");
}

function compareAnswerSets(selected, correct) {
  if (selected.length !== correct.length) return false;
  const norm = (arr) => [...arr].map(normalizeAnswerValue).sort();
  return norm(selected).join(",") === norm(correct).join(",");
}

function formatCorrectAnswers(q, separator = "<br>") {
  return q.correct
    .map((id) => {
      const opt = (q.options || []).find((o) => o.id === id);
      const text = (opt?.text || "").trim();
      return text ? `${id}. ${text}` : id;
    })
    .join(separator);
}

function isNumericFreeTextQuestion(q) {
  return isFreeTextQuestion(q) && q.correct.every((c) => /^[\d.,\s]+$/.test(String(c)));
}

/**
 * @param {HTMLElement} container
 * @param {object} q
 * @param {{ inputName?: string, deQ?: object|null, onChange?: () => void }} opts
 * @returns {"mcq"|"text"|"none"}
 */
function renderQuestionAnswers(container, q, opts = {}) {
  const { inputName = "answer", deQ = null, onChange = null } = opts;
  container.innerHTML = "";
  const mcqOptions = getMcqOptions(q);

  if (mcqOptions.length > 0) {
    const multiple = q.correct.length > 1;
    for (const opt of mcqOptions) {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = multiple ? "checkbox" : "radio";
      input.name = inputName;
      input.value = opt.id;
      const span = document.createElement("span");
      const deOptText =
        deQ && typeof window.getDeOptionTextForPeek === "function"
          ? window.getDeOptionTextForPeek(deQ, opt.id)
          : "";
      buildOptionLabel(span, opt, deOptText);
      label.append(input, span);
      if (onChange) {
        label.addEventListener("change", () => {
          onChange(input, label);
        });
      }
      container.appendChild(label);
    }
    return "mcq";
  }

  if (isFreeTextQuestion(q)) {
    const label = document.createElement("label");
    label.className = "option answer-text-entry";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "answer-text-input";
    input.name = inputName;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.inputMode = isNumericFreeTextQuestion(q) ? "decimal" : "text";
    input.setAttribute("aria-label", t("freeTextAnswerLabel"));
    input.placeholder = t("freeTextAnswerPlaceholder");
    const hint = document.createElement("span");
    hint.className = "answer-text-hint";
    hint.textContent = t("freeTextAnswerHint");
    label.append(input, hint);
    if (onChange) {
      input.addEventListener("input", () => onChange(input, label));
    }
    container.appendChild(label);
    return "text";
  }

  return "none";
}

function getAnswerSelection(container) {
  const textInput = container.querySelector(".answer-text-input");
  if (textInput) {
    const value = textInput.value.trim();
    return value ? [value] : [];
  }
  return [
    ...container.querySelectorAll(
      'input[type="checkbox"]:checked, input[type="radio"]:checked'
    ),
  ].map((el) => el.value);
}

function restoreAnswerSelection(container, saved, q) {
  const textInput = container.querySelector(".answer-text-input");
  if (textInput) {
    const value = (saved && saved[0]) || "";
    textInput.value = value;
    const label = textInput.closest(".option");
    if (label) label.classList.toggle("selected", Boolean(value.trim()));
    textInput.disabled = false;
    return;
  }
  for (const input of container.querySelectorAll("input")) {
    input.checked = (saved || []).includes(input.value);
    input.disabled = false;
    const label = input.closest(".option");
    if (label) {
      label.classList.remove("correct", "wrong", "disabled");
      label.classList.toggle("selected", input.checked);
    }
  }
}

function applyAnswerCheckedStyles(container, q, selected) {
  const textInput = container.querySelector(".answer-text-input");
  if (textInput) {
    const label = textInput.closest(".option");
    const isCorrect = compareAnswerSets(selected, q.correct);
    textInput.disabled = true;
    if (label) {
      label.classList.add("disabled");
      label.classList.toggle("correct", isCorrect);
      label.classList.toggle("wrong", !isCorrect);
    }
    return isCorrect;
  }

  for (const label of container.querySelectorAll(".option")) {
    const input = label.querySelector("input");
    if (!input) continue;
    input.disabled = true;
    label.classList.add("disabled");
    const id = input.value;
    if (q.correct.includes(id)) label.classList.add("correct");
    else if (input.checked) label.classList.add("wrong");
  }
  return compareAnswerSets(selected, q.correct);
}

function bindAnswerInputSync(container, checkBtn, onChange) {
  const handler = () => {
    if (onChange) onChange();
    if (checkBtn) checkBtn.disabled = getAnswerSelection(container).length === 0;
  };
  container.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
  handler();
}

function syncCheckButtonVisibility(checkBtn, q) {
  if (!checkBtn) return;
  if (!hasAnswerInputs(q)) {
    checkBtn.classList.add("hidden");
    checkBtn.disabled = true;
    return;
  }
  checkBtn.classList.remove("hidden");
}
