// Wave 4 / A2.1 listening additions — self-check.
// Run: node S/wave4/listening/verify.mjs
import { readFileSync } from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const rows = JSON.parse(readFileSync(here('./questions-a2.1-additions.json'), 'utf8'));
const edits = JSON.parse(readFileSync(here('./existing-row-edits.json'), 'utf8'));
const source = JSON.parse(readFileSync(here('../source/listening-a2.1.json'), 'utf8'));

let errors = 0;
const err = (m) => { console.log('ERROR: ' + m); errors++; };
const warn = (m) => { console.log('WARN: ' + m); };

// ---------------------------------------------------------------- source index
const exById = {};          // exercise_number -> source exercise
const transcriptOf = {};    // `${ex}:${dialogue}` -> lowercased transcript text
const sentencesOf = {};     // `${ex}:${dialogue}` -> lowercased sentences of that transcript
const liveByEx = {};        // exercise_number -> live questions
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
for (const ex of source) {
  exById[ex.exercise_number] = ex;
  liveByEx[ex.exercise_number] = ex.questions || [];
  for (const d of ex.dialogues) {
    const key = `${ex.exercise_number}:${d.dialogue_number}`;
    transcriptOf[key] = norm(d.transcript.map((t) => t.text).join(' '));
    sentencesOf[key] = d.transcript
      .flatMap((t) => t.text.split(/(?<=[.?!])\s+/))
      .map(norm)
      .filter((x) => x.length > 3);
  }
}

// Which transcript sentences does a question's explanation quote? (Round 2: the fact-level
// duplicate check the review asked for — two items testing the same sentence of the same
// dialogue are the same fact even when their stems read differently.)
function quotedSentences(exN, dialogueNumber, explanation) {
  const sents = sentencesOf[`${exN}:${dialogueNumber}`] || [];
  const hits = new Set();
  for (const m of String(explanation || '').matchAll(/"([^"]+)"/g)) {
    const q = norm(m[1]).replace(/[.?!]+$/, '');
    sents.forEach((sent, i) => {
      const bare = sent.replace(/[.?!]+$/, '');
      if (bare.includes(q) || q.includes(bare)) hits.add(i);
    });
  }
  return hits;
}

// A2.1 level constraint: nothing from the banned list may show up in a learner-facing
// stem. (Explanations quote the transcript verbatim and are exempt from the Nebensatz
// scan — the quoted audio is passive recognition, allowed by level-a2.1.md.)
const BANNED_STEM = [
  ' weil ', ' dass ', ' wenn ', ' obwohl ', ' während ', ' um zu ', ' ob ',
  'würde', 'werden wir', 'größer als', 'besser als', 'sich freu', 'anmelden',
];

if (rows.length !== 78) err(`expected 78 rows, got ${rows.length}`);

const byEx = {};
for (const r of rows) (byEx[r.exercise_number] ??= []).push(r);
if (Object.keys(byEx).length !== 6) err(`expected 6 exercises, got ${Object.keys(byEx).length}`);

const wordCount = (s) => s.trim().split(/\s+/).length;
const digitsOnly = (s) => String(s).toLowerCase()
  .replace(/€/g, '').replace(/\beuro\b/g, '').replace(/\buhr\b/g, '')
  .replace(/[.,:\-/\s]/g, '').replace(/h$/, '');

