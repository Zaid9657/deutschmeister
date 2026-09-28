// Compounds of known parts (rule-smith 2026-09-27; reviews b1.2-u04 r1 F01 „Radtour", b2.2-u04 r1 F05
// „Möbelstücke" — both blocked production as unknown although both parts were taught).
//
// SCHEMA §6 keeps compounds as lexicon entries of their own (`list_ref: compound:a+b`), and RAILS §3.1a
// does not decompose them: the allocation stays the source of what a unit teaches. What changes is the
// SEVERITY: a token that is two known forms joined directly or by a linking element (s, es, n, en, e)
// is readable and writable by a learner who knows both parts, so LEX-01 counts it as known and LEX-03
// reports it as an advisory („allocate compound:a+b") instead of a blocker.

const LINKS = ['', 's', 'es', 'n', 'en', 'e'];

/**
 * A first part that is a finite verb form is no compound part (review a1.1-u05 r2 F08 / r3 F06(b):
 * „willkommen" was known as will + kommen). German compounds do not start with a finite modal or
 * auxiliary; the closed list below is every present and past form of sein, haben, werden and the modals
 * that a split could produce.
 */
export const FINITE_FIRST_PARTS = Object.freeze(new Set(`bin bist ist sind seid war warst waren wart
hab habe hast hat habt hatte hattest hatten hattet werd werde wirst wird werdet wurde wurdest wurden
kann kannst können könnt konnte konnten muss musst müssen müsst musste mussten will willst wollen wollt wollte wollten
soll sollst sollen sollt sollte sollten darf darfst dürfen dürft durfte durften mag magst mögen mögt mochte möchte`.split(/\s+/)));

/** The two known parts of `lower` („möbelstücke" → ['möbel', 'stücke']), or null. */
export function knownCompound(lower, isKnownForm) {
  const w = String(lower || '');
  if (w.length < 6 || w.includes('-')) return null;
  for (let i = 3; i <= w.length - 3; i += 1) {
    const right = w.slice(i);
    if (!isKnownForm(right)) continue;
    const left = w.slice(0, i);
    for (const l of LINKS) {
      if (l && !left.endsWith(l)) continue;
      const stem = l ? left.slice(0, -l.length) : left;
      if (stem.length >= 3 && isKnownForm(stem) && !FINITE_FIRST_PARTS.has(stem) && !FINITE_FIRST_PARTS.has(left)) return [stem, right];
    }
  }
  return null;
}
