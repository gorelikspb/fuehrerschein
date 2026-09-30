/** Load Klasse B pool from topics.json (build-data.py: B themes, no Mofa, Zusatzstoff class filter). */
(function () {
  let poolCache = null;

  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function sampleFrom(list, count) {
    return shuffle(list).slice(0, Math.min(count, list.length));
  }

  async function loadExamPool() {
    if (poolCache) return poolCache;

    const manifestRes = await fetch(dataUrl("topics.json"));
    if (!manifestRes.ok) throw new Error(t("topicsError"));
    const manifest = await manifestRes.json();

    const topicFiles = await Promise.all(
      manifest.topics.map(async (topic) => {
        const res = await fetch(dataUrl(`${encodeURIComponent(topic.id)}.json`));
        if (!res.ok) return { topic, questions: [] };
        const data = await res.json();
        const section = topic.section || data.section || "other";
        return {
          topicId: topic.id,
          section,
          questions: (data.questions || []).map((q) => ({
            ...q,
            topicId: topic.id,
            section,
          })),
        };
      })
    );

    const all = [];
    for (const block of topicFiles) {
      all.push(...block.questions);
    }

    poolCache = {
      all,
      grundstoff: all.filter((q) => q.section === "grundstoff"),
      zusatzstoff: all.filter((q) => q.section === "zusatzstoff"),
      total: all.length,
    };
    return poolCache;
  }

  /**
   * @param {number} grundCount
   * @param {number} zusatzCount
   */
  function pickExamQuestions(pool, grundCount = 20, zusatzCount = 10) {
    const picked = [
      ...sampleFrom(pool.grundstoff, grundCount),
      ...sampleFrom(pool.zusatzstoff, zusatzCount),
    ];

    const need = grundCount + zusatzCount - picked.length;
    if (need > 0) {
      const pickedIds = new Set(picked.map((q) => q.id));
      const rest = pool.all.filter((q) => !pickedIds.has(q.id));
      picked.push(...sampleFrom(rest, need));
    }

    return shuffle(picked).slice(0, grundCount + zusatzCount);
  }

  function isoWeekId() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const week =
      1 +
      Math.round(
        ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      );
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function seededShuffle(items, seedStr) {
    const arr = items.slice();
    let a = 2166136261;
    for (let i = 0; i < seedStr.length; i += 1) {
      a ^= seedStr.charCodeAt(i);
      a = Math.imul(a, 16777619);
    }
    a = a >>> 0 || 1;
    const rand = () => {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      return a / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickWeekMix(pool, wrongIds, count = 20) {
    const seed = isoWeekId();
    const ids = wrongIds instanceof Set ? wrongIds : new Set(wrongIds || []);
    const wrong = pool.all.filter((q) => ids.has(q.id));
    const rest = pool.all.filter((q) => !ids.has(q.id));
    const hard = rest.filter((q) => Number(q.points) >= 4);
    const picked = seededShuffle(wrong, `${seed}:w`).slice(0, 12);
    const fillFrom = hard.length ? hard : rest;
    for (const q of seededShuffle(fillFrom, `${seed}:h`)) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.id === q.id)) continue;
      picked.push(q);
    }
    return picked.slice(0, count);
  }

  window.loadExamPool = loadExamPool;
  window.pickExamQuestions = pickExamQuestions;
  window.pickWeekMix = pickWeekMix;
  window.isoWeekId = isoWeekId;
  window.clearExamPoolCache = function clearExamPoolCache() {
    poolCache = null;
  };
})();
