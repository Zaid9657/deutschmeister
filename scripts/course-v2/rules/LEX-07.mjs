// LEX-07 — one gloss per lemma across surfaces; feminine pairs one entry; plural_kind set on
// nouns; wordId null in authoring (BLUEPRINT §9.1, SCHEMA §6).

import { walkTexts } from '../lib-validate/walk.mjs';
import { LEVELS } from '../lib-validate/ids.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

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
  // glosses on surfaces must repeat the lexicon gloss
  const lexIndex = new Map(); // surface form → { gloss, id }: the entry whose lemma IS the token wins over one it inflects
  for (const x of all) {
    if (!isObj(x.e) || !x.e.gloss?.en) continue;
    const k = bare(x.e.lemma);
    if (!lexIndex.has(k) || !lexIndex.get(k).exact) lexIndex.set(k, { gloss: x.e.gloss.en, id: x.e.id, exact: true });
  }
  for (const x of all) {
    if (!isObj(x.e) || !x.e.gloss?.en) continue;
    for (const f of entryForms(x.e).forms) if (!lexIndex.has(f)) lexIndex.set(f, { gloss: x.e.gloss.en, id: x.e.id, exact: false });
  }
  for (const d of docs) {
    for (const t of walkTexts(d)) {
      const src = t.kind === 'exam' ? t.block?.texts?.find((x) => x?.id === t.textId)?.glosses : t.step?.input?.glosses;
      arr(src).forEach((g, gi) => {
        const hit = lexIndex.get(String(g?.token || '').toLowerCase());
        if (hit && String(g?.gloss?.en || '').trim() && String(g.gloss.en).trim() !== String(hit.gloss).trim()) {
          findings.push(blocker(d, `${t.path}.glosses[${gi}]`, `gloss „${g.gloss.en}" for „${g.token}" differs from the lexicon gloss „${hit.gloss}" (${hit.id})`, hit.id));
        }
      });
    }
  }
  return { findings };
}
