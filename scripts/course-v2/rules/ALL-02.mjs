// ALL-02 — 3–5 registry can-dos per unit, each with source tags and band; ≥ 1 productive can-do
// proven by an Aufgabe; „Das kann ich" (check.proofs) lists exactly the unit's can-dos, each
// linked to a proof item or an Aufgabe; the Lernziele box shows exactly the unit's can-dos.
//
// Rail extensions (rule-smith 2026-09-27):
//   - a proof item's key is not the answer of a Check item of the same unit — the Check would hand the
//     learner the proof (review a2.1-u04 r2 F05);
//   - a productive or interactive can-do proven by an item alone (reviews b2.1-u04 r1 F02, a2.1-u04 r2
//     F05) and an Aufgabe whose texts name none of the can-do's function verbs (fragen, vorschlagen,
//     bewerten …; reviews a1.1-u04 r1 F07, a1.2-u04 r1 F07, a2.1-u04 r1/r2 F04) are ADVISORIES: SCHEMA
//     Check.proofs names only item or aufgabe (no micro-output), and the SCHEMA §15 worked example proves
//     the interaction can-do cd.a2.rueckruf-weitergeben by an item — the SCHEMA owner decides first;
//   - every spec.textTypes entry is the text type of something the unit shows or asks for — an input,
//     an exam text, a block's or a task's Teil template (review a2.1-u04 r3 F09; advisory, minor).
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c):
//   - the vorstellen/beschreiben function (a1.1-u03 r1 F04 / r2 F08 / r3 F09); the task's cues are read from
//     its situation, instructions, cards, moves, Leitpunkte, hintWords and the AI partner's persona — never its
//     model turns; a function whose verb the unit cannot use yet („erzählen" before its unit) is also met by
//     the can-do's own content nouns on a card or among the hintWords („Familie", „Eltern");
//   - an interaction can-do proven by an item alone is a RATCHET when no speaking Aufgabe or spoken
//     micro-output of the unit names its function (a1.1-u01 r1 F02, u06 r1 F06) — the proof mechanism
//     cannot yet name a micro-output, so the unit must at least perform the function somewhere;
//   - a can-do about the learner's OWN data („meine Angaben", „über mich") proven by a form task that
//     copies a stimulus text about someone else (sd1.s1: fixed field answers) is an ADVISORY (a1.1-u02 r1 F03);
//   - a proof by Aufgabe whose rubric scores no criterion for the can-do's function (a1.1-u02 r2 F05 / r3 F05:
//     cd.a1.nachfragen by sd1-sp1, whose criteria are vorstellen, buchstabieren, nummer) and a productive
//     can-do whose object noun no card, move, Leitpunkt or persona names (a1.1-u05 r1 F03) are ADVISORIES.

import { walkSteps, walkItems, walkTasks, speakingParts } from '../lib-validate/walk.mjs';
import { arr, blocker, advisory, ratchet, list } from '../lib-validate/helpers.mjs';
import { norm } from '../lib-validate/text.mjs';
import { walkMicroOutputs } from '../lib-validate/walk.mjs';
import { unitPosition } from '../lib-validate/ids.mjs';
import { allLexicon } from '../lib-validate/context.mjs';

/** Function verbs of a can-do → cues its Aufgabe's texts must carry (stems, lower case). */
const FUNCTIONS = [
  [/\bfragen\b|\berfragen\b|nachfragen/i, ['frag', '?']],
  [/\bantworten\b|\bbeantworten\b|\breagieren\b/i, ['antwort', 'reagier']],
  [/\bbitten\b/i, ['bitt']],
  [/vorschlagen|vorschläge/i, ['vorschlag', 'schlagen', 'vorschläge']],
  [/bewerten|beurteilen|sagen, wie .* gefällt|meinung/i, ['bewert', 'gefällt', 'finden', 'meinung', 'gut', 'beurteil']],
  [/beschweren|reklamieren/i, ['beschwer', 'reklam']],
  [/berichten|erzählen/i, ['bericht', 'erzähl']],
  [/vereinbaren|absprechen|planen/i, ['vereinbar', 'termin', 'plan', 'absprech']],
  [/vorstellen|beschreiben/i, ['vorstell', 'beschreib', 'alt', 'beruf', 'mach', 'wer ', 'name', 'woher', 'wohn']],
];
/** The verbs a function is named by, for the „not yet allocated" check. */
const FUNCTION_VERBS = { berichten: ['erzählen', 'berichten'], vorstellen: ['vorstellen', 'sich vorstellen', 'beschreiben'] };
const CONTENT_STOP = new Set(['ich', 'sie', 'du', 'es', 'wir', 'ihr', 'er']);
const fnName = (re) => re.source.split('|')[0].replace(/\\b/g, '');

