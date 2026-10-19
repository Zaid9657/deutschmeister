// THE LESEN SURFACE GATE (DaF review #11, MAJOR M8; frozen by Codex before the authored units were
// written — docs/course-factory/a12-rebuild/DESIGN-m8-lesen-2026-10-19.md, verdicts 1 and 2).
//
// A Lesen unit as the learner sees it: a printed `text`, a `question`, two `options` in their displayed
// order. `answer` is read only AFTER every strategy has picked, to score it. Each strategy below uses only
// what is printed. A paper of four units passes when every strategy — and every one-condition switch
// between two of them — scores at most 2 of 4 (a tie counts ½), and the 16 papers of a level at most 32
// of 64 for each. These are the project's acceptance limits, not a Goethe standard; an algorithm that
// really resolves who did what is allowed to score 4 — that is reading.
//
// Independent of the builder: nothing here imports src/lib/checkpoint or reads how a unit was made.

const TOKEN_RE = /[\p{L}\p{N}]+/gu;
export const tokens = (s) => (String(s || '').toLowerCase().match(TOKEN_RE) || []);

const NUMBER_WORDS = {
  null: 0, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
  elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18,
  neunzehn: 19, zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80,
  neunzig: 90, hundert: 100,
};
const numberOf = (t) => {
  if (/^\d+$/.test(t)) return Number(t);
  if (t in NUMBER_WORDS) return NUMBER_WORDS[t];
  const m = /^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/.exec(t);
  return m ? NUMBER_WORDS[m[1]] + NUMBER_WORDS[m[2]] : null;
};
const NEGATION = new Set(['nicht', 'nie', 'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines', 'nichts', 'niemand']);
const FUNCTION = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'aber',
  'ist', 'sind', 'hat', 'haben', 'in', 'im', 'am', 'an', 'auf', 'zu', 'zum', 'zur', 'mit', 'von', 'vom', 'für', 'nach', 'bei', 'auch',
  'wer', 'was', 'wo', 'wann', 'wie', 'wohin', 'woher', 'welche', 'welcher', 'welches', 'viel', 'viele', 'es', 'er', 'sie', 'ich', 'du',
  'wir', 'ihr', 'man', 'nicht', 'ja', 'nein', 'so', 'sehr', 'noch', 'schon', 'heute', 'dann']);
// A crude normaliser for „taught-verb-normalized" comparison: the inflection a reader would ignore.
const stem = (t) => (t.length <= 3 ? t : t.replace(/(?:est|en|em|er|es|st|e|t|n|s)$/u, ''));

