// GRM-04 — grammar ceiling (BLUEPRINT §9.1, §9.3): production lines, model texts, rule-card
// examples, expected answers and exam texts use no construction introduced after the current
// position; inputs exceed it only via whitelisted chunks or glossed receptive exposure.
//
// The construction detectors are `registries/detectors.json`; WHEN a construction is licensed is
// read from the grammar spine (the detector's spine points, their intro and chunkFrom), never typed
// into a detector. Hard for exact detectors, advisory for heuristic/advisory ones and for hits a
// lexicon-driven detector had to guess from word shape.
//
// Positions: production and expected answers are licensed by the point's PRODUCTIVE intro;
// inputs and exam texts by its RECEPTIVE intro. A point the unit itself declares (spec.grammar
// new/chunk/review) is licensed in that unit — a misplacement is GRM-02's finding, reported once.
// A spine chunkFrom at or before the position licenses the construction as a chunk: no finding (below).
//
// A declared chunk is presented (review a1.1-u04 r1 F05): a unit that lists a point under
// spec.grammar.chunk shows it in at least one input line or Redemittel — found by the point's own
// detectors, else by the forms its spine label lists. A chunk no detector and no label form can find
// is left to review (noted).
//
// Metalanguage surfaces are read too, as receptive text and ADVISORY only (they name constructions
// as well as use them): each rule card's de prose at the card's first use (a2.1-u04 r2 F10 / r3 F12),
// and ONE instruction scope (a1.1-u04 r4 F08 / r5 F05: „either all … or none") — strategy cards
// (a2.1-u04 r2 F07), exam blocks' and speaking parts' instructionsDe, every situationDe and title.canDo,
// read through lib-validate/metalanguage.mjs walkReadSurfaces (`instruction: true`), the walker LEX-01
// uses for the same surfaces. A genitive attribute on a German-only speaking instruction („Antworten Sie
// auf die Frage der Partnerin", det.genitiv-feminin-attribut) is reported there. A form a licensed spine
// point lists in its label („kam, sagte, es gab") is licensed whatever later detector matches it
// (orchestrator 2026-09-27: det.praeteritum-vollverb blocked g.praeteritum-kernverben's own forms).
//
// A construction the spine licenses as a chunk at the position (chunkFrom ≤ here) is not reported at
// all (a1.1-u04 r4 F08 / r5 F05: „Lesen Sie zuerst die Frage." under chunkFrom a1.1-u01 raised an
// advisory that itself said the chunk was licensed); the run's notes count what was suppressed. A
// chunk is not a ceiling breach — LEX-07's ceiling check already skipped it.
//
// Third round (the a1.1 unit reviews u01–u06, rule-smith 2026-09-28, RAILS §3.1c) — the false-positive
// classes, each closed by a rule (the level's 171 advisories were ~85 % noise):
//   - production is what the learner WRITES: typed keys, model turns, Redemittel, model texts, model
//     sentences. A choice item's key is read, not written — a receptive surface (u01 r2 F10, u03 r2 F08);
//   - a detector marked `reportOn: 'chosen'` (the article detectors, DETECTOR_OVERLAYS until detectors.json
//     carries it) reports only an article the learner chooses: inside the gap of a typed item, or the
//     article an error correction changes (u02 r1 F20 / r2 F10, u03 r3 F09);
//   - on the instruction scope: the can-do frame („Sie können …", „Ich kann …") that opens title.canDo,
//     endLines and the Lernziele lines (u05 r1 F16 / r2 F11 / r3 F09, u06 r1 F02); the Teil template's own
//     instruction wording in a part or block of that template („Stellen Sie sich … vor", sd1.sp1); a verb the
//     lexicon allocates here or earlier as a reflexive or separable lemma, in its own clause („Stellen Sie
//     sich vor": lx.sich-vorstellen a1.1-u01, u01 r2 F10); the learner-address register „Ihr-" („Ihren
//     Namen"); a phrase whose content words are all instruction metalanguage („einen Aussagesatz") —
//     none of these is reported;
//   - the read scope grows by the item surfaces (promptDe, options, explanation.de) and the Redemittel
//     labels, advisory like every metalanguage surface (u02 r2 F03 / r3 F08, u05 r1 F15, u06 r1 F11); the
//     Lernziele lines are read like title.canDo and reported once, at the can-do registry;
//   - a unit's own run reports the prose of the rule cards it is the first to show (u05 r2 F09 / r3 F07).
// The engine side (lib-validate/detectors.mjs): the „zusammen" adverb class, a particle before „…", the
// perception pair „bitte|bitter", the label „Punkt 2:", „das deine", „Teil 1.", „verabredet".
//
// Final code pass (2026-09-28, the a1.1 u01/u07 deferrals):
//   - a `reportOn: 'chosen'` article is chosen only when the ARTICLE itself stands in the gap: „Indien ist ein ___."
//     → „Land" types the noun after a printed „ein", it does not choose the article (u01 ls3-p05/p06); an error
//     correction's quoted sentence is compared case-free („Die Postleitzahl …" keeps „die Postleitzahl");
//   - the can-do frame opens EVERY sentence of a frame surface, „Und"/„Aber" before it included: a title.canDo
//     split into two sentences for TXT-01 („Sie können … . Und Sie können fragen: …") is two frames (u03, u07).

