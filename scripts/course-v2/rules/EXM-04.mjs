// EXM-04 — speaking tasks, part by part (a task may be a multi-Teil round of 2–3 parts): mode =
// the template's interaction; preparation minutes = the template's (else the lane's) and
// prepAtHome as the template; cards / moves / keyPoints present where the mode needs them; the
// template's `speaking` design — stimulus, partnerData (the AI partner's side), topicChoice
// (from/pick and that many topics), seconds and turns within its band; the rubric profile of the
// template; a planning round in every B1 unit (BLUEPRINT §9.1, §2.8; SCHEMA §8 SpeakingPart).
//
// Rail extensions (rule-smith 2026-09-27):
//   - ga2.sp1 (Goethe A2 Sprechen Teil 1, cards-ask): a card is a keyword with „?" and no „Thema:"
//     prefix (blocker); a card of more than two words, or a Thema in situationDe, is advisory — the
//     SCHEMA §15 exemplar has both („Weg zur Arbeit?", „zum Thema Arbeit"), so the SCHEMA owner confirms
//     the format first (review a2.1-u04 r1);
//   - two calendars (stimulus + partnerData, ga2.sp3 „Termin finden"): the same day, ≥ 5 timed entries
//     each, and exactly ONE common free window of ≥ 90 minutes between the day's first and last entry
//     (review a2.2-u04 r1 F07);
//   - tb1.m2 (the partner's sheet is hidden): stimulus.items holds exactly one quote, the learner's, and
//     the partner's sheet is in aiRole.personaDe (review b1.1-u04 r2 F02).
//
// Reduced parts (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u01 r1 F01). A part graded
// with a profile of SEPARATE performances (criteria scored `per: 'part'`, e.g. sd1-sp1: vorstellen,
// buchstabieren, nummer) elicits each of them — its instructionsDe, situationDe, cards, the AI partner's
// persona or opening line name it, not in a negated clause („kein Buchstabieren") — or the unit declares the
// omission: its Prüfungsfokus entry for the template has length 'reduced'. A criterion scored but never
// asked for grades the learner on a performance nobody requested: BLOCKER while the entry says 'full';
// with 'reduced' an ADVISORY (the grader still scores the criterion — SCHEMA has no criteria subset yet).

import { walkTasks, speakingParts } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

const WEEKDAYS = /\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)\b/i;
const minutes = (h, m) => Number(h) * 60 + Number(m || 0);

/** A calendar's timed entries as [from, to] minutes („8.00–9.30 Uhr: …", „14 bis 15 Uhr"). */
export function calendarSlots(items) {
  const out = [];
  for (const it of arr(items)) {
    const m = String(it).match(/(\d{1,2})(?:[.:](\d{2}))?\s*(?:–|-|bis)\s*(\d{1,2})(?:[.:](\d{2}))?/);
    if (m) out.push([minutes(m[1], m[2]), minutes(m[3], m[4])]);
  }
  return out;
}

/** Common free windows of two calendars between the first and the last entry: [[from, to]]. */
export function commonFreeWindows(a, b) {
  const busy = [...a, ...b].sort((x, y) => x[0] - y[0]);
  if (!busy.length) return [];
  const out = [];
  let t = busy[0][0];
  for (const [from, to] of busy) {
    if (from > t) out.push([t, from]);
    t = Math.max(t, to);
  }
  return out;
}

/** Cue stems a criterion is asked for by (its id's stem, plus the words an instruction uses for it). */
const CRITERION_CUES = { nummer: ['nummer', 'zahl', 'telefon', 'postleitzahl'], vorstellen: ['vorstell', 'stichw', 'name'], buchstabieren: ['buchstabier'] };
export function criterionCues(criterion) {
  const key = String(criterion?.id || '').toLowerCase();
  if (CRITERION_CUES[key]) return CRITERION_CUES[key];
  const idStem = key.replace(/ieren$/, 'ier').replace(/(?:en|n)$/, '');
  return idStem.length >= 4 ? [idStem] : [];
}
/** Is a cue named in `text` outside a negated phrase („kein Buchstabieren", „keine Zahl", „nicht buchstabieren")? */
export function elicits(text, cues) {
  const t = String(text || '').toLowerCase();
  return cues.some((c) => {
    for (const m of t.matchAll(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))) {
      const before = t.slice(Math.max(0, m.index - 12), m.index);
      if (!/\b(?:kein|keine|keinen|nicht|ohne)\s+(?:\p{L}+\s+)?$/u.test(before)) return true;
    }
    return false;
  });
}

/** A criterion that names a task: its label ends in an infinitive („Eine Nummer nennen"). */
export const isPerformance = (c) => /(?:^|\s)\p{Ll}+(?:en|ern|eln)$/u.test(String(c?.label || '').trim());

