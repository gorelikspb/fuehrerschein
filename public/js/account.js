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

function setAccountStatus(message, isError) {
  const el = document.getElementById("account-status");
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
  if (!keys || typeof keys !== "object") return false;
  return Object.values(keys).some((v) => typeof v === "string" && v !== "");
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

async function submitAccount(action) {
  const userInput = document.getElementById("account-user");
  const passwordInput = document.getElementById("account-password");
  const loginBtn = document.getElementById("account-login-btn");
  const registerBtn = document.getElementById("account-register-btn");
  const user = userInput ? userInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value : "";
  setAccountStatus("", false);
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
  } catch (err) {
    setAccountStatus(accountErrorText(err.code), true);
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
});
