/** UI strings and language helpers (DE / RU). */
const I18N = {
  de: {
    siteTitle: "Führerschein Theorie",
    siteSubtitle: "Klasse B · Amtlicher Fragenkatalog · Nach Themen üben",
    topicsHeading: "Themen",
    topicsLoading: "Themen werden geladen …",
    topicsError: "Themen konnten nicht geladen werden.",
    questionsMeta: (n) => `${n} Fragen`,
    footerData: "Daten:",
    allTopics: "Alle Themen",
    topicDefault: "Thema",
    questionsLoading: "Fragen werden geladen …",
    noTopic: "Kein Thema ausgewählt.",
    topicNotFound: "Thema nicht gefunden.",
    topicEmpty: "Dieses Thema enthält keine Fragen.",
    ruTopicEmpty:
      "Für dieses Thema liegt noch keine russische Übersetzung vor.",
    officialCatalogNote:
      "Die Fragen entsprechen dem amtlichen Fragenkatalog TÜV/DEKRA (Klasse B).",
    ruTranslationDisclaimer: "",
    questionImageAlt: "Abbildung zur Frage",
    questionVideoAlt: "Video zur Frage",
    mediaLoadError: "Medien konnten nicht geladen werden.",
    questionCounter: (i, total) => `Frage ${i} von ${total}`,
    questionOfficial: (id) => `Frage ${id}`,
    sessionCounter: (i, total) => `${i} / ${total}`,
    points: (n) => `${n} Punkte`,
    checkAnswer: "Antwort prüfen",
    randomQuestion: "Zufällige Frage",
    questionAnsweredBadge: "beantwortet",
    questionSolvedBadge: "✓ gelöst",
    nextQuestion: "Nächste Frage",
    showResult: "Ergebnis anzeigen",
    pickAnswer: "Bitte eine Antwort wählen.",
    enterAnswer: "Bitte eine Antwort eingeben.",
    freeTextAnswerLabel: "Antwort eingeben",
    freeTextAnswerPlaceholder: "Zahl oder Text",
    freeTextAnswerHint: "Antwort als Zahl oder Text eingeben",
    correct: "Richtig!",
    wrong: "Leider falsch.",
    correctLabel: "Richtig:",
    practiceAgain: "Nochmal üben",
    modeQuiz: "Quiz",
    modeList: "Alle Fragen",
    modeProgress: "Fortschritt",
    progressHeading: "Lernfortschritt",
    progressOverall: (solved, total) => `${solved} / ${total} gelöst`,
    progressChapterCount: (solved, total) => `${solved} / ${total}`,
    progressReset: "Fortschritt zurücksetzen",
    progressResetConfirm:
      "Gesamten Fortschritt für dieses Thema löschen? Das kann nicht rückgängig gemacht werden.",
    markKnown: "Kann ich",
    progressKnown: "Gelernt",
    topicProgressLabel: (pct) => `${pct}% gelöst`,
    listSearchPlaceholder: "Fragen durchsuchen …",
    listSearchLabel: "Fragen filtern",
    listNoResults: "Keine Fragen passen zur Suche.",
    listQuestionId: (id) => `Nr. ${id}`,
    listCountAll: (n) => `${n} Fragen`,
    listCountFiltered: (shown, total) => `${shown} von ${total}`,
    listCountChapter: (chapter, total) => `${chapter} Fragen in diesem Kapitel · ${total} gesamt`,
    listCountChapterFiltered: (shown, total) => `${shown} von ${total} in diesem Kapitel`,
    listSearchInChapterPlaceholder: "In diesem Kapitel suchen …",
    listSearchInChapterLabel: "Kapitel durchsuchen",
    listChapterOf: (current, total) => `Kapitel ${current} von ${total}`,
    listChapterPrev: "Vorheriges Kapitel",
    listChapterNext: "Nächstes Kapitel",
    listGoNextChapter: "Zum nächsten Kapitel",
    listChapterNavLabel: "Kapitelnavigation",
    progressSolvedShort: "Gelöst",
    progressViewedShort: "Gelesen",
    progressViewedCount: (viewed, total) => `${viewed} / ${total} gelesen`,
    topicProgressDualLabel: (solvedPct, viewedPct) =>
      `${solvedPct}% gelöst · ${viewedPct}% gelesen`,
    listChapterSelectLabel: "Kapitel wählen",
    listExplanationLabel: "Erklärung",
    chapterHeading: (num, name) => `Kapitel ${num} · ${name}`,
    chapterQuestionCount: (n) => `${n} Fragen`,
    quizChapterLabel: "Kapitel",
    quizChapterAll: "Gesamtes Thema",
    langSwitch: "RU",
    langSwitchTitle: "Auf Russisch umschalten",
    section_grundstoff: "Grundstoff",
    section_zusatzstoff: "Zusatzstoff (Klasse B)",
    catalogTotal: (n) => `${n} Fragen gesamt`,
    ruPartialMeta: (ru, de) => `RU: ${ru} von ${de} Fragen (Rest: Scraping ausstehend)`,
    dePeekLabel: "Original (DE)",
    studyHubTitle: "Lernmethoden",
    studyExamLink: "Probeklausur (TÜV-Simulation)",
    studyExamDesc: "30 Fragen · 20 Grundstoff + 10 Zusatzstoff · Bewertung wie in der Prüfung",
    studyReviewLink: "Fehler wiederholen",
    studyReviewDesc: (n) =>
      n > 0 ? `${n} Fragen mit Fehlern im Fortschritt` : "Noch keine Fehler gespeichert",
    studyTipSession:
      "Tipp: Lerne in Blöcken von 30–45 Minuten mit Pausen – so bleibt der Stoff hängen.",
    studyTipExamGoal:
      "Trainingsziel: 3 Probeklausuren in Folge mit ≤3 Fehlern und offiziellem Bestehen — auf der Klausur-Seite stehen die amtlichen Regeln (≤10 Fehlerpunkte).",
    studyReadiness: (taken, passed) =>
      [
        `Probeklausuren absolviert: ${taken}`,
        `Offiziell bestanden (TÜV): ${passed} (≤10 Fehlerpunkte, weniger als 2 falsche 5-Punkte-Fragen)`,
      ].join("\n"),
    timeInApp: (formatted) => `Zeit in der App: ${formatted}`,
    timeReset: "Lernzeit zurücksetzen",
    timeResetConfirm: "Gespeicherte Lernzeit löschen?",
    examPageTitle: "Probeklausur",
    examIntroTitle: "Theorieprüfung Klasse B (Simulation)",
    examStart: "Probeklausur starten",
    examPassRulesTitle: "Prüfungsregeln",
    examPassRulesOfficialTitle: "Offiziell bestanden (TÜV/DEKRA)",
    examPassRulesOfficialList: [
      "30 Fragen: 20 Grundstoff + 10 Zusatzstoff Klasse B",
      "Fehlerpunkte nur für falsche Antworten — pro Frage 2, 3, 4 oder 5 Punkte",
      "Bestanden: Summe der Fehlerpunkte höchstens 10",
      "Sofort nicht bestanden: zwei falsch beantwortete 5-Punkte-Fragen (auch bei höchstens 10 Fehlerpunkten gesamt)",
    ],
    examPassRulesTrainingTitle: "Trainingsziel (nicht amtlich)",
    examPassRulesTrainingText:
      "Empfehlung aus Lernblogs: 3 Probeklausuren hintereinander mit höchstens 3 falschen Antworten und dabei offiziell bestanden. Zeigt Ihre Übungsreife — ersetzt aber nicht die amtlichen Regeln oben.",
    examRulesDetailsSummary: "Ablauf dieser Simulation",
    examRulesList: [
      "Nach „Antwort prüfen“: sofort richtig/falsch; Erklärungen optional einblenden",
      "Zwischen Fragen vor- und zurück; am Ende „Klausur abgeben“",
      "Ohne Zeitlimit in der Simulation; bei TÜV/DEKRA kein festes Zeitlimit (laut ADAC)",
      "Bild- und Videofragen können vorkommen",
    ],
    examResultRulesTitle: "Was bedeutet Ihr Ergebnis?",
    examResultExplainWrong: (n) =>
      `${n} falsche Antworten: Anzahl der 30 Fragen, die Sie falsch beantwortet haben (unabhängig von 2- oder 5-Punkte-Fragen).`,
    examResultExplainFaultPoints: (points) =>
      `${points} Fehlerpunkte: Summe der Punkte aller falschen Antworten — erlaubt sind höchstens 10.`,
    examResultExplainFivePoint: (n) =>
      `${n}× 5-Punkte-Frage falsch: bei 2 oder mehr sofort nicht bestanden — auch wenn die Summe höchstens 10 Fehlerpunkte beträgt.`,
    examResultExplainPassed:
      "„Bestanden (offizielle Regeln)“: ≤10 Fehlerpunkte und weniger als zwei falsche 5-Punkte-Fragen.",
    examResultExplainFailTwoFive:
      "Nicht bestanden: mindestens zwei 5-Punkte-Fragen falsch — automatisches Durchfallen.",
    examResultExplainFailPoints: (points) =>
      `Nicht bestanden: ${points} Fehlerpunkte — maximal 10 sind erlaubt.`,
    examPoolNote: (total, grund, zusatz) =>
      `Fragenpool Klasse B: ${total} Fragen · Zufallsauswahl ${grund} + ${zusatz}`,
    examPreparing: "Klausur wird vorbereitet …",
    examPoolTooSmall: "Zu wenige Fragen im Pool.",
    examPrev: "Zurück",
    examShowExplanations: "Erklärungen anzeigen",
    examLastQuestion: "Letzte Frage",
    examSubmit: "Klausur abgeben",
    examSubmitConfirm: (n) =>
      n === 1
        ? "Noch 1 Frage ohne Antwort. Trotzdem abgeben?"
        : `Noch ${n} Fragen ohne Antwort. Trotzdem abgeben?`,
    examAnsweredCount: (answered, total, verified) =>
      `${answered} von ${total} beantwortet · ${verified} geprüft`,
    examSubmitUncheckedConfirm: (n) =>
      n === 1
        ? "Noch 1 Frage nicht geprüft. Trotzdem abgeben?"
        : `Noch ${n} Fragen nicht geprüft. Trotzdem abgeben?`,
    examResultTitle: "Ergebnis Probeklausur",
    examPassed: "Bestanden (offizielle Regeln)",
    examFailed: "Nicht bestanden",
    examResultDetail: (wrong, points, fiveWrong) =>
      `${wrong} falsche Antworten · ${points} Fehlerpunkte · ${fiveWrong}× 5-Punkte-Frage falsch`,
    examResultStats: (taken, passed) =>
      [
        `Probeklausuren absolviert: ${taken}`,
        `Offiziell bestanden (TÜV): ${passed} (≤10 Fehlerpunkte, weniger als 2 falsche 5-Punkte-Fragen)`,
      ].join("\n"),
    examWrongHeading: "Falsch beantwortet",
    examRetry: "Neue Probeklausur",
    reviewPageTitle: "Fehler wiederholen",
    reviewLoading: "Fehler werden geladen …",
    reviewEmpty:
      "Keine Fehler im Fortschritt. Beantworte Fragen in den Themen – falsche Antworten erscheinen hier.",
    reviewResultTitle: "Wiederholung abgeschlossen",
    reviewRestart: "Nochmal wiederholen",
  },
  ru: {
    siteTitle: "Теория вождения",
    siteSubtitle: "Класс B · Официальный каталог вопросов · Практика по темам",
    topicsHeading: "Темы",
    topicsLoading: "Загрузка тем …",
    topicsError: "Не удалось загрузить темы.",
    questionsMeta: (n) => `${n} вопросов`,
    footerData: "Данные:",
    allTopics: "Все темы",
    topicDefault: "Тема",
    questionsLoading: "Загрузка вопросов …",
    noTopic: "Тема не выбрана.",
    topicNotFound: "Тема не найдена.",
    topicEmpty: "В этой теме нет вопросов.",
    ruTopicEmpty: "Русский перевод для этой темы ещё не загружен.",
    officialCatalogNote:
      "Вопросы соответствуют официальному каталогу TÜV/DEKRA (Klasse B).",
    ruTranslationDisclaimer:
      "Перевод на русский в приложении совпадает с формулировками для сдачи теории на русском. Он не всегда литературный и местами спорный — но на экзамене именно так. Имеет смысл привыкать к этим формулировкам.",
    questionImageAlt: "Иллюстрация к вопросу",
    questionVideoAlt: "Видео к вопросу",
    mediaLoadError: "Не удалось загрузить медиа.",
    questionCounter: (i, total) => `Вопрос ${i} из ${total}`,
    questionOfficial: (id) => `Вопрос ${id}`,
    sessionCounter: (i, total) => `${i} / ${total}`,
    points: (n) => `${n} баллов`,
    checkAnswer: "Проверить ответ",
    randomQuestion: "Случайный вопрос",
    questionAnsweredBadge: "отвечено",
    questionSolvedBadge: "✓ решён",
    nextQuestion: "Следующий вопрос",
    showResult: "Показать результат",
    pickAnswer: "Выберите ответ.",
    enterAnswer: "Введите ответ.",
    freeTextAnswerLabel: "Введите ответ",
    freeTextAnswerPlaceholder: "Число или текст",
    freeTextAnswerHint: "Ответьте числом или текстом",
    correct: "Верно!",
    wrong: "Неверно.",
    correctLabel: "Правильно:",
    practiceAgain: "Пройти снова",
    modeQuiz: "Квиз",
    modeList: "Все вопросы",
    modeProgress: "Прогресс",
    progressHeading: "Прогресс обучения",
    progressOverall: (solved, total) => `${solved} / ${total} решено`,
    progressChapterCount: (solved, total) => `${solved} / ${total}`,
    progressReset: "Сбросить прогресс",
    progressResetConfirm:
      "Удалить весь прогресс по этой теме? Это действие нельзя отменить.",
    markKnown: "Знаю ответ",
    progressKnown: "Выучено",
    topicProgressLabel: (pct) => `${pct}% решено`,
    listSearchPlaceholder: "Поиск по вопросам …",
    listSearchLabel: "Фильтр вопросов",
    listNoResults: "Нет вопросов по вашему запросу.",
    listQuestionId: (id) => `№ ${id}`,
    listCountAll: (n) => `${n} вопросов`,
    listCountFiltered: (shown, total) => `${shown} из ${total}`,
    listCountChapter: (chapter, total) => `${chapter} вопросов в главе · ${total} всего`,
    listCountChapterFiltered: (shown, total) => `${shown} из ${total} в этой главе`,
    listSearchInChapterPlaceholder: "Поиск в этой главе …",
    listSearchInChapterLabel: "Поиск в главе",
    listChapterOf: (current, total) => `Глава ${current} из ${total}`,
    listChapterPrev: "Предыдущая глава",
    listChapterNext: "Следующая глава",
    listGoNextChapter: "Перейти к следующей",
    listChapterNavLabel: "Навигация по главам",
    progressSolvedShort: "Решено",
    progressViewedShort: "Просмотрено",
    progressViewedCount: (viewed, total) => `${viewed} / ${total} просмотрено`,
    topicProgressDualLabel: (solvedPct, viewedPct) =>
      `${solvedPct}% решено · ${viewedPct}% просмотрено`,
    listChapterSelectLabel: "Выбрать главу",
    listExplanationLabel: "Пояснение",
    chapterHeading: (num, name) => `Глава ${num} · ${name}`,
    chapterQuestionCount: (n) => `${n} вопросов`,
    quizChapterLabel: "Глава",
    quizChapterAll: "Вся тема",
    langSwitch: "DE",
    langSwitchTitle: "Переключить на немецкий",
    section_grundstoff: "Базовый материал (Grundstoff)",
    section_zusatzstoff: "Доп. материал (Zusatzstoff, класс B)",
    catalogTotal: (n) => `${n} вопросов всего`,
    ruPartialMeta: (ru, de) => `RU: ${ru} из ${de} (остальное — после скрапинга)`,
    dePeekLabel: "Оригинал (DE)",
    studyHubTitle: "Методы подготовки",
    studyExamLink: "Пробный экзамен (как TÜV)",
    studyExamDesc: "30 вопросов · 20 Grundstoff + 10 Zusatzstoff · оценка как на экзамене",
    studyReviewLink: "Повтор ошибок",
    studyReviewDesc: (n) =>
      n > 0 ? `${n} вопросов с ошибками в прогрессе` : "Ошибок пока нет",
    studyTipSession:
      "Совет: занимайтесь блоками по 30–45 минут с перерывами — так материал лучше запоминается.",
    studyTipExamGoal:
      "Цель тренировки: 3 пробных экзамена подряд с ≤3 ошибками и официальным «сдано» — на странице экзамена расписаны официальные правила (≤10 штрафных баллов).",
    studyReadiness: (taken, passed) =>
      [
        `Пройдено пробных экзаменов: ${taken}`,
        `Сдано по правилам TÜV: ${passed} (≤10 штрафных баллов, меньше 2 ошибок в 5-балльных)`,
      ].join("\n"),
    timeInApp: (formatted) => `В приложении: ${formatted}`,
    timeReset: "Сбросить время",
    timeResetConfirm: "Удалить сохранённое время обучения?",
    examPageTitle: "Пробный экзамен",
    examIntroTitle: "Теория класса B (симуляция)",
    examStart: "Начать пробный экзамен",
    examPassRulesTitle: "Условия сдачи",
    examPassRulesOfficialTitle: "Официально сдано (TÜV/DEKRA)",
    examPassRulesOfficialList: [
      "30 вопросов: 20 Grundstoff + 10 Zusatzstoff класса B",
      "Штрафные баллы только за неверные ответы — за вопрос 2, 3, 4 или 5 баллов",
      "Сдано: сумма штрафных баллов не больше 10",
      "Сразу не сдано: два неверных 5-балльных вопроса (даже при сумме не больше 10 штрафных баллов)",
    ],
    examPassRulesTrainingTitle: "Цель тренировки (не официально)",
    examPassRulesTrainingText:
      "Совет из блогов по подготовке: 3 пробных экзамена подряд с не более чем 3 ошибками и при этом официально «сдано». Показывает готовность к практике — но не заменяет официальные правила выше.",
    examRulesDetailsSummary: "Как устроена симуляция",
    examRulesList: [
      "После «Проверить ответ»: сразу верно/неверно; пояснения можно включить",
      "Можно листать вопросы; в конце — «Сдать экзамен»",
      "Без лимита времени в симуляции; на экзамене TÜV/DEKRA нет жёсткого лимита (по ADAC)",
      "Могут быть картинки и видео",
    ],
    examResultRulesTitle: "Что означает ваш результат",
    examResultExplainWrong: (n) =>
      `${n} неверных: сколько из 30 вопросов ответили неправильно (не важно, 2- или 5-балльный вопрос).`,
    examResultExplainFaultPoints: (points) =>
      `${points} штрафных баллов: сумма баллов за все ошибки — можно не больше 10.`,
    examResultExplainFivePoint: (n) =>
      `${n}× 5-балльный вопрос неверен: при 2 и более сразу не сдан — даже если сумма не больше 10 штрафных баллов.`,
    examResultExplainPassed:
      "«Сдано (официальные правила)»: ≤10 штрафных баллов и меньше двух неверных 5-балльных вопросов.",
    examResultExplainFailTwoFive:
      "Не сдано: минимум два 5-балльных вопроса неверны — автоматический провал.",
    examResultExplainFailPoints: (points) =>
      `Не сдано: ${points} штрафных баллов — разрешено не больше 10.`,
    examPoolNote: (total, grund, zusatz) =>
      `Пул класса B: ${total} вопросов · случайно ${grund} + ${zusatz}`,
    examPreparing: "Подготовка экзамена …",
    examPoolTooSmall: "Недостаточно вопросов в пуле.",
    examPrev: "Назад",
    examShowExplanations: "Показывать пояснения",
    examLastQuestion: "Последний вопрос",
    examSubmit: "Сдать экзамен",
    examSubmitConfirm: (n) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) {
        return `Остался ${n} вопрос без ответа. Всё равно сдать?`;
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `Осталось ${n} вопроса без ответа. Всё равно сдать?`;
      }
      return `Осталось ${n} вопросов без ответа. Всё равно сдать?`;
    },
    examAnsweredCount: (answered, total, verified) =>
      `${answered} из ${total} с ответом · ${verified} проверено`,
    examSubmitUncheckedConfirm: (n) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) {
        return `Остался ${n} вопрос без проверки. Всё равно сдать?`;
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `Осталось ${n} вопроса без проверки. Всё равно сдать?`;
      }
      return `Осталось ${n} вопросов без проверки. Всё равно сдать?`;
    },
    examResultTitle: "Результат пробного экзамена",
    examPassed: "Сдано (официальные правила)",
    examFailed: "Не сдано",
    examResultDetail: (wrong, points, fiveWrong) =>
      `${wrong} неверных · ${points} штрафных баллов · ${fiveWrong}× 5-балльный вопрос неверен`,
    examResultStats: (taken, passed) =>
      [
        `Пройдено пробных экзаменов: ${taken}`,
        `Сдано по правилам TÜV: ${passed} (≤10 штрафных баллов, меньше 2 ошибок в 5-балльных)`,
      ].join("\n"),
    examWrongHeading: "Неверные ответы",
    examRetry: "Новый пробный экзамен",
    reviewPageTitle: "Повтор ошибок",
    reviewLoading: "Загрузка ошибок …",
    reviewEmpty:
      "В прогрессе нет ошибок. Отвечайте в темах — неверные вопросы появятся здесь.",
    reviewResultTitle: "Повтор завершён",
    reviewRestart: "Повторить снова",
  },
};

