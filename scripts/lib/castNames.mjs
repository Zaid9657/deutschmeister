// The names of the cast of both courses: what their dialogues call them, and the surnames the courses give them anywhere
// („Lena Brandt“ in the writing tasks of A1.1; Claude score of fd8f8dba, 2026-11-25: the checkpoint banks used „Frau Brandt“ and
// „Herr Brandt“ for strangers). The checkpoint banks' own people are others (scripts/a11-hoeren-check.mjs, a11-lesen-check.mjs).
import { levelSpec } from '../validate-curriculum.mjs';

export function castNames(levels = ['a1.1', 'a1.2']) {
  const lektionen = levels.flatMap((lv) => levelSpec(lv)?.curriculum?.lektionen || []);
  const first = new Set(lektionen.flatMap((l) => (l.dialog?.lines || []).flatMap((x) => String(x.speaker).split(/\s+/))).filter((t) => t && !['Herr', 'Frau'].includes(t)));
  const text = JSON.stringify(lektionen);
  // A surname is no word the courses teach („Lena Fragen …“ is a sentence, not a name).
  const nouns = new Set(lektionen.flatMap((l) => (l.wortfeld || []).flatMap((w) => String(w.word || w.de).split(/\s+/))).map((w) => w.toLowerCase()));
  for (const w of ['studentin', 'student', 'fragen', 'zeit', 'musik', 'fußball', 'hobby', 'name']) nouns.add(w);
  const surnames = [...first].flatMap((name) => [...text.matchAll(new RegExp(`(?<![\\p{L}])${name}\\s+(\\p{Lu}\\p{Ll}+)(?![\\p{L}])`, 'gu'))].map((m) => m[1]))
    .filter((s) => !first.has(s) && !nouns.has(s.toLowerCase()));
  return new Set([...first, ...surnames]);
}
