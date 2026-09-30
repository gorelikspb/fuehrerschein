const ACCOUNT_STORAGE_KEY = "fuehrershein-account";
const ACCOUNT_API = "/api/account";

function loadAccountSession() {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.user) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveAccountSession(session) {
  if (!session) localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  else localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(session));
}

function accountErrorText(code) {
  if (code === "taken") return t("accountErrTaken");
  if (code === "bad") return t("accountErrBad");
  if (code === "short") return t("accountErrShort");
  if (code === "invalid") return t("accountErrInvalid");
  if (code === "limit") return t("accountErrLimit");
  if (code === "unauthorized") return t("accountErrBad");
  return t("accountErrFail");
}

function setAccountStatus(message, isError, prefix = "account") {
  const el =
    document.getElementById(`${prefix}-status`) ||
    document.getElementById("account-status");
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("account-status--bad");
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("account-status--bad", !!isError);
}

async function accountRequest(payload) {
  const res = await fetch(ACCOUNT_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || "fail");
    err.code = data.error || "fail";
    throw err;
  }
  return data;
}

function trackAccount(eventName) {
  try {
    if (typeof clarity === "function") clarity("event", eventName);
  } catch {
    /* optional */
  }
}

function cloudKeysHaveData(keys) {
  if (!keys || typeof keys !== "object") return false;
  return Object.values(keys).some((v) => typeof v === "string" && v !== "");
}

const SAVE_PROMPT_DISMISS_KEY = "fuehrershein-save-prompt";
const SAVE_PROMPT_DAYS = 14;

function savePromptDismissed() {
  try {
    const at = parseInt(localStorage.getItem(SAVE_PROMPT_DISMISS_KEY) || "", 10);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < SAVE_PROMPT_DAYS * 864e5;
  } catch {
    return false;
  }
}

function dismissSavePrompt() {
  try {
    localStorage.setItem(SAVE_PROMPT_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  const el = document.getElementById("save-progress-prompt");
  if (el) el.remove();
}

function countAnsweredQuestions() {
  if (typeof loadProgressStore !== "function") return 0;
  const store = loadProgressStore();
  let n = 0;
  for (const topic of Object.values(store || {})) {
    n += Object.keys(topic || {}).length;
  }
  return n;
}

function shouldNudgeSave(reason) {
  if (loadAccountSession()) return false;
  if (savePromptDismissed()) return false;
  if (reason === "exam") return true;
  const exams = typeof getExamCountTaken === "function" ? getExamCountTaken() : 0;
  return exams >= 1 || countAnsweredQuestions() >= 8;
}

async function saveProgressToAccount(keepalive) {
  const session = loadAccountSession();
  if (!session) return;
  const backup = buildProgressBackup();
  await fetch(ACCOUNT_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "save",
      token: session.token,
      keys: backup.keys,
    }),
    keepalive: !!keepalive,
  });
}

function applyCloudKeys(keys) {
  applyProgressBackup({ keys: keys || {} });
}

function renderAccountPanel() {
  const form = document.getElementById("account-form");
  const sessionBox = document.getElementById("account-session");
  const sessionText = document.getElementById("account-session-text");
  const title = document.getElementById("account-title");
  const hint = document.getElementById("account-hint");
  const userLabel = document.getElementById("account-user-label");
  const passwordLabel = document.getElementById("account-password-label");
  const loginBtn = document.getElementById("account-login-btn");
  const registerBtn = document.getElementById("account-register-btn");
  const logoutBtn = document.getElementById("account-logout-btn");
  if (!form || !sessionBox) return;

  if (title) title.textContent = t("accountTitle");
  if (hint) hint.textContent = t("accountHint");
  if (userLabel) userLabel.textContent = t("accountUser");
  if (passwordLabel) passwordLabel.textContent = t("accountPassword");
  if (loginBtn) loginBtn.textContent = t("accountLogin");
  if (registerBtn) registerBtn.textContent = t("accountRegister");
  if (logoutBtn) logoutBtn.textContent = t("accountLogout");

  const session = loadAccountSession();
  const panel = document.getElementById("account-panel");
  const exams = typeof getExamCountTaken === "function" ? getExamCountTaken() : 0;
  const hasProgress = exams >= 1 || countAnsweredQuestions() > 0;
  if (panel) panel.classList.toggle("account-panel--nudge", !session && hasProgress);
  if (session) {
    form.hidden = true;
    form.classList.add("hidden");
    if (hint) {
      hint.hidden = true;
      hint.classList.add("hidden");
    }
    sessionBox.hidden = false;
    sessionBox.classList.remove("hidden");
    if (sessionText) sessionText.textContent = t("accountLoggedIn", session.user);
  } else {
    form.hidden = false;
    form.classList.remove("hidden");
    if (hint) {
      hint.hidden = false;
      hint.classList.remove("hidden");
      if (hasProgress) hint.textContent = t("savePromptStudy");
    }
    sessionBox.hidden = true;
    sessionBox.classList.add("hidden");
  }
}

