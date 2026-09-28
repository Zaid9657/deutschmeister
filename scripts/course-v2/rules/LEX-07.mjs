// LEX-07 — one gloss per lemma across surfaces; feminine pairs one entry; plural_kind set on
// nouns; wordId null in authoring (BLUEPRINT §9.1, SCHEMA §6).
//
// Duplicates (SCHEMA §6: „an entry may only allocate a lemma that no lower level has allocated"; a
// receptive → productive change is a `promotions` record): the SAME id allocated again at a higher level
// is reported on the higher entry only — the lower file is right. The same lemma under two plain ids is
// reported on the later one. A homograph (`lx.x-2`) is legitimate beside `lx.x` when its gloss differs;
// it is reported only when it repeats a gloss of the same lemma (rule-smith 2026-09-27: the rule used to
// report the plain entry of every valid homograph pair, e.g. a1.2 lx.ueberweisung beside b1.1 lx.ueberweisung-2).
//
// An entry's `example` is read by the learner at the entry's unit, so it stays under that unit's grammar
// ceiling (GRM-04's detectors, receptive licensing; reviews a2.2-u04 r2 F01 / r3 F01: the lx.fluss card
// „Der Weg geht immer am Fluss entlang." taught entlang at a2.2-u04, licensed from b1.2-u09). Exact
// detectors block (heuristic ones are left to GRM-04's review of the units); the finding names the
// lexicon file, whose owner acts.
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c), all ADVISORY and owned by the
// lexicon file:
//   - an example is read at its entry's unit: at the A levels a word not known there (LEX-01's known set + the
//     unit's licensed forms) needs the example's English twin `exampleEn` (a1.1-u01 r3 F05b, u02 r3 F06:
//     lx.kellner „Bruder", lx.anmeldung „Büro"); from B1 on an example is read like the extensive strand;
//   - an example that names a cast member agrees with the cast bible (their `from` and `languages`) and does
//     not name them before their first unit (spec.cast / story.castIn) (a1.1-u03 r1 F05 / r2 F02 / r3 F02:
//     lx.partner, lx.tuerkisch);
//   - the heuristic detectors read the examples too (the exact ones block, above) (a1.1-u05 r1 F04 / F11).

import { walkTexts } from '../lib-validate/walk.mjs';
import { LEVELS, parseUnitId, positionOf, describePosition } from '../lib-validate/ids.mjs';
import { ceilingChecker } from '../lib-validate/ceiling.mjs';
import { entryForms, knownForms, licensedForms, readTokens, isKnown } from '../lib-validate/lexicon.mjs';
import { knownCompound } from '../lib-validate/compounds.mjs';
import { arr, isObj, blocker, finding, list } from '../lib-validate/helpers.mjs';

