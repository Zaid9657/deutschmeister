// Which learning-support texts a learner can actually MEET — and the exact
// source each one translates. Shared by scripts/i18n-coverage.mjs (the report)
// and tests/arabic-coverage.test.mjs (the gate), so "reachable" is defined once.
//
// Reachability is computed with the real builders, never by listing ids by
// hand: buildLesson() for every attempt of the draw cycle (ATTEMPT_CYCLE), the
// requeue candidates exactly as requeue.js filters them (same topic, usable,
// taught by this Lektion), the derived items' own word and line ids, the
// review cards the Lektion seeds, the intro/meta lines, and — reported
// separately, outside the pilot — the checkpoint after the scope.
//
// Each entry: { key, source, scope, kind } where `source` is the object of
// source strings the translation is made from; `hashSource(source)` is what a
// sidecar entry records in `src`, so an edit to the German or English source
// turns its translation STALE.
import { CURRICULUM_A11 } from '../../src/data/curricula/a11.js';
import { A11_META } from '../../src/data/curricula/a11.meta.js';
import buildLesson, { ATTEMPT_CYCLE, poolItems } from '../../src/lib/lesson/buildLesson.js';
import { isUsableItem } from '../../src/data/lessonPools/quality.js';
import { buildCheckpoint } from '../../src/lib/checkpoint/buildCheckpoint.js';
import { supportKeys as K } from '../../src/lib/lesson/support.js';