async function finishAuth(data, { created }) {
  saveAccountSession({ token: data.token, user: data.user });
  const local = buildProgressBackup();
  const cloudHas = cloudKeysHaveData(data.keys);
  if (!created && cloudHas) {
    const shouldReplace =
      !local.hasData || window.confirm(t("accountLoadConfirm"));
    if (shouldReplace) {
      applyCloudKeys(data.keys);
      window.location.reload();
      return;
    }
  }
  try {
    await saveProgressToAccount(false);
  } catch {
    /* keep session even if first save fails */
  }
  setAccountStatus(created ? t("accountCreated") : t("accountSaved"), false);
  renderAccountPanel();
}

async function submitAccount(action, prefix = "account") {
  const userInput = document.getElementById(`${prefix}-user`);
  const passwordInput = document.getElementById(`${prefix}-password`);
  const loginBtn = document.getElementById(`${prefix}-login-btn`);
  const registerBtn = document.getElementById(`${prefix}-register-btn`);
  const user = userInput ? userInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";
  setAccountStatus("", false, prefix);
  if (loginBtn) loginBtn.disabled = true;
  if (registerBtn) registerBtn.disabled = true;
  try {
    const data = await accountRequest({
      action,
      user,
      password,
      keys: buildProgressBackup().keys,
    });
    if (passwordInput) passwordInput.value = "";
    trackAccount(action === "register" ? "account_register" : "account_login");
    await finishAuth(data, { created: action === "register" });
    dismissSavePrompt();
  } catch (err) {
    setAccountStatus(accountErrorText(err.code), true, prefix);
  } finally {
    if (loginBtn) loginBtn.disabled = false;
    if (registerBtn) registerBtn.disabled = false;
  }
}

function initAccountPanel() {
  const form = document.getElementById("account-form");
  if (!form) return;
  const registerBtn = document.getElementById("account-register-btn");
  const logoutBtn = document.getElementById("account-logout-btn");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAccount("login");
  });
  if (registerBtn) {
    registerBtn.addEventListener("click", () => submitAccount("register"));
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const session = loadAccountSession();
      try {
        if (session) await accountRequest({ action: "logout", token: session.token });
      } catch {
        /* ignore */
      }
      saveAccountSession(null);
      setAccountStatus("", false);
      renderAccountPanel();
    });
  }
  renderAccountPanel();
}

function promptHost(reason) {
  if (reason === "exam") {
    const streak = document.getElementById("exam-result-streak");
    if (streak && streak.parentNode) {
      return { parent: streak.parentNode, before: streak.nextSibling };
    }
  }
  const run = document.getElementById("exam-run");
  if (run && !run.classList.contains("hidden")) return null;
  const main = document.querySelector("main");
  if (!main) return null;
  return { parent: main, before: null };
}

function fillSavePromptCopy(el, reason) {
  const title = el.querySelector(".save-prompt-title");
  const text = el.querySelector(".save-prompt-text");
  const openBtn = el.querySelector("[data-save-open]");
  const laterBtn = el.querySelector("[data-save-later]");
  const userLabel = el.querySelector("[data-save-user-label]");
  const passwordLabel = el.querySelector("[data-save-password-label]");
  const loginBtn = document.getElementById("save-prompt-login-btn");
  const registerBtn = document.getElementById("save-prompt-register-btn");
  if (title) title.textContent = t("savePromptTitle");
  if (text) {
    text.textContent = reason === "exam" ? t("savePromptExam") : t("savePromptStudy");
  }
  if (openBtn) openBtn.textContent = t("savePromptOpen");
  if (laterBtn) laterBtn.textContent = t("savePromptLater");
  if (userLabel) userLabel.textContent = t("accountUser");
  if (passwordLabel) passwordLabel.textContent = t("accountPassword");
  if (loginBtn) loginBtn.textContent = t("accountLogin");
  if (registerBtn) registerBtn.textContent = t("accountRegister");
}