/** The can-do's content nouns (capitalised, ≥ 4 letters, not the opening „Ich"), lower case. */
export function canDoNouns(text) {
  return [...new Set((String(text || '').match(/(?<![„\p{L}])\p{Lu}\p{Ll}{3,}/gu) || []).map((w) => w.toLowerCase()).filter((w) => !CONTENT_STOP.has(w)))];
}

/**
 * What a can-do asks of the learner's own turns that they do not show: „ask" (a learner turn with „?"),
 * „answer" (a learner statement), „ask „wie spät …?"" (the W-word of a „fragen, wie spät …" clause in a learner question).
 */
export function learnerTurnGaps(canDo, turns) {
  const text = String(canDo || '');
  const out = [];
  const asks = turns.some((x) => /\?\s*$/.test(x));
  const answers = turns.some((x) => !/\?\s*$/.test(x.trim()));
  if (/\bfragen\b|\berfragen\b|nachfragen/i.test(text) && !asks) out.push('ask (no learner turn is a question)');
  if (/\bantworten\b|\bbeantworten\b|\breagieren\b/i.test(text) && !answers) out.push('answer (every learner turn is a question)');
  // „fragen, wie spät es ist": a learner question carries the W-word (with its adverb: „wie spät", „wie viel")
  const w = text.match(/\b(?:fragen|erfragen|nachfragen)\s*,\s*(wie viel|wie|wo|wann|was|wer|woher|wohin|welche\p{L}*)\s+(\p{Ll}+)/iu);
  if (w) {
    const words = [w[1].toLowerCase(), ...(/^(?:spät|viel|lange|oft|alt|weit|teuer)$/.test(w[2]) ? [w[2]] : [])];
    const phrase = new RegExp(`(?<![\\p{L}])${words.join('\\s+')}(?![\\p{L}])`, 'iu');
    if (!turns.some((x) => /\?\s*$/.test(x) && phrase.test(x))) out.push(`ask with the can-do's own „${words.join(' ')} …?" („fragen, ${w[1]} ${w[2]} …")`);
  }
  return out;
}