const LANG_STORAGE_KEY = "fuehrerschein-lang";

function pathWithoutRuPrefix(pathname) {
  if (pathname === "/ru" || pathname === "/ru/") return "/";
  if (pathname.startsWith("/ru/")) return pathname.slice(3) || "/";
  return pathname;
}

function isRuPath(pathname) {
  return pathname === "/ru" || pathname.startsWith("/ru/");
}

/** Canonical pathname for DE (/) or RU (/ru/…). */
function pathnameForLang(lang, pathname) {
  const base = pathWithoutRuPrefix(pathname);
  if (lang === "ru") {
    return base === "/" || base === "/index.html"
      ? "/ru/"
      : `/ru${base.startsWith("/") ? base : `/${base}`}`;
  }
  return base === "/index.html" ? "/" : base;
}

function resolveLang() {
  const path = window.location.pathname;
  if (isRuPath(path)) return "ru";
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("lang");
  if (fromUrl === "ru" || fromUrl === "de") return fromUrl;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "ru" || stored === "de") return stored;
  return "de";
}

function getLang() {
  return resolveLang();
}

function setLang(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  const url = new URL(window.location.href);
  url.searchParams.delete("lang");
  url.pathname = pathnameForLang(lang, url.pathname);
  window.location.href = url.toString();
}