for (const [exN, list] of Object.entries(byEx)) {
  const src = exById[exN];
  if (!src) { err(`ex${exN}: no such exercise in source`); continue; }

  // ---- counts, numbering, ids
  if (list.length !== 13) err(`ex${exN}: expected 13 rows, got ${list.length}`);
  const nums = list.map((r) => r.question_number).sort((a, b) => a - b);
  const expected = Array.from({ length: 13 }, (_, i) => i + 11);
  if (JSON.stringify(nums) !== JSON.stringify(expected)) err(`ex${exN}: question_numbers ${nums}`);
  for (const r of list) {
    if (r.exercise_id !== src.id) err(`ex${exN} q${r.question_number}: exercise_id ${r.exercise_id} != ${src.id}`);
    if (!Number.isInteger(r.dialogue_number) || r.dialogue_number < 1 || r.dialogue_number > 10) {
      err(`ex${exN} q${r.question_number}: dialogue_number ${r.dialogue_number} out of range`);
    }
  }

  // ---- type mix 5 / 5 / 3
  const t = {};
  for (const r of list) t[r.question_type] = (t[r.question_type] || 0) + 1;
  if (t.multiple_choice !== 5) err(`ex${exN}: ${t.multiple_choice} multiple_choice, expected 5`);
  if (t.richtig_falsch !== 5) err(`ex${exN}: ${t.richtig_falsch} richtig_falsch, expected 5`);
  if (t.dictation !== 3) err(`ex${exN}: ${t.dictation} dictation, expected 3`);

  // ---- option shape + correct_answer inside the option key set
  for (const r of list) {
    const tag = `ex${exN} q${r.question_number}`;
    if (r.question_type === 'multiple_choice') {
      if (!Array.isArray(r.options) || r.options.length !== 3) err(`${tag}: MC needs 3 options`);
      else {
        const keys = r.options.map((o) => (o.match(/^([a-c])\) \S/) || [])[1]);
        if (JSON.stringify(keys) !== JSON.stringify(['a', 'b', 'c'])) err(`${tag}: option prefixes ${JSON.stringify(r.options)}`);
        if (!keys.includes(r.correct_answer)) err(`${tag}: correct_answer "${r.correct_answer}" not an option key`);
      }
      if (r.acceptable_answers !== null) err(`${tag}: MC acceptable_answers must be null`);
    } else if (r.question_type === 'richtig_falsch') {
      if (JSON.stringify(r.options) !== JSON.stringify(['Richtig', 'Falsch'])) err(`${tag}: rf options ${JSON.stringify(r.options)}`);
      if (!['Richtig', 'Falsch'].includes(r.correct_answer)) err(`${tag}: rf correct_answer "${r.correct_answer}"`);
      if (r.acceptable_answers !== null) err(`${tag}: rf acceptable_answers must be null`);
    } else if (r.question_type === 'dictation') {
      if (r.options !== null) err(`${tag}: dictation options must be null`);
      if (!Array.isArray(r.acceptable_answers) || r.acceptable_answers.length < 3) err(`${tag}: dictation needs >=3 acceptable_answers`);
      if (!r.acceptable_answers.includes(r.correct_answer)) err(`${tag}: correct_answer not in acceptable_answers`);
      // the dictation target must be sayable: the answer, or one of its variants,
      // appears verbatim in the transcript of the dialogue it points at.
      const tr = transcriptOf[`${exN}:${r.dialogue_number}`] || '';
      const variants = [r.correct_answer, ...r.acceptable_answers].map((v) => String(v).toLowerCase());
      if (!variants.some((v) => tr.includes(v))) err(`${tag}: no variant of "${r.correct_answer}" is spoken in ex${exN} d${r.dialogue_number}`);
      // Round 2: every numeric dictation must also accept the fully spelled-out form —
      // the matcher's digit collapsing never reaches a word-only answer.
      if (/\d/.test(r.correct_answer) && !r.acceptable_answers.some((v) => !/\d/.test(v))) {
        err(`${tag}: numeric answer has no spelled-out variant in acceptable_answers`);
      }
      // the stem must not print its own answer
      if ((r.question_text.match(/\d+/g) || []).some((d) => digitsOnly(d) === digitsOnly(r.correct_answer))) {
        err(`${tag}: dictation stem prints its own answer`);
      }
    } else {
      err(`${tag}: unknown question_type ${r.question_type}`);
    }

    // ---- learner-facing German: length + banned grammar
    if (wordCount(r.question_text) > 12) err(`${tag}: stem ${wordCount(r.question_text)} words > 12: "${r.question_text}"`);
    const padded = ' ' + r.question_text.toLowerCase() + ' ';
    for (const bad of BANNED_STEM) if (padded.includes(bad)) err(`${tag}: banned "${bad.trim()}" in "${r.question_text}"`);
    for (const o of r.options || []) {
      if (wordCount(o) > 8) err(`${tag}: option too long: "${o}"`);
    }
    if (!/[.?]$/.test(r.question_text)) err(`${tag}: stem has no final . or ?`);
    if (r.question_type === 'richtig_falsch' && r.question_text.endsWith('?')) err(`${tag}: rf item is a question, must be a statement`);
    if (r.question_type !== 'richtig_falsch' && r.question_text.endsWith('.') && r.question_type === 'multiple_choice') err(`${tag}: MC stem is not a question`);
    if (!r.explanation || !r.explanation.includes('"')) err(`${tag}: explanation must quote the transcript line`);
  }

  // ---- explanation quotes must really be in the target dialogue
  for (const r of list) {
    const tr = transcriptOf[`${exN}:${r.dialogue_number}`] || '';
    for (const m of r.explanation.matchAll(/"([^"]+)"/g)) {
      const quote = m[1].toLowerCase().replace(/[.?!]+$/, '').trim();
      if (!tr.includes(quote)) err(`ex${exN} q${r.question_number}: quote "${m[1]}" not in ex${exN} d${r.dialogue_number}`);
    }
  }

  // ---- no duplicate stems inside the exercise (new rows AND against the live 10)
  const seen = new Map();
  for (const r of list) {
    const k = r.question_text.toLowerCase();
    if (seen.has(k)) err(`ex${exN}: duplicate question_text "${r.question_text}"`);
    seen.set(k, r.question_number);
  }
  for (const live of liveByEx[exN]) {
    if (seen.has(live.question_text.toLowerCase())) err(`ex${exN}: new stem duplicates live q${live.question_number}`);
  }

  // ---- fact-level duplicates: a new item may not rest on the same transcript sentence
  // as a live item on the same dialogue (stem text can differ and the fact still be the
  // same — this is what a pure string comparison cannot see).
  const liveFacts = liveByEx[exN].map((q) => ({
    n: q.question_number, d: q.dialogue_number,
    sents: quotedSentences(exN, q.dialogue_number, q.explanation),
  }));
  const newFacts = list.map((r) => ({
    n: r.question_number, d: r.dialogue_number,
    sents: quotedSentences(exN, r.dialogue_number, r.explanation),
  }));
  // One reviewed exception: ex6 d7 states BOTH Sprechzeiten in a single long sentence
  // ("… von acht bis zwölf Uhr und … zusätzlich von fünfzehn bis achtzehn Uhr"), so the
  // two clock-time dictations q21/q22 necessarily share it. Neither item can be answered
  // from the other, which is the test this check exists to enforce.
  const FACT_SHARING_EXCEPTIONS = new Set(['6:21+22']);
  const excepted = (a, b) => FACT_SHARING_EXCEPTIONS.has(`${exN}:${Math.min(a, b)}+${Math.max(a, b)}`);
  for (const f of newFacts) {
    if (f.sents.size === 0) err(`ex${exN} q${f.n}: explanation quotes no whole transcript sentence`);
    for (const lf of liveFacts) {
      if (lf.d !== f.d) continue;
      const shared = [...f.sents].filter((i) => lf.sents.has(i));
      if (shared.length) err(`ex${exN} q${f.n}: same transcript sentence as live q${lf.n} (d${f.d}) — duplicate fact`);
    }
    for (const g of newFacts) {
      if (g.n >= f.n || g.d !== f.d) continue;
      const shared = [...f.sents].filter((i) => g.sents.has(i));
      if (shared.length && !excepted(f.n, g.n)) err(`ex${exN} q${f.n}: same transcript sentence as new q${g.n} (d${f.d}) — duplicate fact`);
    }
  }

  // ---- dialogue spread: every dialogue used, none more than 3 times
  const perDialogue = {};
  for (const r of list) perDialogue[r.dialogue_number] = (perDialogue[r.dialogue_number] || 0) + 1;
  for (let d = 1; d <= 10; d++) {
    if (!perDialogue[d]) err(`ex${exN}: dialogue ${d} gets no new question`);
    if (perDialogue[d] > 3) err(`ex${exN}: dialogue ${d} gets ${perDialogue[d]} new questions (>3)`);
  }

  // ---- MC key spread: a, b and c each used at least once
  const mcKeys = list.filter((r) => r.question_type === 'multiple_choice').map((r) => r.correct_answer);
  for (const k of ['a', 'b', 'c']) if (!mcKeys.includes(k)) err(`ex${exN}: MC keys ${mcKeys} never use "${k}"`);
  const rCount = list.filter((r) => r.question_type === 'richtig_falsch' && r.correct_answer === 'Richtig').length;
  if (rCount !== 2 && rCount !== 3) err(`ex${exN}: ${rCount} Richtig among 5 rf items (want 2 or 3)`);

  // ---- give-away scan: a dictation answer (digits OR spelled) printed by another
  // question on the same dialogue — new rows and the live 10 alike.
  const others = [...list, ...liveByEx[exN].map((q) => ({ ...q, question_number: `live${q.question_number}` }))];
  for (const d of list.filter((r) => r.question_type === 'dictation')) {
    const target = digitsOnly(d.correct_answer);
    const spelled = [d.correct_answer, ...d.acceptable_answers].filter((v) => !/\d/.test(v)).map((v) => v.toLowerCase());
    for (const o of others) {
      if (o.question_number === d.question_number) continue;
      if (o.dialogue_number !== d.dialogue_number) continue;
      const hay = [o.question_text, ...(o.options || [])].join(' ');
      if ((hay.match(/\d+(?:[.,]\d+)?/g) || []).some((n) => digitsOnly(n) === target)) {
        err(`ex${exN} q${d.question_number}: answer "${d.correct_answer}" is printed by q${o.question_number}`);
      }
      const hayLower = hay.toLowerCase();
      if (spelled.some((s) => s.length > 3 && hayLower.includes(s))) {
        err(`ex${exN} q${d.question_number}: spelled answer leaked into q${o.question_number}: "${hay}"`);
      }
    }
  }
}