export const id = 'EXM-04';
export const title = 'Speaking tasks match their template (mode, preparation, cards/moves, stimulus, length, rubric)';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'T';

const within = (inner, outer) => Array.isArray(inner) && inner.length === 2 && Array.isArray(outer) && outer.length === 2
  && inner[0] <= inner[1] && inner[0] >= outer[0] && inner[1] <= outer[1];

function checkPart(ctx, doc, part, path, ref, findings) {
  if (['cards-ask', 'cards-request'].includes(part.mode)) {
    if (!isObj(part.cards) || !arr(part.cards.learner).length || !arr(part.cards.partner).length) findings.push(blocker(doc, `${path}.cards`, `mode ${part.mode} needs cards for the learner and the partner`, ref));
  }
  if (part.mode === 'plan-together' && !arr(part.moves).length) findings.push(blocker(doc, `${path}.moves`, 'plan-together needs its moves (vorschlagen, reagieren, …)', ref));
  if (part.template === 'ga2.sp1' && isObj(part.cards)) {
    for (const side of ['learner', 'partner']) {
      arr(part.cards[side]).forEach((c, i) => {
        const card = String(c || '').trim();
        if (!/\?$/.test(card) || card.includes(':')) findings.push(blocker(doc, `${path}.cards.${side}[${i}]`, `„${card}" — a ga2.sp1 card is a keyword with „?" and no topic prefix`, ref));
        else if (card.split(/\s+/).length > 2) findings.push(advisory(doc, `${path}.cards.${side}[${i}]`, `„${card}" — a ga2.sp1 card is one keyword („Wohnort?")`, ref));
      });
    }
    if (/\bThema\b/.test(String(part.situationDe || ''))) findings.push(advisory(doc, `${path}.situationDe`, 'ga2.sp1 („Fragen zur Person") has no Thema; the Thema belongs to Goethe A1 Teil 2', ref));
  }
  if (part.stimulus?.kind === 'calendar' && part.partnerData?.kind === 'calendar') {
    const mine = calendarSlots(part.stimulus.items);
    const theirs = calendarSlots(part.partnerData.items);
    const d1 = (String(part.stimulus.de || '').match(WEEKDAYS) || [])[1];
    const d2 = (String(part.partnerData.de || '').match(WEEKDAYS) || [])[1];
    if (d1 && d2 && d1.toLowerCase() !== d2.toLowerCase()) findings.push(blocker(doc, `${path}.partnerData.de`, `the two calendars are for different days (${d1} / ${d2})`, ref));
    if (mine.length < 5 || theirs.length < 5) findings.push(blocker(doc, `${path}.stimulus.items`, `calendars with ${mine.length} and ${theirs.length} timed entries (need ≥ 5 each)`, ref));
    const windows = commonFreeWindows(mine, theirs).filter(([a, b]) => b - a >= 90);
    if (windows.length !== 1) findings.push(blocker(doc, `${path}.partnerData.items`, `${windows.length} common free windows of ≥ 90 minutes (need exactly one)`, ref));
  }
  if (part.template === 'tb1.m2' && isObj(part.stimulus)) {
    if (arr(part.stimulus.items).length !== 1) findings.push(blocker(doc, `${path}.stimulus.items`, `${arr(part.stimulus.items).length} quotes on the learner's sheet; in tb1.m2 the learner sees only their own (the partner's sheet is hidden)`, ref));
  }
  if (part.mode === 'mediate' && !arr(part.keyPoints).length) findings.push(blocker(doc, `${path}.keyPoints`, 'mode mediate is scored on coverage: keyPoints are required', ref));
  const entry = ctx.registries.templates.get(part.template);
  if (!entry) return;
  const t = entry.template;
  if (t.task !== 'speaking') {
    findings.push(blocker(doc, `${path}.template`, `${part.template} is a ${t.task} Teil, not a speaking Teil`, ref));
    return;
  }
  if (t.interaction && part.mode !== t.interaction) findings.push(blocker(doc, `${path}.mode`, `mode ${part.mode}; ${part.template} is ${t.interaction}`, ref));
  const lanePrep = ctx.registries.lanes.get(entry.lane)?.data?.modules?.sprechen?.prepMinutes;
  const want = typeof t.prepMinutes === 'number' ? t.prepMinutes : lanePrep;
  if (typeof want === 'number' && part.prepMinutes !== want) findings.push(blocker(doc, `${path}.prepMinutes`, `${part.prepMinutes} min preparation; ${part.template} has ${want}`, ref));
  if (Boolean(part.prepAtHome) !== Boolean(t.prepAtHome)) findings.push(blocker(doc, `${path}.prepAtHome`, `prepAtHome ${Boolean(part.prepAtHome)}; ${part.template} ${t.prepAtHome ? 'is prepared at home' : 'is prepared in the session'}`, ref));
  if (t.rubric && part.profile !== t.rubric) findings.push(blocker(doc, `${path}.profile`, `rubric profile ${part.profile}; ${part.template} is graded with ${t.rubric}`, ref));
  const sp = isObj(t.speaking) ? t.speaking : null;
  if (!sp) return;
  if (sp.stimulus && !['none', 'topicChoice'].includes(sp.stimulus)) {
    if (!isObj(part.stimulus)) findings.push(blocker(doc, `${path}.stimulus`, `${part.template} works from a ${sp.stimulus} stimulus; the part has none`, ref));
    else if (part.stimulus.kind !== sp.stimulus) findings.push(blocker(doc, `${path}.stimulus.kind`, `stimulus ${part.stimulus.kind}; ${part.template} uses ${sp.stimulus}`, ref));
  } else if (sp.stimulus === 'none' && isObj(part.stimulus)) {
    findings.push(blocker(doc, `${path}.stimulus`, `${part.template} has no stimulus`, ref));
  }
  if (sp.partnerData === true && !isObj(part.partnerData)) findings.push(blocker(doc, `${path}.partnerData`, `${part.template} is an information gap: the AI partner's data are required`, ref));
  if (sp.partnerData === false && isObj(part.partnerData)) findings.push(blocker(doc, `${path}.partnerData`, `${part.template} has no partner data`, ref));
  const tc = sp.topicChoice || (sp.stimulus === 'topicChoice' ? {} : null);
  if (tc) {
    const p = part.topicChoice;
    if (!isObj(p)) findings.push(blocker(doc, `${path}.topicChoice`, `${part.template} lets the candidate choose a topic; topicChoice is required`, ref));
    else {
      if (typeof tc.from === 'number' && p.from !== tc.from) findings.push(blocker(doc, `${path}.topicChoice.from`, `choice from ${p.from}; ${part.template} offers ${tc.from}`, ref));
      if (typeof tc.pick === 'number' && p.pick !== tc.pick) findings.push(blocker(doc, `${path}.topicChoice.pick`, `pick ${p.pick}; ${part.template} picks ${tc.pick}`, ref));
      if (arr(p.topics).length !== p.from) findings.push(blocker(doc, `${path}.topicChoice.topics`, `${arr(p.topics).length} topics for a choice from ${p.from}`, ref));
    }
  } else if (isObj(part.topicChoice)) {
    findings.push(blocker(doc, `${path}.topicChoice`, `${part.template} has no topic choice`, ref));
  }
  for (const k of ['seconds', 'turns']) {
    if (Array.isArray(sp[k]) && part[k] !== undefined && !within(part[k], sp[k])) findings.push(blocker(doc, `${path}.${k}`, `${k} [${arr(part[k]).join(', ')}] outside ${part.template}'s band [${sp[k].join(', ')}]`, ref));
  }
}