function t(key, ...args) {
  const lang = getLang();
  const table = I18N[lang] || I18N.de;
  const value = table[key];
  if (typeof value === "function") return value(...args);
  return value ?? I18N.de[key];
}

function dataUrl(relativePath) {
  const lang = getLang();
  const base = lang === "ru" ? "data/ru/" : "data/";
  return base + relativePath.replace(/^data\//, "");
}

/** Locale-aware internal link (canonical /ru/ prefix when RU). */
function localizedHref(href) {
  if (!href || href.startsWith("#")) return href;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return href;
    url.searchParams.delete("lang");
    url.pathname = pathnameForLang(getLang(), url.pathname);
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
}

const withLang = localizedHref;

/** Rewrite static anchors so navigation stays on /ru/ before other scripts run. */
function applyLocaleToAnchors(root = document) {
  if (getLang() !== "ru") return;
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    const next = localizedHref(href);
    if (next !== href) a.setAttribute("href", next);
  });
}

/** ?lang=ru → /ru/…; stored RU without /ru/ → redirect; persist lang for later navigations. */
(function initLocaleRouting() {
  const u = new URL(window.location.href);
  if (u.searchParams.get("lang") === "ru") {
    if (isRuPath(u.pathname)) {
      u.searchParams.delete("lang");
      const next = u.pathname + u.search + u.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(null, "", next);
      }
    } else {
      u.searchParams.delete("lang");
      u.pathname = pathnameForLang("ru", u.pathname);
      window.location.replace(u.toString());
      return;
    }
  }

  const lang = resolveLang();
  localStorage.setItem(LANG_STORAGE_KEY, lang);

  if (lang === "ru" && !isRuPath(window.location.pathname)) {
    const target = new URL(window.location.href);
    target.searchParams.delete("lang");
    target.pathname = pathnameForLang("ru", target.pathname);
    window.location.replace(target.toString());
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyLocaleToAnchors());
  } else {
    applyLocaleToAnchors();
  }
})();

