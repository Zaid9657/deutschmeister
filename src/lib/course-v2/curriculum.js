// Course v2 — the Lehrwerk view of a unit (owner decision 2026-09-29: "make it a curriculum like
// Menschen, Netzwerk or Schritte: chapters, and in every chapter grammar, listening, reading,
// vocabulary, speaking, writing and questions"). Pure: the compiled manifest row's `outline`
// (scripts/course-v2/lib/compiler.mjs outlineOf) in, the chapter's sections out.
//
// Naming, as the Lehrwerke do it (docs/course-v2/research/14-lehrwerke-curricula.md §D):
//   Kapitel  = a unit; Modul = an Etappe (3 Kapitel); Plateau = the review after a Modul
//   (Netzwerk neu's word for it);
//   A, B, C  = the situation steps (Schritte/Menschen: "one structure per step");
//   then Prüfungstraining, Sprechen, Schreiben (Überarbeiten at B), Kapiteltest.

/** The skills a step can train, in the order a Lehrwerk page shows them. */
export const SKILL_ORDER = Object.freeze(['wortschatz', 'hoeren', 'lesen', 'grammatik', 'ueben', 'sprechen', 'schreiben', 'aussprache', 'pruefung', 'test']);

export const SKILL_LABEL = Object.freeze({
  wortschatz: { de: 'Wortschatz', en: 'Vocabulary' },
  hoeren: { de: 'Hören', en: 'Listening' },
  lesen: { de: 'Lesen', en: 'Reading' },
  grammatik: { de: 'Grammatik', en: 'Grammar' },
  ueben: { de: 'Übungen', en: 'Exercises' },
  sprechen: { de: 'Sprechen', en: 'Speaking' },
  schreiben: { de: 'Schreiben', en: 'Writing' },
  aussprache: { de: 'Aussprache', en: 'Pronunciation' },
  pruefung: { de: 'Prüfungstraining', en: 'Exam practice' },
  test: { de: 'Kapiteltest', en: 'Chapter test' },
});

const KIND_NAME = {
  pruefung: { de: 'Prüfungstraining', en: 'Exam practice' },
  sprechen: { de: 'Sprechen', en: 'Speaking' },
  schreiben: { de: 'Schreiben', en: 'Writing' },
  ueberarbeiten: { de: 'Überarbeiten', en: 'Revising' },
  check: { de: 'Kapiteltest', en: 'Chapter test' },
};

const LETTERS = 'ABCDEFGH';
const SITUATION_KINDS = new Set(['situation', 'text', 'sprache']);

/**
 * sectionsOf(outline) → one section per step:
 *   { nr, id, kind, letter ('A'… for the situation steps, else null), title, name: {de,en}
 *     (the section's name as a Lehrwerk heads it), skills (SKILL_ORDER order), grammar
 *     ({id, short, label} | null), input ({kind, title} | null), teile, items }
 */
export function sectionsOf(outline) {
  let n = 0;
  return (Array.isArray(outline) ? outline : []).map((s) => {
    const situation = SITUATION_KINDS.has(s.kind);
    const letter = situation ? LETTERS[n++] || null : null;
    const skills = SKILL_ORDER.filter((k) => (s.skills || []).includes(k));
    const name = situation ? { de: s.title || `Teil ${letter}`, en: s.title || `Part ${letter}` } : KIND_NAME[s.kind] || { de: s.title || '', en: s.title || '' };
    return {
      nr: s.nr,
      id: s.id,
      kind: s.kind,
      letter,
      title: s.title || null,
      name,
      skills,
      grammar: s.grammar || null,
      input: s.input || null,
      teile: s.teile || [],
      items: s.items || 0,
    };
  });
}

/** Everything a Kapitel teaches, for a table-of-contents row: grammar names, text titles, skills. */
export function chapterSummary(outline) {
  const sections = sectionsOf(outline);
  const grammar = [];
  for (const s of sections) if (s.grammar && !grammar.some((g) => g.id === s.grammar.id)) grammar.push(s.grammar);
  const skills = SKILL_ORDER.filter((k) => sections.some((s) => s.skills.includes(k)));
  const texts = sections.filter((s) => s.input && s.input.title).map((s) => ({ kind: s.input.kind, title: s.input.title }));
  const teile = [...new Set(sections.flatMap((s) => s.teile))];
  return { sections, grammar, skills, texts, teile };
}