/** FNV-1a (32-bit) over the JSON of the source fields — the `src` stamp. */
export function hashSource(source) {
  const text = JSON.stringify(source);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16).padStart(8, '0')}`;
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'string' && v.trim()));

/**
 * reachableSupport({ pool, lektionIds, includeCourse, includeCheckpointAfter })
 *   → Map(key → { key, source, scope, kind })
 */
export function reachableSupport({ pool, lektionIds, curriculum = CURRICULUM_A11, meta = A11_META, includeCourse = true } = {}) {
  const out = new Map();
  const add = (key, source, scope, kind) => {
    const src = clean(source);
    if (!key || !Object.keys(src).length) return;
    if (!out.has(key)) out.set(key, { key, source: src, scope, kind });
  };
  const items = poolItems(pool);
  const byId = new Map(items.map((it) => [it.id, it]));

  const addItem = (it, scope) => {
    if (!it) return;
    if (it.questionEn) add(K.itemQuestion(it.id), { de: it.questionDe, en: it.questionEn }, scope, 'item.question');
    if (it.explanationEn || it.explanationDe) add(K.itemExplanation(it.id), { de: it.explanationDe, en: it.explanationEn }, scope, 'item.explanation');
    if (it.hint) add(K.itemHint(it.id), { de: it.hint }, scope, 'item.hint');
  };

  for (const lektion of curriculum.lektionen) {
    if (!lektionIds.includes(lektion.id)) continue;
    const scope = lektion.id;
    const id = lektion.id;
    const intro = meta?.lektionIntro?.[id];

    if (intro?.situationEn) add(K.introSituation(id), { de: lektion.situation, en: intro.situationEn }, scope, 'intro');
    (lektion.canDo || []).forEach((line, i) => {
      if (intro?.canDoEn?.[i]) add(K.introCanDo(id, i), { de: line, en: intro.canDoEn[i] }, scope, 'intro');
    });
    for (const c of meta?.characters || []) {
      if (c.appearsIn.includes(lektion.nr)) add(K.character(c.name), { en: c.roleEn }, 'course', 'character');
    }

    if (lektion.dialog?.setting) add(K.dialogSetting(id), { de: lektion.dialog.setting }, scope, 'dialog');
    for (const line of lektion.dialog?.lines || []) add(K.dialogLine(line.id), { de: line.de, en: line.en }, scope, 'dialog.line');

    // The gloss lexicon of this Lektion is its own Wortfeld plus every earlier
    // one; inside the pilot the earlier ones are in scope themselves.
    for (const w of lektion.wortfeld || []) add(K.word(w.wordId), { de: w.de, en: w.en }, scope, 'word');

    if (lektion.notice) {
      add(K.noticeTitle(id), { de: lektion.notice.title }, scope, 'notice');
      add(K.noticeBody(id), { de: lektion.notice.bodyDe, en: lektion.notice.bodyEn }, scope, 'notice');
    }
    if (lektion.pretest) add(K.pretest(id), { de: lektion.pretest.promptDe, en: lektion.pretest.promptEn }, scope, 'pretest');
    if (lektion.phonetik?.focus) add(K.phonetikFocus(id), { de: lektion.phonetik.focus }, scope, 'phonetik');
    if (lektion.sprechen?.open) add(K.speakingPrompt(id), { de: lektion.sprechen.open.promptDe, en: lektion.sprechen.open.promptEn }, scope, 'speaking');
    if (lektion.schreiben) {
      add(K.writingTask(id), { de: lektion.schreiben.taskDe, en: lektion.schreiben.taskEn }, scope, 'writing');
      (lektion.schreiben.fields || []).forEach((f, i) => add(K.writingField(id, i), { de: f }, scope, 'writing'));
      (lektion.schreiben.leitpunkte || []).forEach((lp, i) => add(K.writingPoint(id, i), { de: lp }, scope, 'writing'));
    }

    // Every item the practice stage can draw, over the whole draw cycle.
    const drawn = new Set();
    for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
      const { stages } = buildLesson({ curriculum, lektion, pool, attempt });
      for (const st of stages) {
        if (st.kind === 'practice') for (const it of st.items || []) drawn.add(it.id);
      }
    }
    for (const itemId of drawn) addItem(byId.get(itemId), scope);

    // Every item the requeue can bring back for a miss on any of them —
    // requeue.js's own filter: same topic, usable, taught by this Lektion.
    const topics = new Set([...drawn].map((itemId) => byId.get(itemId)?.topic).filter(Boolean));
    for (const it of items) {
      if (!topics.has(it.topic) || !isUsableItem(it)) continue;
      const minL = Number(it.minLektion);
      if (Number.isFinite(minL) && minL > lektion.nr) continue;
      addItem(it, scope);
    }
  }

  if (includeCourse && meta) {
    add(K.courseAbout(), { en: meta.aboutEn }, 'course', 'course');
    for (const ch of meta.chapters || []) {
      add(K.chapterTitle(ch.nr), { de: ch.titleDe, en: ch.titleEn }, 'course', 'course');
      add(K.chapterStory(ch.nr), { en: ch.storyEn }, 'course', 'course');
    }
    for (const step of meta.howItWorksEn?.steps || []) {
      add(K.howStepLabel(step.key), { en: step.label }, 'course', 'course');
      add(K.howStepDescription(step.key), { en: step.descriptionEn }, 'course', 'course');
    }
    (meta.outcomesEn || []).forEach((line, i) => add(K.outcome(i), { en: line }, 'course', 'course'));
    for (const c of meta.characters || []) add(K.character(c.name), { en: c.roleEn }, 'course', 'character');
  }
  return out;
}

/** The checkpoint after the scope (Checkpoint 1 after Lektion 3): reported, not gated. */
export function checkpointSupport({ pool, checkpointNr = 1, curriculum = CURRICULUM_A11 } = {}) {
  const out = new Map();
  const checkpoint = curriculum.checkpoints.find((c) => c.nr === checkpointNr);
  if (!checkpoint) return out;
  for (const it of buildCheckpoint({ curriculum, checkpoint, pool })) {
    if (it.promptEn) out.set(K.itemQuestion(it.id), { key: K.itemQuestion(it.id), source: clean({ de: it.promptDe, en: it.promptEn }), scope: checkpoint.id, kind: 'checkpoint' });
    if (it.explanationEn || it.explanationDe) {
      out.set(K.itemExplanation(it.id), { key: K.itemExplanation(it.id), source: clean({ de: it.explanationDe, en: it.explanationEn }), scope: checkpoint.id, kind: 'checkpoint' });
    }
  }
  return out;
}

/** Status of one key against a sidecar: missing | stale | draft | reviewed. */
export function statusOf(entry, sidecarEntry, locale = 'ar') {
  if (!sidecarEntry || typeof sidecarEntry[locale] !== 'string' || !sidecarEntry[locale].trim()) return 'missing';
  if (sidecarEntry.src !== hashSource(entry.source)) return 'stale';
  return sidecarEntry.status === 'reviewed' ? 'reviewed' : 'draft';
}