function applyDocumentLang() {
  document.documentElement.lang = getLang() === "ru" ? "ru" : "de";
}

/** Catalog attribution + RU translation disclaimer (footer / intro boxes). */
function applySiteDisclaimer(root = document) {
  root.querySelectorAll("[data-site-disclaimer]").forEach((box) => {
    const catalogEl = box.querySelector(".site-disclaimer-catalog");
    const ruEl = box.querySelector(".site-disclaimer-ru");
    if (catalogEl) catalogEl.textContent = t("officialCatalogNote");
    if (!ruEl) return;
    const ruText = t("ruTranslationDisclaimer");
    if (ruText) {
      ruEl.textContent = ruText;
      ruEl.hidden = false;
      ruEl.classList.remove("hidden");
    } else {
      ruEl.textContent = "";
      ruEl.hidden = true;
      ruEl.classList.add("hidden");
    }
  });
}

/** Official catalog id, e.g. 1.2.37-015 */
function officialQuestionId(q) {
  if (!q) return "";
  return String(q.id || q.number || q.question_number || "").trim();
}

/** Prominent meta line: "Frage 1.2.37-015 · 4 Punkte" */
function formatQuestionOfficialMeta(q) {
  const id = officialQuestionId(q);
  if (!id) return q?.points ? t("points", q.points) : "";
  const label = t("questionOfficial", id);
  return q?.points ? `${label} · ${t("points", q.points)}` : label;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

/** RU: official title + DE subtitle; DE: German title only. */
function getTopicDisplayTitle(topic) {
  if (!topic) return { primary: "", secondary: null, document: "" };
  if (getLang() === "ru" && topic.titleRu) {
    const de = topic.titleDe || topic.title || "";
    return {
      primary: topic.titleRu,
      secondary: de || null,
      document: de ? `${topic.titleRu} (${de})` : topic.titleRu,
    };
  }
  const primary = topic.title || "";
  return { primary, secondary: null, document: primary };
}

function renderTopicHeadingHtml(topic) {
  const { primary, secondary } = getTopicDisplayTitle(topic);
  if (!secondary) return escapeHtml(primary);
  return `${escapeHtml(primary)}<span class="topic-title-de">(${escapeHtml(secondary)})</span>`;
}

function applyTopicHeading(el, topic) {
  if (!el || !topic) return;
  const { secondary } = getTopicDisplayTitle(topic);
  if (secondary) el.innerHTML = renderTopicHeadingHtml(topic);
  else el.textContent = getTopicDisplayTitle(topic).primary;
}

window.applyLocaleToAnchors = applyLocaleToAnchors;
window.localizedHref = localizedHref;