import { walkTexts, walkProduction, walkSteps } from '../lib-validate/walk.mjs';
import { walkReadSurfaces, isMetalanguage } from '../lib-validate/metalanguage.mjs';
import { positionOf, parseUnitId, LEVELS, unitPosition } from '../lib-validate/ids.mjs';
import { allLexicon } from '../lib-validate/context.mjs';
import { buildLexEnv, detectInText, withOverlay } from '../lib-validate/detectors.mjs';
import { detectorPlacement, describePosition, exemptForms, introducedForms } from '../lib-validate/spine.mjs';
import { tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { arr, finding, list, CHOICE_TYPES } from '../lib-validate/helpers.mjs';

/** The can-do frame that opens title.canDo, endLines and the Lernziele lines: „Sie können …", „Ich kann …". */
const FRAME_RE = /^\s*(?:(?:Und|Aber)\s+)?(?:Sie\s+können|Ich\s+kann|Du\s+kannst|Jetzt\s+können\s+Sie)\b/u;
/**
 * The can-do frames of a frame surface as [from, to) character spans: one at the start of every sentence
 * (a canDo split into „Sie können … . Und Sie können …" for TXT-01 carries two, a1.1-u03/u07).
 */
export function frameSpans(text) {
  const out = [];
  const t = String(text || '');
  const starts = [0, ...[...t.matchAll(/[.!?](?:[“"‘»«]?)\s+/gu)].map((m) => m.index + m[0].length)];
  for (const at of starts) {
    const m = t.slice(at).match(FRAME_RE);
    if (m) out.push([at, at + m[0].length]);
  }
  return out;
}
const FRAME_KINDS = new Set(['canDo', 'endLine', 'lernziel']);
/** The learner-address register on an instruction: „Ihr-", „Ihnen". */
const ADDRESS_RE = /^(?:Ihr(?:e|en|em|er|es)?|Ihnen)$/u;
/** Item types whose key the learner types (the rest is chosen). */
const choiceItem = (item) => Boolean(item) && (CHOICE_TYPES.has(item.type) || (item.type === 'cloze' && arr(item.options).length > 0) || item.type === 'insert');

/**
 * An instruction formula: every content word of the hit's clause besides the hit itself is instruction
 * metalanguage („Welche Antwort passt?", „Welches Wort fehlt?") — the construction names the task, it is not
 * content the learner must parse. „Welche Sprachen spricht die Frau?" is content (a1.1-u02 r2 F03).
 */
function formulaClause(sentence, index, hitToks) {
  const own = new Set(hitToks.map((t) => t.lower));
  const clause = String(sentence).split(/[,;:]/).reduce((acc, part) => {
    if (acc.found) return acc;
    const end = acc.at + part.length;
    if (index >= acc.at && index < end + 1) return { found: part, at: end + 1 };
    return { found: null, at: end + 1 };
  }, { found: null, at: 0 }).found || sentence;
  const content = tokens(clause).map((t) => t.lower).filter((w) => !FUNCTION_WORDS.has(w) && !own.has(w) && !/^\d/.test(w));
  return content.length > 0 && content.every((w) => isMetalanguage(w) || FORMULA_VERBS.has(w));
}
/** The verbs of the task formulas („Welcher Satz sagt …?", „Welches Wort steht auf Position 2?", „Was fehlt?"). */
const FORMULA_VERBS = new Set(['sagt', 'sagen', 'steht', 'stehen', 'fehlt', 'fehlen', 'heißt', 'zeigt', 'zeigen', 'meint', 'bedeutet', 'gehört', 'gehören', 'stimmt', 'stimmen', 'richtig', 'falsch']);

/** Do the tokens of `needle` occur in `hay`, in order (not necessarily adjacent)? */
function inOrder(needle, hay) {
  const n = tokens(needle).map((t) => t.lower);
  const h = tokens(hay).map((t) => t.lower);
  let k = 0;
  for (const w of h) if (w === n[k]) k += 1;
  return n.length > 0 && k === n.length;
}

export const id = 'GRM-04';
export const title = 'Grammar ceiling: no construction before the spine licenses it (detectors)';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'S';

/** Course position of a document (Plateaus after their unit, closing and mocks after U12). */
export function docPosition(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') return positionOf(doc.level, d.nr ?? parseUnitId(d.id)?.nr);
  if (doc.kind === 'lanepack') return positionOf(doc.level, parseUnitId(d.unit)?.nr);
  if (doc.kind === 'plateau') {
    const n = Number(String(d.id || '').match(/-p([1-3])$/)?.[1]);
    return n ? positionOf(doc.level, n * 3) + 0.5 : null;
  }
  if (doc.kind === 'closing' || doc.kind === 'mock') return positionOf(doc.level, 12) + 0.5;
  return null;
}

export function run({ ctx, docs, levels, mode, stageOf = () => 'T' }) {
  if (!ctx.registries.spine) return { findings: [], skipped: 'grammar-spine.json missing' };
  if (!ctx.registries.detectors) return { findings: [], skipped: 'detectors.json missing' };
  const placement = detectorPlacement(ctx);
  if (!placement.size) return { findings: [], skipped: 'no detector is mapped to a spine point yet (points[].detectors / spec.spinePoints)' };
  const detectors = ctx.registries.detectors.list.filter((d) => placement.has(d.id));
  const lexicon = allLexicon(ctx);
  const env = buildLexEnv(lexicon);
  const spine = ctx.registries.spine.byId;
  const findings = [];
  const notes = [];
  const bySpine = [...placement.values()].filter((p) => p.source === 'spine').length;
  notes.push(`${placement.size} of ${ctx.registries.detectors.list.length} detectors placed (${bySpine} via the spine, ${placement.size - bySpine} via detector hints)${env.available ? '' : '; no lexicon loaded — lexicon-driven detectors run on word shape (advisory)'}`);

  // forms a licensed spine point introduces are licensed, whatever later detector matches them
  // (g.praeteritum-kernverben: kam, sagte, gab from a2.2-u01 under det.praeteritum-vollverb)
  const exemptCache = new Map();
  const exemptAt = (pos, surface, declared) => {
    const key = `${pos}|${surface === 'production' ? 'p' : 'r'}|${[...declared].sort().join(',')}`;
    if (!exemptCache.has(key)) exemptCache.set(key, exemptForms(ctx, pos, surface, declared, FUNCTION_WORDS));
    return exemptCache.get(key);
  };
  const exempted = (match, exempt) => {
    const content = tokens(match).map((t) => t.lower).filter((w) => !FUNCTION_WORDS.has(w));
    return content.length > 0 && content.every((w) => exempt.has(w));
  };
  // reflexive and separable VERB lemmas the lexicon allocates at or before a position: taught as words, so
  // an instruction may use them in their own clause („Stellen Sie sich vor", lx.sich-vorstellen a1.1-u01)
  const chunkVerbs = lexicon
    .filter((e) => e?.pos === 'VERB' && (e.reflexive || e.separable || /\s/.test(String(e.lemma || '').replace(/^sich\s+/, ''))))
    .map((e) => ({ at: unitPosition(e.unit), forms: entryForms(e).forms }))
    .filter((x) => x.at !== null);
  const lexicalChunk = (sentence, pos) => {
    const words = tokens(sentence).map((t) => t.lower);
    return chunkVerbs.some((v) => v.at <= pos && words.some((w) => v.forms.has(w) && !FUNCTION_WORDS.has(w)));
  };
  const templateText = (id) => String(ctx.registries.templates.get(id)?.template?.instructionsDe || '');
  // multi-word lexicon lemmas (phrases) allocated at or before a position: a hit inside one is the lemma the
  // lexicon teaches as a word („Tut mir leid", lx.tut-mir-leid; a1.1-u08 r1 F13 / r2 F09), on every surface
  const phraseLemmas = lexicon
    .filter((e) => /\s/.test(String(e?.lemma || '').replace(/^(?:der|die|das|sich)\s+/i, '').trim()))
    .map((e) => ({ at: unitPosition(e.unit), words: tokens(String(e.lemma).replace(/^sich\s+/i, '')).map((t) => t.lower) }))
    .filter((x) => x.at !== null && x.words.length >= 2);
  const insidePhrase = (sentence, index, match, pos) => {
    const toks = tokens(sentence);
    const hitToks = new Set(tokens(match).map((t) => t.lower));
    for (const p of phraseLemmas) {
      if (p.at > pos) continue;
      for (let i = 0; i + p.words.length <= toks.length; i += 1) {
        if (!p.words.every((w, k) => toks[i + k].lower === w)) continue;
        const from = toks[i].index;
        const to = toks[i + p.words.length - 1].index + toks[i + p.words.length - 1].text.length;
        if (index >= from && index < to && [...hitToks].every((w) => p.words.includes(w) || FUNCTION_WORDS.has(w))) return true;
      }
    }
    return false;
  };

  let chunkSuppressed = 0;
  let instructionSuppressed = 0;
  const reportedOnce = new Set();
  /**
   * opts: metalanguage (advisory scope) · kind (the read surface's kind) · template (its Teil template) ·
   * chosen (production only: { gap: [from, to] } of a typed gap, or { quoted } of an error correction)
   */
  const check = (doc, pos, declared, text, path, surface, glosses = [], opts = {}) => {
    if (!text) return;
    const { metalanguage = false, kind = null, template = null, chosen = null } = opts;
    const seen = new Set();
    const frames = FRAME_KINDS.has(kind) ? frameSpans(text) : [];
    const inFrame = (at) => frames.some(([a, b]) => at >= a && at < b);
    // a hit in a sentence a frame opens (for the frame's object clause below): no sentence end between them
    const framedSentence = (at) => frames.some(([a]) => a <= at && !/[.!?]/.test(String(text).slice(a, at)));
    for (const det of detectors) {
      const place = placement.get(det.id);
      const licensedAt = surface === 'production' ? place.prod : place.rec;
      if (licensedAt === null || licensedAt <= pos) continue;
      if (place.points.some((p) => declared.has(p))) continue;
      // licensed as a chunk here (chunkFrom ≤ position): no finding (a1.1-u04 r4 F08 / r5 F05)
      if (place.chunk !== null && place.chunk <= pos) {
        chunkSuppressed += detectInText(det, text, env).length ? 1 : 0;
        continue;
      }
      // an article is reported only where the learner chooses it (RAILS §3.1c)
      const reportOn = withOverlay(det).spec?.reportOn;
      if (reportOn === 'chosen' && (surface !== 'production' || !chosen)) continue;
      for (const hit of detectInText(det, text, env)) {
        const key = `${det.id}|${path}`;
        if (seen.has(key)) continue;
        if (exempted(hit.match, exemptAt(pos, surface, declared))) continue;
        if (insidePhrase(hit.sentence, hit.index, hit.match, pos)) {
          instructionSuppressed += 1;
          continue;
        }
        if (reportOn === 'chosen') {
          const at = text.indexOf(hit.sentence) + hit.index;
          // the article (the hit's first token) is what the learner chooses: it must stand in the gap —
          // „ein ___" → „Land" types the noun after a printed article (a1.1-u01 ls3-p05/p06)
          const article = tokens(hit.match)[0];
          const artFrom = at + (article ? article.index : 0);
          const artTo = artFrom + (article ? article.text.length : String(hit.match).length);
          if (chosen.gap && !(artFrom < chosen.gap[1] && artTo > chosen.gap[0])) continue;
          if (chosen.quoted !== undefined && String(chosen.quoted).toLowerCase().includes(String(hit.match).toLowerCase())) continue;
        }
        if (metalanguage) {
          const sentAt = text.indexOf(hit.sentence);
          const at = sentAt + hit.index;
          const htoks = tokens(hit.match);
          const content = htoks.map((t) => t.lower).filter((w) => !FUNCTION_WORDS.has(w));
          let why = null;
          if (inFrame(at)) why = 'frame';
          // the can-do frame's object clause: „Sie können sagen, was Sie gern machen." (a1.1-u08 r2 F09 / r3 F10)
          else if (framedSentence(at) && /indirekt|Frage mit ob/i.test(det.construction || '') && /\b(?:sagen|fragen|erzählen|verstehen|zeigen|nennen|erklären),\s*$/u.test(hit.sentence.slice(0, hit.index))) why = 'frame';
          else if (template && inOrder(hit.match, templateText(template))) why = 'template';
          else if (htoks.length && ADDRESS_RE.test(htoks[0].text)) why = 'address';
          else if (content.length && content.every((w) => isMetalanguage(w))) why = 'metalanguage';
          // a one-word construction (welch-, können) in a task formula; a phrase hit („die Frage der
          // Partnerin") is content even inside a formula
          else if ((kind === 'prompt' || kind === 'option') && htoks.length === 1 && formulaClause(hit.sentence, hit.index, htoks)) why = 'formula';
          else if (lexicalChunk(hit.sentence, pos) && /reflexiv|trennbar/i.test(det.construction || '')) why = 'lexicon';
          if (why) {
            instructionSuppressed += 1;
            continue;
          }
        }
        seen.add(key);
        // glossed receptive exposure: an input may carry a later construction if its token is glossed
        if (surface !== 'production' && glosses.length) {
          const hitTokens = tokens(hit.match).map((t) => t.lower);
          if (hitTokens.some((t) => glosses.includes(t))) continue;
        }
        const exact = hit.precision === 'exact';
        const severity = exact && !metalanguage ? 'blocker' : 'advisory';
        const prec = exact ? '' : ` [${hit.precision}${hit.fallback ? ', shape fallback' : ''}]`;
        const verb = surface === 'production' ? 'produces' : surface === 'exam' ? 'exam text uses' : !metalanguage ? (kind === 'choice' ? 'a choice key uses' : 'input uses') : /^cards\[/.test(path) ? 'rule-card prose uses' : 'instruction uses';
        findings.push(finding(severity, opts.owner ? { file: opts.owner.file } : doc, opts.owner ? opts.owner.path : path,
          `${verb} „${hit.match}" (${det.construction}) — licensed ${surface === 'production' ? 'productively ' : ''}from ${describePosition(licensedAt)} (${list(place.points, 3)}), here ${describePosition(pos)}${prec}`,
          det.id));
      }
    }
  };

  /** Rule-card prose and model sentence, checked at the card's first use. */
  const checkCard = (card, i, file, pos) => {
    if (pos === null) return;
    const doc = { file };
    const declared = new Set([card?.spine].filter(Boolean));
    check(doc, pos, declared, String(card?.modelSentence || ''), `cards[${i}].modelSentence`, 'production');
    check(doc, pos, declared, String(card?.de || ''), `cards[${i}].de`, 'input', [], { metalanguage: true });
  };

  for (const doc of docs) {
    const pos = docPosition(doc);
    if (pos === null) continue;
    const unit = doc.kind === 'lanepack' ? ctx.levels.get(doc.level)?.units.get(parseUnitId(doc.data.unit)?.nr) : doc;
    const g = unit?.data?.spec?.grammar || {};
    const declared = new Set([...arr(g.new), ...arr(g.chunk), ...arr(g.review)]);
    for (const t of walkTexts(doc)) {
      const surface = t.kind === 'exam' ? 'exam' : 'input';
      // line by line so a finding points at the line
      if (t.lines.length) t.lines.forEach((l, i) => check(doc, pos, declared, String(l?.de || ''), `${t.path}.lines[${i}]`, surface, t.glosses.map((x) => x.toLowerCase())));
      if (t.writtenText) check(doc, pos, declared, t.writtenText, `${t.path}.text`, surface, t.glosses.map((x) => x.toLowerCase()));
      else if (!t.lines.length && t.de) check(doc, pos, declared, t.de, t.path, surface, t.glosses.map((x) => x.toLowerCase()));
    }
    // the instruction scope (strategy cards, instructionsDe, situationDe, title.canDo, Lernziele) and, from
    // stage I, the item surfaces and Redemittel labels — all advisory metalanguage
    const itemsToo = stageOf(doc) !== 'S';
    for (const sf of walkReadSurfaces(doc, { cando: ctx.registries.cando })) {
      // item surfaces, Redemittel labels, and the step and input titles (a1.1-u12 r1 F07)
      const itemSurface = ['prompt', 'option', 'explanation', 'rmFunction', 'stepTitle', 'inputTitle', 'hint'].includes(sf.kind);
      if (!sf.instruction && !(itemsToo && itemSurface)) continue;
      if (sf.owner) {
        const k = `${sf.owner.file}|${sf.owner.path}`;
        if (reportedOnce.has(k)) continue;
        reportedOnce.add(k);
      }
      // a choice item's options are its key's alternatives: the key is read at the receptive position below
      const partNr = sf.task ? sf.path.match(/\.parts\[(\d+)\]/) : null;
      const template = sf.task ? (partNr ? sf.task.parts?.[Number(partNr[1])]?.template : sf.task.template) : sf.template || null;
      // a typed item's stem is read with its gap filled: „Und was ___ du gegessen?" is a question, not a clause
      const text = sf.kind === 'prompt' && sf.item && !choiceItem(sf.item) && /_{2,}/.test(sf.de) && sf.item.answer ? sf.de.replace(/_{2,}/, String(sf.item.answer)) : sf.de;
      check(doc, pos, declared, text, sf.path, 'input', [], { metalanguage: true, kind: sf.kind, template, owner: sf.owner });
    }
    if (doc.kind === 'unit') {
      const shown = [...walkTexts(doc)].flatMap((t) => (t.kind === 'input' || t.kind === 'folge' ? [t.de] : []));
      arr(doc.data.redemittel).forEach((r) => shown.push(String(r?.de || '')));
      const text = shown.join('\n');
      arr(g.chunk).forEach((pid, i) => {
        if (!text.trim()) return;
        const dets = detectors.filter((dd) => placement.get(dd.id)?.points.includes(pid));
        const forms = introducedForms(spine.get(pid)?.point, FUNCTION_WORDS);
        if (!dets.length && !forms.size) {
          notes.push(`${doc.data.id}: chunk ${pid} has no detector and no label forms — its presentation is left to review`);
          return;
        }
        const byDet = dets.some((dd) => detectInText(dd, text, env).length);
        const byForm = tokens(text).some((t) => forms.has(t.lower));
        if (!byDet && !byForm) findings.push(finding('blocker', doc, `spec.grammar.chunk[${i}]`, `the unit declares the chunk ${pid} but no input line or Redemittel presents it`, pid));
      });
      // a unit's own run reports the rule cards it is the first of its level to show (a1.1-u05 r2 F09 / r3 F07);
      // a level run reports every card below
      if (mode === 'file') {
        const slot = ctx.levels.get(doc.level);
        const cards = arr(slot?.ruleCards?.cards);
        if (cards.length) {
          const first = new Map();
          for (const u of slot.units.values()) {
            for (const { step } of walkSteps(u)) if (step?.ruleCard && (!first.has(step.ruleCard) || first.get(step.ruleCard) > u.nr)) first.set(step.ruleCard, u.nr);
          }
          cards.forEach((card, i) => { if (first.get(card?.id) === doc.nr) checkCard(card, i, slot.ruleCards.file, pos); });
        }
      }
    }
    if (stageOf(doc) === 'S') continue; // stage S: texts only; items and expected answers arrive with I (BLUEPRINT §9)
    for (const p of walkProduction(doc)) {
      const item = p.item;
      // a choice item's key is read, not written: the receptive position licenses it (RAILS §3.1c)
      if (item && choiceItem(item)) {
        check(doc, pos, declared, p.de, p.path, 'input', [], { kind: 'choice' });
        continue;
      }
      let chosen = null;
      if (item && p.kind === 'answer') {
        if (item.type === 'error_correction') {
          const q = String(item.promptDe || '').match(/[„"‚]([^“"‘]+)[“"‘]/);
          chosen = { quoted: q ? q[1] : '' };
        } else if (/_{2,}/.test(String(item.promptDe || ''))) {
          // the gap filled with this answer: the article is chosen where the hit overlaps the gap
          const prompt = String(item.promptDe);
          const at = prompt.search(/_{2,}/);
          const gapLen = (prompt.slice(at).match(/^_+/) || [''])[0].length;
          const filled = `${prompt.slice(0, at)}${p.de}${prompt.slice(at + gapLen)}`.replace(/\s*\([^)]*\)\s*$/, '');
          check(doc, pos, declared, filled, p.path, 'production', [], { chosen: { gap: [at, at + p.de.length] } });
          continue;
        }
      }
      check(doc, pos, declared, p.de, p.path, 'production', [], { chosen });
    }
    if (doc.kind === 'unit') {
      const lines = arr(doc.data.check?.lines);
      lines.forEach((l, i) => check(doc, pos, declared, String(l?.de || ''), `check.lines[${i}]`, 'input'));
    }
  }

  // rule cards (level scope): the model sentence is a production line at the card's first use
  if (mode !== 'file') {
    for (const slot of levels) {
      const cards = arr(slot.ruleCards?.cards);
      if (!cards.length) continue;
      const firstUse = new Map();
      for (const doc of slot.units.values()) {
        for (const { step } of walkSteps(doc)) {
          if (!step?.ruleCard) continue;
          const p = positionOf(slot.level, doc.nr);
          if (!firstUse.has(step.ruleCard) || firstUse.get(step.ruleCard) > p) firstUse.set(step.ruleCard, p);
        }
      }
      cards.forEach((card, i) => {
        const intro = spine.get(card?.spine)?.point?.intro;
        const pos = firstUse.get(card?.id) ?? positionOf(parseUnitId(intro?.productive || intro?.receptive)?.level || slot.level, parseUnitId(intro?.productive || intro?.receptive)?.nr ?? 12);
        if (pos === null || !LEVELS.includes(slot.level)) return;
        checkCard(card, i, slot.ruleCards.file, pos);
      });
    }
  }
  if (chunkSuppressed) notes.push(`${chunkSuppressed} hit(s) of constructions licensed as a chunk at their position not reported (chunkFrom ≤ here)`);
  if (instructionSuppressed) notes.push(`${instructionSuppressed} hit(s) on instruction surfaces not reported: the can-do frame, the Teil template's own wording, the address register „Ihr-", metalanguage, or a lexicon verb taught as a word (RAILS §3.1c)`);
  return { findings, notes };
}