const sentencesOf = (text) => String(text || '').split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
const NAME_RE = /^(?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+$/;
const isName = (o) => NAME_RE.test(String(o).trim());

// The parts of a text a "named person" shortcut reads: speaker labels („Ana: …"), a salutation („Liebe
// Lena," / „Hallo Tim,"), a signature (a name alone on the last line, or after „Gruß/Grüße").
function layout(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const speakers = [];
  for (const l of lines) { const m = /^((?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+):\s/.exec(l); if (m) speakers.push({ name: m[1], words: tokens(l.slice(m[0].length)).length }); }
  const salutation = /^(?:Liebe|Lieber|Hallo|Hi|Sehr geehrte|Sehr geehrter)\s+((?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+)/.exec(lines[0] || '')?.[1] || null;
  const last = lines[lines.length - 1] || '';
  const signature = (/^((?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+)[.!]?$/.exec(last) || /(?:Gruß|Grüße),?\s+((?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+)\s*$/.exec(last))?.[1] || null;
  const body = lines.map((l) => l.replace(/^((?:(?:Herr|Frau)\s+)?[A-ZÄÖÜ][a-zäöüß]+):\s/, '')).join(' ');
  return { lines, speakers, salutation, signature, body };
}
const countIn = (hay, needle) => {
  const h = tokens(hay);
  const n = tokens(needle);
  if (!n.length) return 0;
  let c = 0;
  for (let i = 0; i + n.length <= h.length; i += 1) if (n.every((t, j) => h[i + j] === t)) c += 1;
  return c;
};
const firstAt = (hay, needle) => {
  const h = tokens(hay);
  const n = tokens(needle);
  for (let i = 0; i + n.length <= h.length; i += 1) if (n.every((t, j) => h[i + j] === t)) return i;
  return Infinity;
};
const lastAt = (hay, needle) => {
  const h = tokens(hay);
  const n = tokens(needle);
  for (let i = h.length - n.length; i >= 0; i -= 1) if (n.every((t, j) => h[i + j] === t)) return i;
  return -Infinity;
};

// A strategy maps a unit to the INDEX it picks (0 or 1) or null for a tie. `prefer(a, b, more)` turns two
// scores into a pick: the higher one when `more`, the lower one otherwise.
const prefer = (a, b, more = true) => (a === b || a == null || b == null || Number.isNaN(a) || Number.isNaN(b) ? null : (a > b) === more ? 0 : 1);
const both = (u, f) => [f(u.options[0], u), f(u.options[1], u)];

function baseStrategies(names) {
  const S = {};
  const add = (name, f) => { S[name] = f; };
  const textTok = (u) => new Set(tokens(u.text));
  // ── review #11's family, both preferences ──
  for (const more of [true, false]) {
    const tag = more ? '+' : '−';
    add(`Zahl${tag}`, (u) => prefer(...both(u, (o) => tokens(o).filter((t) => numberOf(t) !== null && textTok(u).has(t)).length), more));
    add(`Wörter${tag}`, (u) => prefer(...both(u, (o) => tokens(o).filter((t) => textTok(u).has(t)).length), more));
    add(`Anteil${tag}`, (u) => prefer(...both(u, (o) => { const t = tokens(o); return t.length ? t.filter((x) => textTok(u).has(x)).length / t.length : 0; }), more));
    add(`Satznähe${tag}`, (u) => prefer(...both(u, (o) => {
      const t = tokens(o);
      if (!t.length) return 0;
      return Math.max(0, ...sentencesOf(u.text).map((s) => { const st = new Set(tokens(s)); return t.filter((x) => st.has(x)).length / t.length; }));
    }), more));
    add(`Verbform${tag}`, (u) => prefer(...both(u, (o) => tokens(o).filter((t) => /(?:e|st|t|en)$/.test(t) && !FUNCTION.has(t) && textTok(u).has(t) && !/^[A-ZÄÖÜ]/.test(t)).length), more));
    // ── answer presentation ──
    add(`Länge Zeichen${tag}`, (u) => prefer(u.options[0].length, u.options[1].length, more));
    add(`Länge Wörter${tag}`, (u) => prefer(tokens(u.options[0]).length, tokens(u.options[1]).length, more));
    add(`Zahlwert${tag}`, (u) => prefer(...both(u, (o) => tokens(o).map(numberOf).find((v) => v !== null) ?? null), more));
    add(`Negation${tag}`, (u) => prefer(...both(u, (o) => Number(tokens(o).some((t) => NEGATION.has(t)))), more));
    add(`Alphabet${tag}`, (u) => { const [a, b] = u.options.map((o) => o.toLowerCase()); return a === b ? null : (a < b) === more ? 0 : 1; });
    // ── named persons and candidate details in the text ──
    add(`zuerst im Text${tag}`, (u) => prefer(...both(u, (o) => -firstAt(u.text, o)), more));
    add(`zuletzt im Text${tag}`, (u) => prefer(...both(u, (o) => lastAt(u.text, o)), more));
    add(`Häufigkeit${tag}`, (u) => prefer(...both(u, (o) => countIn(u.text, o)), more));
    add(`Häufigkeit ohne Sprecher${tag}`, (u) => prefer(...both(u, (o) => countIn(layout(u.text).body, o)), more));
    add(`im Text überhaupt${tag}`, (u) => prefer(...both(u, (o) => Number(countIn(u.text, o) > 0)), more));
    add(`im Fließtext${tag}`, (u) => prefer(...both(u, (o) => Number(countIn(layout(u.text).body, o) > 0)), more));
    add(`Sprecher Wortzahl${tag}`, (u) => prefer(...both(u, (o) => layout(u.text).speakers.filter((s) => s.name === o).reduce((n, s) => n + s.words, 0)), more));
    add(`Sprecher Züge${tag}`, (u) => prefer(...both(u, (o) => layout(u.text).speakers.filter((s) => s.name === o).length), more));
  }
  add('A', () => 0);
  add('B', () => 1);
  add('erster Sprecher', (u) => { const f = layout(u.text).speakers[0]?.name; return f ? prefer(Number(u.options[0] === f), Number(u.options[1] === f)) : null; });
  add('letzter Sprecher', (u) => { const s = layout(u.text).speakers; const f = s[s.length - 1]?.name; return f ? prefer(Number(u.options[0] === f), Number(u.options[1] === f)) : null; });
  add('Anrede', (u) => { const f = layout(u.text).salutation; return f ? prefer(Number(u.options[0] === f), Number(u.options[1] === f)) : null; });
  add('Unterschrift', (u) => { const f = layout(u.text).signature; return f ? prefer(Number(u.options[0] === f), Number(u.options[1] === f)) : null; });
  // ── question-conditioned: the option in the sentence closest (or farthest) to the question ──
  for (const by of ['Zahl', 'Anteil']) {
    for (const extreme of ['nächster', 'fernster']) {
      for (const norm of ['wörtlich', 'normalisiert']) {
        for (const fw of ['mit Funktionswörtern', 'ohne Funktionswörter']) {
          add(`Frage→Satz ${by} ${extreme} ${norm} ${fw}`, (u) => {
            const prep = (s) => tokens(s).filter((t) => fw === 'mit Funktionswörtern' || !FUNCTION.has(t)).map((t) => (norm === 'normalisiert' ? stem(t) : t));
            const q = new Set(prep(u.question));
            const scored = sentencesOf(u.text).map((s) => { const st = prep(s); const hit = st.filter((t) => q.has(t)).length; return { s, v: by === 'Zahl' ? hit : st.length ? hit / st.length : 0 }; });
            if (!scored.length) return null;
            const target = extreme === 'nächster' ? Math.max(...scored.map((x) => x.v)) : Math.min(...scored.map((x) => x.v));
            const chosen = scored.filter((x) => x.v === target).map((x) => x.s).join(' ');
            return prefer(Number(countIn(chosen, u.options[0]) > 0), Number(countIn(chosen, u.options[1]) > 0));
          });
        }
      }
    }
  }
  for (const more of [true, false]) {
    // Read in the BODY: a speaker label („Tim:") stands next to the end of the line before it, so in an
    // exchange the label of the next speaker would always be the „nearest name" — layout, not a cue.
    add(`Abstand zu Fragewörtern${more ? ' fern' : ' nah'}`, (u) => {
      const h = tokens(layout(u.text).body);
      const q = new Set(tokens(u.question).filter((t) => !FUNCTION.has(t)));
      const qAt = h.map((t, i) => (q.has(t) ? i : -1)).filter((i) => i >= 0);
      if (!qAt.length) return null;
      const dist = (o) => {
        const n = tokens(o);
        let best = Infinity;
        for (let i = 0; i + n.length <= h.length; i += 1) if (n.every((t, j) => h[i + j] === t)) best = Math.min(best, ...qAt.map((k) => Math.abs(k - i)));
        return best;
      };
      return prefer(...both(u, dist), more);
    });
  }
  // ── fixed name-priority orders over every name the paper offers ──
  const perms = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  for (const order of names.length <= 6 ? perms(names) : []) {
    add(`Namensrang ${order.join('>')}`, (u) => {
      const r = u.options.map((o) => order.indexOf(o));
      if (r.some((x) => x < 0)) return null;
      return r[0] === r[1] ? null : r[0] < r[1] ? 0 : 1;
    });
  }
  return S;
}

// The one-condition switches: a printed feature of the item chooses between two strategies.
const CONDITIONS = {
  'Text verneint': (u) => tokens(u.text).some((t) => NEGATION.has(t)),
  'Ja/Doch': (u) => tokens(u.text).some((t) => t === 'ja' || t === 'doch'),
  Nein: (u) => tokens(u.text).includes('nein'),
  Fragezeichen: (u) => String(u.text).includes('?'),
  Zahl: (u) => tokens(u.text).some((t) => numberOf(t) !== null),
  Personenfrage: (u) => u.options.every(isName),
};

const scoreOf = (pick, u) => (pick === null ? 0.5 : u.options[pick] === u.answer ? 1 : 0);
const mark = (pick, u) => (pick === null ? 'T' : u.options[pick] === u.answer ? 'R' : 'W');
export const CONDITION_NAMES = Object.keys(CONDITIONS);
export const conditionsOf = (u) => Object.fromEntries(Object.entries(CONDITIONS).map(([n, c]) => [n, c(u)]));

/**
 * auditPapers(papers) → per paper the strategies that score above 2 of 4, the worst one, and the worst
 * one-condition switch; over all papers the strategy totals. Every base strategy runs with ties as ½ and,
 * as its own strategy, with ties broken to A and to B — a tie the key's position settles is a cue too.
 * `outcomes` gives R/W/T per unit for each failing strategy, so an author sees what to change.
 */
export function auditPapers(papers, { limit = 2 } = {}) {
  const names = [...new Set(papers.flat().flatMap((u) => u.options.filter(isName)))];
  const base = baseStrategies(names);
  const all = {};
  for (const [n, f] of Object.entries(base)) {
    all[n] = f;
    all[`${n} (Gleichstand→A)`] = (u) => f(u) ?? 0;
    all[`${n} (Gleichstand→B)`] = (u) => f(u) ?? 1;
  }
  const entries = Object.entries(all);
  const totals = new Map();
  const report = [];
  for (const paper of papers) {
    const picks = entries.map(([n, f]) => [n, paper.map((u) => f(u))]);
    const scoresOf = (p) => paper.reduce((sum, u, i) => sum + scoreOf(p[i], u), 0);
    const failing = [];
    let worst = { score: -1, name: '' };
    for (const [n, p] of picks) {
      const sc = scoresOf(p);
      totals.set(n, (totals.get(n) || 0) + sc);
      if (sc > worst.score) worst = { score: sc, name: n };
      if (sc > limit) failing.push({ name: n, score: sc, outcomes: paper.map((u, i) => mark(p[i], u)).join('') });
    }
    let worstSwitch = { score: -1, name: '' };
    for (const [c, cond] of Object.entries(CONDITIONS)) {
      const on = paper.map((u) => cond(u));
      if (on.every((x) => x === on[0])) continue;
      const best = (want) => picks.reduce((b, [n, p]) => {
        const sc = paper.reduce((sum, u, i) => sum + (on[i] === want ? scoreOf(p[i], u) : 0), 0);
        return sc > b.score ? { score: sc, name: n } : b;
      }, { score: -1, name: '' });
      const yes = best(true);
      const no = best(false);
      const sc = yes.score + no.score;
      if (sc > worstSwitch.score) worstSwitch = { score: sc, name: `„${c}" ? ${yes.name} : ${no.name}` };
    }
    report.push({ worst, worstSwitch, failing, passes: worst.score <= limit && worstSwitch.score <= limit });
  }
  const worstTotal = [...totals.entries()].reduce((w, [n, sc]) => (sc > w.score ? { score: sc, name: n } : w), { score: -1, name: '' });
  return { papers: report, totals, worstTotal };
}