// a request needs a request form: „bitte", „Kann ich …", „Können Sie …", „Ich möchte …" (a1.1-u10 r2 F05, the
// u04 r1-F14 class): the cards-request Teil scores the request, and „Haben Sie Wasser für mich?" is a question
export const REQUEST_RE = /\b(?:bitte|kann ich|könnte ich|können Sie|könnten Sie|kannst du|könntest du|ich möchte|ich hätte gern|hätten Sie|darf ich|würden Sie|würdest du|gib mir|geben Sie mir)\b/iu;
const ASKS_FOR_ME_RE = /\b(?:für mich|mir)\b/iu;
// a W-question asks for information („Wie heißt das auf Deutsch?"), not for a thing
const W_START_RE = /^\s*(?:wer|wen|wem|was|wo|wohin|woher|wann|wie|warum|welche\p{L}*)\b/iu;
const lastQuestion = (de) => (String(de || '').match(/[^.!?]*\?\s*$/) || [''])[0];

/** Lines a cards-request Teil offers the learner that end in „?" and carry no request form. */
export function bareRequests(doc, task, isCardsRequest) {
  const out = [];
  const d = doc.kind === 'unit' ? doc.data : null;
  arr(d?.redemittel).forEach((r, i) => {
    if (!isCardsRequest(r?.forTemplate)) return;
    const q = lastQuestion(r?.de);
    if (q && !W_START_RE.test(q) && !REQUEST_RE.test(String(r.de))) out.push({ path: `redemittel[${i}].de`, de: r.de });
  });
  // untagged lines (hint words, model turns): only a question asking for something for the speaker
  arr(task?.hintWords).forEach((h, i) => {
    const de = String(h || '');
    if (/\?\s*$/.test(de) && ASKS_FOR_ME_RE.test(de) && !REQUEST_RE.test(de)) out.push({ path: `hintWords[${i}]`, de });
  });
  arr(task?.modelTurns).forEach((t, i) => {
    const de = String(t?.de || '');
    if (/\?\s*$/.test(de) && ASKS_FOR_ME_RE.test(de) && !REQUEST_RE.test(de)) out.push({ path: `modelTurns[${i}].de`, de });
  });
  return out;
}

