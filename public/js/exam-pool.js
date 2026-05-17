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

  window.loadExamPool = loadExamPool;
  window.pickExamQuestions = pickExamQuestions;
  window.clearExamPoolCache = function clearExamPoolCache() {
    poolCache = null;
  };
})();