// ---- RF answer grid: each of q12/14/16/18/20 is Richtig in exactly 3 of the 6 exercises
for (const pos of [12, 14, 16, 18, 20]) {
  const vals = rows.filter((r) => r.question_number === pos).map((r) => r.correct_answer);
  if (vals.length !== 6) err(`position q${pos}: ${vals.length} rows, expected 6`);
  const n = vals.filter((v) => v === 'Richtig').length;
  if (n !== 3) warn(`position q${pos}: ${n} Richtig across the six exercises (target 3)`);
}

// ---- existing-row edits: id must exist, `old` byte-exact, field allowed
// The brief allows options/correct_answer/question_text/explanation, but the tool that
// consumes this file — scripts/listening-questions-from-json.mjs — throws
// "only the 'options' field is supported" for anything else, so an edit on another field
// would pass review and then break the migration build. Whitelist = what actually ships.
const ALLOWED_EDIT_FIELDS = new Set(['options']);
const liveById = {};
for (const ex of source) for (const q of ex.questions || []) liveById[q.id] = q;
for (const e of edits) {
  const live = liveById[e.id];
  if (!live) { err(`edit ${e.id}: no such live question`); continue; }
  if (!ALLOWED_EDIT_FIELDS.has(e.field)) err(`edit ${e.id}: field "${e.field}" not editable`);
  if (JSON.stringify(live[e.field]) !== JSON.stringify(e.old)) {
    err(`edit ${e.id}: "old" is not byte-exact (live: ${JSON.stringify(live[e.field])})`);
  }
  if (JSON.stringify(e.old) === JSON.stringify(e.new)) err(`edit ${e.id}: new == old`);
  if (e.field === 'options') {
    const keys = e.new.map((o) => (o.match(/^([a-c])\) \S/) || [])[1]);
    if (JSON.stringify(keys) !== JSON.stringify(['a', 'b', 'c'])) err(`edit ${e.id}: new options malformed`);
    if (!keys.includes(live.correct_answer)) err(`edit ${e.id}: correct_answer no longer an option key`);
  }
}

console.log(
  errors === 0
    ? `OK: 0 errors — ${rows.length} rows, ${Object.keys(byEx).length} exercises, ${edits.length} existing-row edit(s)`
    : `FAILED: ${errors} errors`,
);
process.exit(errors === 0 ? 0 : 1);