export function run({ ctx, docs }) {
  const findings = [];
  let tasks = 0;
  for (const doc of docs) {
    for (const { task, kind, path, source } of walkTasks(doc)) {
      if (kind !== 'speaking') continue;
      tasks += 1;
      const ref = task.bankKey;
      const parts = speakingParts(task);
      if (Array.isArray(task.parts) && (task.parts.length < 2 || task.parts.length > 3)) findings.push(blocker(doc, `${path}.parts`, `${task.parts.length} parts; a multi-Teil round has 2–3`, ref));
      for (const { part, path: pp } of parts) {
        if (!isObj(part)) continue;
        const entry = ctx.registries.templates.get(part.template);
        if (entry && task.lane && task.lane !== entry.lane) findings.push(blocker(doc, `${path}${pp}.template`, `task lane ${task.lane}, template ${part.template} belongs to ${entry.lane}`, ref));
        checkPart(ctx, doc, part, `${path}${pp}`, ref, findings);
        // every separate performance the profile scores is asked for, or the Teil is declared reduced
        // a performance criterion is a task, labelled with an infinitive („Ein Wort buchstabieren"); a quality
        // criterion is a noun („Aussprache", „Aufgabenerfüllung") and applies to whatever the part elicits
        const criteria = arr(ctx.registries.rubrics?.get(part.profile)?.data?.criteria).filter((c) => c?.per === 'part' && isPerformance(c));
        if (criteria.length >= 2) {
          const asked = [part.instructionsDe, part.situationDe, JSON.stringify(part.cards || ''), task.aiRole?.personaDe, part.aiRole?.personaDe, task.openingLine].join(' ');
          const missing = criteria.filter((c) => !elicits(asked, criterionCues(c)));
          if (missing.length) {
            const fokus = arr((doc.kind === 'unit' ? doc.data : null)?.spec?.lanes?.pruefungsfokus).find((f) => f?.template === part.template && f?.slot === 'sprechen');
            const reduced = fokus?.length === 'reduced' || fokus?.length === 'mini';
            const msg = `${part.profile} scores ${missing.map((c) => `„${c.id}"`).join(', ')}, but the part never asks for ${missing.length > 1 ? 'them' : 'it'} (instructionsDe, situationDe, cards, persona, openingLine)`;
            if (reduced) findings.push(advisory(doc, `${path}${pp}.profile`, `${msg} — the Prüfungsfokus entry says '${fokus.length}', but the grader still scores ${missing.length > 1 ? 'them' : 'it'} (SCHEMA has no criteria subset yet)`, ref));
            else findings.push(blocker(doc, `${path}${pp}.instructionsDe`, `${msg} — the learner is graded on a performance nobody requested; ask for it, or set the Prüfungsfokus entry of ${part.template} to length 'reduced'`, ref));
          }
        }
        if (part.template === 'tb1.m2' && !/Blatt|Meinung/.test(String(task.aiRole?.personaDe || part.aiRole?.personaDe || ''))) {
          findings.push(blocker(doc, `${path}.aiRole.personaDe`, 'tb1.m2: the partner\'s sheet (its quote) belongs in aiRole.personaDe', ref));
        }
      }
      // a cards-request Teil: its request lines carry a request form — ADVISORY
      const isCardsRequest = (tpl) => ctx.registries.templates.get(tpl)?.template?.interaction === 'cards-request';
      if (parts.some(({ part }) => isCardsRequest(part?.template))) {
        for (const b of bareRequests(doc, task, isCardsRequest)) {
          const at = b.path.startsWith('redemittel') ? b.path : `${path}.${b.path}`;
          findings.push(advisory(doc, at, `„${b.de}" is offered for the cards-request Teil but is a bare question — a request carries „bitte", „Kann ich …?", „Können Sie …?" or „Ich möchte …"`, ref));
        }
      }
      if (String(doc.level).startsWith('b1') && doc.kind === 'unit' && source === 'ls5') {
        const hasRound = [task, ...parts.map((x) => x.part)].some((x) => isObj(x?.planningRound) && x.planningRound.minutes >= 3);
        if (!hasRound) findings.push(blocker(doc, `${path}.planningRound`, 'every B1 unit carries a planning round of ≥ 3 min', ref));
      }
    }
  }
  return tasks ? { findings } : { findings, skipped: 'no speaking task in the target yet' };
}