function openSavePromptForm() {
  trackAccount("save_prompt_click");
  const existing = document.getElementById("account-panel");
  if (existing) {
    existing.scrollIntoView({ behavior: "smooth", block: "center" });
    const user = document.getElementById("account-user");
    if (user) user.focus();
    return;
  }
  const form = document.getElementById("save-prompt-form");
  const actions = document.getElementById("save-prompt-actions");
  if (form) {
    form.hidden = false;
    form.classList.remove("hidden");
  }
  if (actions) actions.hidden = true;
  const user = document.getElementById("save-prompt-user");
  if (user) user.focus();
}

function showSaveProgressPrompt(reason) {
  if (!shouldNudgeSave(reason)) return;
  if (reason !== "exam" && document.getElementById("account-panel")) {
    renderAccountPanel();
    return;
  }
  if (reason !== "exam" && document.getElementById("exam-intro")) return;
  const host = promptHost(reason);
  if (!host) return;
  let el = document.getElementById("save-progress-prompt");
  const created = !el;
  if (!el) {
    el = document.createElement("aside");
    el.id = "save-progress-prompt";
    el.innerHTML = `
      <p class="save-prompt-title"></p>
      <p class="save-prompt-text"></p>
      <div id="save-prompt-actions" class="btn-row save-prompt-actions">
        <button type="button" class="btn btn-primary" data-save-open></button>
        <button type="button" class="btn btn-secondary" data-save-later></button>
      </div>
      <form id="save-prompt-form" class="account-form hidden" hidden>
        <label class="account-field">
          <span data-save-user-label></span>
          <input id="save-prompt-user" name="user" autocomplete="username" maxlength="24" required>
        </label>
        <label class="account-field">
          <span data-save-password-label></span>
          <input id="save-prompt-password" name="password" type="password" autocomplete="new-password" maxlength="72" required>
        </label>
        <div class="btn-row">
          <button type="submit" id="save-prompt-login-btn" class="btn btn-primary"></button>
          <button type="button" id="save-prompt-register-btn" class="btn btn-secondary"></button>
        </div>
        <p id="save-prompt-status" class="account-status" hidden></p>
      </form>
    `;
    el.querySelector("[data-save-open]").addEventListener("click", openSavePromptForm);
    el.querySelector("[data-save-later]").addEventListener("click", () => {
      trackAccount("save_prompt_dismiss");
      dismissSavePrompt();
    });
    el.querySelector("#save-prompt-form").addEventListener("submit", (event) => {
      event.preventDefault();
      submitAccount("login", "save-prompt");
    });
    el.querySelector("#save-prompt-register-btn").addEventListener("click", () => {
      submitAccount("register", "save-prompt");
    });
  }
  el.className = reason === "exam" ? "save-prompt" : "save-prompt save-prompt--sticky";
  fillSavePromptCopy(el, reason);
  if (created) {
    host.parent.insertBefore(el, host.before);
    trackAccount("save_prompt_shown");
  }
}

window.showSaveProgressPrompt = showSaveProgressPrompt;

function initSavePrompt() {
  window.addEventListener("fuehrershein-exam-finished", () => {
    showSaveProgressPrompt("exam");
  });
  window.addEventListener("fuehrershein-progress", () => {
    showSaveProgressPrompt("study");
  });
  showSaveProgressPrompt("study");
}

function initAccountSync() {
  let timer = null;
  const schedule = () => {
    if (!loadAccountSession()) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveProgressToAccount(false).catch(() => {});
    }, 1500);
  };
  window.addEventListener("fuehrershein-progress", schedule);
  window.addEventListener("fuehrershein-viewed", schedule);
  window.addEventListener("fuehrershein-last-read", schedule);
  window.addEventListener("fuehrershein-exam", schedule);
  window.addEventListener("fuehrershein-time", schedule);
  window.addEventListener("pagehide", () => {
    saveProgressToAccount(true).catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAccountPanel();
  initAccountSync();
  initSavePrompt();
});