export const id = 'ALL-02';
export const title = 'Can-dos: 3–5 per unit, tagged, proven; ≥ 1 productive proven by an Aufgabe';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const PRODUCTIVE = /^(productive|interaction)-/;
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data.spec) continue;
    units += 1;
    const d = doc.data;
    const canDos = arr(d.spec.canDos);
    if (canDos.length < 3 || canDos.length > 5) findings.push(blocker(doc, 'spec.canDos', `${canDos.length} can-dos (need 3–5)`, d.id));
    const dup = canDos.filter((c, i) => canDos.indexOf(c) !== i);
    if (dup.length) findings.push(blocker(doc, 'spec.canDos', `can-do listed twice: ${list(new Set(dup))}`, d.id));
    const reg = ctx.registries.cando;
    for (const [i, c] of canDos.entries()) {
      const e = reg?.get(c)?.item;
      if (!e) continue; // resolution is REF-01's
      if (!arr(e.source).length) findings.push(blocker(doc, `spec.canDos[${i}]`, `can-do ${c} has no source tags in the registry`, c));
      if (!e.band) findings.push(blocker(doc, `spec.canDos[${i}]`, `can-do ${c} has no band in the registry`, c));
      if (e.halfLevel && e.halfLevel !== doc.level) notes.push(`${c} is registered for ${e.halfLevel}, used in ${doc.level}`);
    }
    if (d.start && !sameSet(arr(d.start.lernziele), canDos)) {
      findings.push(blocker(doc, 'start.lernziele', 'the Lernziele box must list exactly spec.canDos', d.id));
    }
    const tts = arr(d.spec.textTypes);
    if (tts.length && arr(d.steps).length) {
      const used = new Set();
      const collect = (o) => {
        if (Array.isArray(o)) o.forEach(collect);
        else if (o && typeof o === 'object') {
          if (typeof o.textType === 'string') used.add(o.textType);
          if (typeof o.template === 'string') {
            const t = ctx.registries.templates.get(o.template)?.template;
            if (t?.textType) used.add(t.textType);
          }
          for (const [k, v] of Object.entries(o)) if (k !== 'check' && k !== 'spec') collect(v);
        }
      };
      collect(d.start);
      collect(d.steps);
      collect(d.spec.lanes);
      tts.forEach((tt, i) => { if (!used.has(tt)) findings.push(advisory(doc, `spec.textTypes[${i}]`, `${tt} is listed but no input, exam text or Teil template of the unit is of that type`, tt)); });
    }
    if (!d.check) continue;
    const proofs = arr(d.check.proofs);
    const proven = proofs.map((p) => p?.canDo);
    if (!sameSet(proven, canDos)) {
      const missing = canDos.filter((c) => !proven.includes(c));
      const extra = proven.filter((c) => !canDos.includes(c));
      findings.push(blocker(doc, 'check.proofs', `„Das kann ich" must list exactly the unit's can-dos${missing.length ? `; unproven: ${list(missing)}` : ''}${extra.length ? `; not the unit's: ${list(extra)}` : ''}`, d.id));
    }
    const stepKinds = new Set([...walkSteps(doc)].map((s) => s.step?.kind));
    // a micro-output proof (SCHEMA §8, 2026-09-28): the learner's own output, resolved against the unit's micro-outputs
    const moIds = new Set([...walkMicroOutputs(doc)].map(({ mo }) => mo?.id).filter(Boolean));
    proofs.forEach((p, i) => {
      if (!p?.item && !p?.aufgabe && !p?.microOutput) findings.push(blocker(doc, `check.proofs[${i}]`, `proof of ${p?.canDo} names neither an item, an Aufgabe nor a micro-output`, p?.canDo));
      if (p?.aufgabe && !stepKinds.has(p.aufgabe)) findings.push(blocker(doc, `check.proofs[${i}].aufgabe`, `proof by "${p.aufgabe}" but the unit has no ${p.aufgabe} step`, p?.canDo));
      if (p?.microOutput && moIds.size && !moIds.has(p.microOutput)) findings.push(blocker(doc, `check.proofs[${i}].microOutput`, `proof by micro-output "${p.microOutput}", which is not a micro-output of the unit`, p?.canDo));
    });
    // a proof item's key given away by a Check item of the same unit
    const proofItems = new Map(arr(d.check.proofItems).map((it) => [it?.id, it]));
    const checkAnswers = new Map();
    for (const { item } of walkItems(doc)) if (item?.role === 'check' || arr(d.check.items).includes(item)) checkAnswers.set(norm(item?.answer), item?.id);
    proofs.forEach((p, i) => {
      const it = p?.item ? proofItems.get(p.item) : null;
      if (!it || !it.answer || norm(it.answer).length < 3) return;
      const hit = checkAnswers.get(norm(it.answer));
      if (hit && hit !== it.id) findings.push(blocker(doc, `check.proofs[${i}]`, `proof item ${it.id}'s key „${it.answer}" is also the answer of Check item ${hit} — the Check hands the learner the proof`, p.canDo));
    });
    if (reg) {
      const tasks = [...walkTasks(doc)];
      const here = unitPosition(d.id);
      // what the unit's speaking tasks and spoken micro-outputs say (the interaction-function check)
      const spoken = JSON.stringify([
        ...tasks.filter((x) => x.kind === 'speaking').map(({ task }) => [task.aiRole?.personaDe, task.hintWords, ...speakingParts(task).map(({ part }) => [part?.situationDe, part?.instructionsDe, part?.cards, part?.moves])]),
        ...[...walkMicroOutputs(doc)].filter(({ mo }) => mo?.mode === 'spoken').map(({ mo }) => [mo.situationDe, mo.promptDe]),
      ]).toLowerCase();
      const lexicon = allLexicon(ctx);
      // the nouns the unit itself allocates (singular and plural), for the can-do object check
      const unitNouns = new Set(lexicon.filter((x) => x?.unit === d.id && x.pos === 'NOUN').flatMap((x) => [String(x.lemma).replace(/^(?:der|die|das)\s+/i, ''), typeof x.plural === 'string' ? x.plural : '']).filter(Boolean).map((w) => w.toLowerCase()));
      const firstAt = (lemma) => {
        const at = lexicon.filter((x) => String(x?.lemma || '').toLowerCase() === lemma).map((x) => unitPosition(x.unit)).filter((x) => x !== null);
        return at.length ? Math.min(...at) : null;
      };
      proofs.forEach((p, i) => {
        const e = reg.get(p?.canDo)?.item;
        if (!e) return;
        const fns = FUNCTIONS.filter(([re]) => re.test(String(e.de || '')));
        if (p?.item && !p?.aufgabe && !p?.microOutput && PRODUCTIVE.test(String(e.mode || ''))) {
          // an interaction can-do the unit never performs in speech: a ratchet (a1.1-u01 r1 F02, u06 r1 F06)
          const performed = !fns.length || fns.some(([, cues]) => cues.some((c) => spoken.includes(c)));
          if (/^interaction-spoken/.test(String(e.mode)) && !performed) findings.push(ratchet(doc, `check.proofs[${i}]`, `${p.canDo} is ${e.mode}, proven by an item alone, and no speaking task or spoken micro-output of the unit names its function (${fns.map(([re]) => fnName(re)).join(', ')}) — add a card, move or spoken micro-output that performs it, and prove it by the Aufgabe`, p.canDo));
          else findings.push(advisory(doc, `check.proofs[${i}]`, `${p.canDo} is ${e.mode}, proven by an item alone — prove it by an Aufgabe or the micro-output that performs it (Check.proofs[].microOutput)`, p.canDo));
        }
        if (!p?.aufgabe) return;
        const t = tasks.find((x) => (p.aufgabe === 'sprechen' ? x.kind === 'speaking' : x.kind === 'writing'));
        if (!t) return;
        const parts = t.kind === 'speaking' ? speakingParts(t.task).map((x) => x.part) : [t.task];
        const said = JSON.stringify([...parts.map((x) => [x?.situationDe, x?.instructionsDe, x?.taskDe, x?.cards, x?.moves, x?.leitpunkte]), t.task.hintWords, t.task.aiRole?.personaDe]).toLowerCase();
        const onCards = JSON.stringify([...parts.map((x) => [x?.cards, x?.leitpunkte]), t.task.hintWords]).toLowerCase();
        const nouns = canDoNouns(e.de);
        const byContent = nouns.some((w) => onCards.includes(w));
        const missing = fns.filter(([re, cues]) => {
          if (cues.some((c) => said.includes(c))) return false;
          // a function verb the unit cannot use yet is met by the can-do's own content on a card (u03 r3 F09)
          const key = re.source.includes('bericht') ? 'berichten' : re.source.includes('vorstell') ? 'vorstellen' : null;
          const verbs = key ? FUNCTION_VERBS[key] : [];
          const notYet = verbs.length > 0 && verbs.every((v) => {
            const at = firstAt(v);
            return at === null || here === null || at > here;
          });
          return !(notYet && byContent);
        });
        if (missing.length) findings.push(advisory(doc, `check.proofs[${i}]`, `the ${p.aufgabe} task proving ${p.canDo} names none of the cues for ${missing.map(([re]) => fnName(re)).join(', ')} („${String(e.de).slice(0, 80)}")`, p.canDo));
        // own data proven by copying someone else's (a1.1-u02 r1 F03; SCHEMA §8: prove it by the own-data micro-output)
        const ownData = /(?:meine[nrms]?\s+(?:Angaben|Daten|Namen|Adresse|Telefonnummer)|über mich|von mir)(?![\p{L}])/iu.test(String(e.de || ''));
        if (ownData && t.kind === 'writing' && arr(t.task.form?.fields).some((f) => String(f?.answer || '').trim())) {
          findings.push(advisory(doc, `check.proofs[${i}]`, `${p.canDo} is about the learner's own data („${String(e.de).slice(0, 60)}…"), but the proving form task copies fixed answers from a text about someone else — prove it with a task whose data are the learner's own, or by that micro-output (Check.proofs[].microOutput)`, p.canDo));
        }
        // the rubric scores the function (a1.1-u02 r2 F05)
        if (fns.length && t.kind === 'speaking') {
          const criteria = parts.flatMap((x) => arr(ctx.registries.rubrics?.get(x?.profile)?.data?.criteria)).map((c) => `${c?.id} ${c?.label}`.toLowerCase());
          const moves = parts.flatMap((x) => arr(x?.moves)).join(' ').toLowerCase();
          const scored = !criteria.length || fns.some(([, cues]) => cues.map((c) => c.trim()).filter((c) => c.length >= 3).some((c) => criteria.some((x) => x.includes(c)) || moves.includes(c)));
          if (!scored) findings.push(advisory(doc, `check.proofs[${i}]`, `the rubric of the ${p.aufgabe} task proving ${p.canDo} (${[...new Set(parts.map((x) => x?.profile))].join(', ')}) scores no criterion for its function (${fns.map(([re]) => fnName(re)).join(', ')}) — prove it by a task that scores it, or by its proof item`, p.canDo));
        }
        // the learner's own model turns perform the functions of an interaction can-do (a1.1-u10 r1 F07, the
        // u04 r1-F07 class: cd.a1.platz-frei needs a learner question AND a learner answer) and carry its fixed
        // W-phrase („fragen, wie spät es ist" → a turn „Wie spät ist es?", a1.1-u07 r1 F02) — ADVISORY
        if (t.kind === 'speaking' && /^interaction-/.test(String(e.mode || ''))) {
          const mine = arr(t.task.modelTurns).filter((x) => x?.speaker === 'learner').map((x) => String(x?.de || ''));
          if (mine.length) {
            const gaps = learnerTurnGaps(`${e.de || ''} ${e.learnerDe || ''}`, mine);
            if (gaps.length) findings.push(advisory(doc, `check.proofs[${i}]`, `the learner's model turns of the task proving ${p.canDo} never ${gaps.join(' and never ')} — a model turn of the learner's own shows the function the can-do names`, p.canDo));
          }
        }
        // the object of a productive can-do — a noun of the can-do the unit itself allocates („Zimmer", „Möbel"
        // at a1.1-u05) — is named somewhere in the task (a1.1-u05 r1 F03)
        const objects = nouns.filter((w) => unitNouns.has(w));
        if (/^(?:productive|interaction)-spoken/.test(String(e.mode || '')) && t.kind === 'speaking' && objects.length) {
          const partnerTurns = arr(t.task.modelTurns).filter((x) => x?.speaker === 'partner').map((x) => x?.de);
          const hay = `${said} ${JSON.stringify(partnerTurns).toLowerCase()}`;
          if (!objects.some((w) => hay.includes(w))) findings.push(advisory(doc, `check.proofs[${i}]`, `no card, move, Leitpunkt, persona or partner turn of the task proving ${p.canDo} names what the can-do is about (${objects.slice(0, 4).join(', ')})`, p.canDo));
        }
      });
      const productiveByAufgabe = proofs.some((p) => p?.aufgabe && PRODUCTIVE.test(String(reg.get(p.canDo)?.item?.mode || '')));
      const modesKnown = canDos.every((c) => reg.get(c)?.item?.mode);
      if (modesKnown && !productiveByAufgabe) findings.push(blocker(doc, 'check.proofs', 'no productive or interactive can-do is proven by an Aufgabe (sprechen/schreiben)', d.id));
    }
  }
  return units ? { findings, notes } : { findings, skipped: 'no unit spec in the target yet' };
}