export const id = 'LEX-07';
export const title = 'Lexicon hygiene: one gloss per lemma, feminine pairs, plural_kind, wordId null';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const HOMOGRAPH_RE = /-\d+$/;
const normGloss = (g) => String(g ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
const bare = (s) => String(s ?? '').toLowerCase().replace(/^(der|die|das)\s+/, '').trim();

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  const slots = mode === 'file'
    ? [...new Set(docs.map((d) => d.level))].map((l) => ctx.levels.get(l)).filter(Boolean)
    : levels;
  const withLex = slots.filter((s) => s.lexicon);
  if (!withLex.length) return { findings, skipped: 'no lexicon.json for the target level yet' };
  // every lexicon up to the target levels, for cross-level duplicates
  const all = [];
  for (const l of LEVELS) arr(ctx.levels.get(l)?.lexicon?.entries).forEach((e, i) => all.push({ e, i, level: l, file: ctx.levels.get(l).lexicon.file }));
  const byLemma = new Map();
  for (const x of all) {
    if (!isObj(x.e)) continue;
    const k = `${bare(x.e.lemma)}|${x.e.pos}`;
    if (!byLemma.has(k)) byLemma.set(k, []);
    byLemma.get(k).push(x);
  }
  const femininesOf = new Map(); // feminine form → masculine entry id
  for (const x of all) if (isObj(x.e) && x.e.feminine) femininesOf.set(bare(x.e.feminine), x.e.id);
  for (const slot of withLex) {
    const lx = slot.lexicon;
    const doc = { file: lx.file };
    const ids = new Set();
    lx.entries.forEach((e, i) => {
      if (!isObj(e)) return;
      const p = `entries[${i}]`;
      if (ids.has(e.id)) findings.push(blocker(doc, `${p}.id`, `duplicate lexicon id ${e.id}`, e.id));
      ids.add(e.id);
      if (e.wordId !== null && e.wordId !== undefined) findings.push(blocker(doc, `${p}.wordId`, 'wordId is generated at integration; authored entries carry null', e.id));
      if (e.pos === 'NOUN' && !e.plural_kind) findings.push(blocker(doc, `${p}.plural_kind`, 'noun without plural_kind', e.id));
      if (e.pos === 'NOUN' && !e.article && e.plural_kind !== 'plural-only') findings.push(blocker(doc, `${p}.article`, 'noun without article', e.id));
      const fem = femininesOf.get(bare(e.lemma));
      if (fem && fem !== e.id) findings.push(blocker(doc, `${p}.lemma`, `„${e.lemma}" is the feminine of ${fem}: one entry for the pair`, e.id));
      const same = byLemma.get(`${bare(e.lemma)}|${e.pos}`) || [];
      const rank = LEVELS.indexOf(slot.level);
      const others = same.filter((x) => x.e !== e);
      // (1) the same global id allocated again above its first level (SCHEMA §6: only a promotion may re-use it)
      const lower = others.filter((x) => x.e.id === e.id && LEVELS.indexOf(x.level) < rank);
      if (lower.length) {
        const first = lower[0];
        const promo = first.e.role === 'receptive' && e.role === 'productive';
        const gl = String(first.e.gloss?.en || '') !== String(e.gloss?.en || '') ? ` (glosses differ: ${first.e.gloss?.en} | ${e.gloss?.en})` : '';
        findings.push(blocker(doc, `${p}.id`, `${e.id} „${e.lemma}" is already allocated at ${first.level} (${first.e.role}, ${first.e.unit}); an entry may allocate only a lemma no lower level has${gl} — remove this entry${promo ? ` and add promotions: [{ lemma: "${e.id}", from: "receptive", to: "productive", unit: "${e.unit}" }]` : ''}`, e.id));
      }
      // (2) the same lemma under a different id: two plain ids are one lemma entered twice (reported on
      // the later entry); a homograph carries -N and a meaning of its own
      const earlier = (x) => LEVELS.indexOf(x.level) < rank || (x.level === slot.level && x.i < i);
      const homograph = HOMOGRAPH_RE.test(e.id);
      for (const x of others.filter((o) => o.e.id !== e.id)) {
        if (!homograph && !HOMOGRAPH_RE.test(x.e.id) && earlier(x)) {
          findings.push(blocker(doc, `${p}.lemma`, `„${e.lemma}" (${e.pos}) is entered twice (${x.level}:${x.e.id} and ${e.id}); one lemma, one id — a homograph takes -2 and its own gloss`, e.id));
        } else if (homograph && normGloss(x.e.gloss?.en) === normGloss(e.gloss?.en)) {
          findings.push(blocker(doc, `${p}.gloss`, `homograph ${e.id} has the same gloss as ${x.level}:${x.e.id} („${e.gloss?.en}"): a -N id is for a different meaning; otherwise it is one lemma`, e.id));
        }
      }
    });
  }
  // examples under the grammar ceiling of the entry's unit
  const ceiling = ceilingChecker(ctx);
  if (ceiling) {
    for (const slot of withLex) {
      slot.lexicon.entries.forEach((e, i) => {
        if (!isObj(e) || typeof e.example !== 'string' || !e.example.trim()) return;
        const u = parseUnitId(e.unit);
        if (!u) return;
        const g = ctx.levels.get(u.level)?.units.get(u.nr)?.data?.spec?.grammar || {};
        const declared = new Set([...arr(g.new), ...arr(g.chunk), ...arr(g.review)]);
        for (const h of ceiling(e.example, positionOf(u.level, u.nr), 'input', declared)) {
          // exact detectors only: the heuristic ones (articles, word shapes) are GRM-04's review noise
          if (h.precision !== 'exact') {
            findings.push(finding('advisory', { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}" uses „${h.match}" (${h.construction}) — licensed from ${describePosition(h.licensedAt)}, the entry's unit is ${e.unit} [${h.precision}]`, e.id));
            continue;
          }
          const sev = 'blocker';
          findings.push(finding(sev, { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}" uses „${h.match}" (${h.construction}) — licensed from ${describePosition(h.licensedAt)} (${list(h.points, 3)}), the entry's unit is ${e.unit} — owner: the lexicon owner (${slot.lexicon.file})${sev === 'blocker' ? '' : ` [${h.precision}]`}`, e.id));
        }
      });
    }
  }
  // examples: known words (else an English twin), and the cast bible
  const members = ctx.registries.casts?.members || new Map();
  const firstUnit = new Map(); // cast id → earliest position a unit lists it (spec.cast, story.castIn)
  for (const slot of ctx.levels.values()) {
    for (const u of slot.units.values()) {
      const p = positionOf(slot.level, u.nr);
      for (const c of [...arr(u.data?.spec?.cast), ...arr(u.data?.story?.castIn)]) if (p !== null && (!firstUnit.has(c) || firstUnit.get(c) > p)) firstUnit.set(c, p);
    }
  }
  const knownAt = new Map();
  for (const slot of withLex) {
    slot.lexicon.entries.forEach((e, i) => {
      if (!isObj(e) || typeof e.example !== 'string' || !e.example.trim()) return;
      const u = parseUnitId(e.unit);
      if (!u) return;
      const key = `${u.level}|${u.nr}`;
      if (!knownAt.has(key)) {
        const k = knownForms(ctx, u.level, u.nr);
        const unitData = ctx.levels.get(u.level)?.units.get(u.nr)?.data;
        if (unitData) for (const f of licensedForms(ctx, unitData).forms) k.add(f);
        knownAt.set(key, k);
      }
      const known = knownAt.get(key);
      const unknown = [...new Set(readTokens(e.example).map((t) => t.lower).filter((w) => !isKnown(w, known) && !knownCompound(w, (x) => isKnown(x, known))))];
      // A levels only: from B1 on an example is read like the extensive strand, which tolerates unknown words
      if (unknown.length && /^a/.test(u.level) && !String(e.exampleEn || '').trim()) findings.push(finding('advisory', { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}" uses ${unknown.slice(0, 4).map((w) => `„${w}"`).join(', ')}, not known at ${e.unit} — reword with known words or add exampleEn`, e.id));
      // the cast bible
      const pos = positionOf(u.level, u.nr);
      for (const [cid, { member }] of members) {
        const first = String(member?.name || '').split(/\s+/)[0];
        if (!first || first.length < 3 || !new RegExp(`(?<![\\p{L}])${first}(?![\\p{L}])`, 'u').test(e.example)) continue;
        const at = firstUnit.get(cid);
        if (at !== undefined && pos !== null && pos < at) findings.push(finding('advisory', { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}" names ${first} (${cid}) at ${e.unit}, before ${first}'s first unit (${describePosition(at)})`, e.id));
        const langs = arr(member?.languages).map((x) => String(x).toLowerCase());
        const spoken = e.example.match(new RegExp(`${first}\\s+spricht\\s+(?:[^.!?]*?\\s)?(\\p{Lu}\\p{Ll}+isch|Deutsch|Englisch|Malayalam|Urdu|Hindi)`, 'u'));
        if (spoken && langs.length && !langs.includes(spoken[1].toLowerCase())) findings.push(finding('advisory', { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}": ${first} speaks ${spoken[1]}, the cast bible (${cid}) has ${member.languages.join(', ')}`, e.id));
        const from = e.example.match(new RegExp(`${first}\\s+kommt\\s+aus\\s+(?:der\\s+|dem\\s+)?(\\p{Lu}[\\p{L}-]+)`, 'u'));
        if (from && member?.from && !String(member.from).includes(from[1])) findings.push(finding('advisory', { file: slot.lexicon.file }, `entries[${i}].example`, `example „${e.example}": ${first} comes from ${from[1]}, the cast bible (${cid}) says ${member.from}`, e.id));
      }
    });
  }
  // glosses on surfaces must repeat the lexicon gloss
  // glosses on surfaces must repeat the lexicon gloss. Candidates: the entries whose lemma IS the token
  // (every homograph of it); only when there is none, the entries one of whose forms it is.
  const exact = new Map();
  const byForm = new Map();
  const push = (m, k, x) => { if (!m.has(k)) m.set(k, []); m.get(k).push(x); };
  for (const x of all) {
    if (!isObj(x.e) || !x.e.gloss?.en) continue;
    push(exact, bare(x.e.lemma), x);
    for (const f of entryForms(x.e).forms) push(byForm, f, x);
  }
  for (const d of docs) {
    for (const t of walkTexts(d)) {
      const src = t.kind === 'exam' ? t.block?.texts?.find((x) => x?.id === t.textId)?.glosses : t.step?.input?.glosses;
      arr(src).forEach((g, gi) => {
        const tok = String(g?.token || '').toLowerCase();
        const cands = exact.get(tok) || byForm.get(tok) || [];
        const said = String(g?.gloss?.en || '').trim();
        // a plural token glossed in the singular misleads (review a1.1-u04 r1 F21): „Kunden" → „customer"
        const plural = cands.find((x) => x.e.pos === 'NOUN' && typeof x.e.plural === 'string' && [x.e.plural.toLowerCase(), `${x.e.plural.toLowerCase()}n`].includes(tok) && tok !== bare(x.e.lemma));
        if (plural && said && !/s\b|\(pl|plural|people|children|men|women/i.test(said)) findings.push(finding('advisory', d, `${t.path}.glosses[${gi}]`, `„${g.token}" is the plural of ${plural.e.lemma}; its gloss „${said}" reads as a singular — gloss the plural or name the singular`, plural.e.id));
        if (!cands.length || !said || cands.some((x) => String(x.e.gloss.en).trim() === said)) return;
        const hit = cands[0].e;
        findings.push(blocker(d, `${t.path}.glosses[${gi}]`, `gloss „${g.gloss.en}" for „${g.token}" differs from the lexicon gloss „${hit.gloss.en}" (${hit.id})`, hit.id));
      });
    }
  }
  return { findings };
}
