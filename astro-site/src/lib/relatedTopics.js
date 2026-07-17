/**
 * Static "related topics" map, keyed by topic slug.
 *
 * The DB has a `related_slugs` column but it is empty for every topic, so we
 * derive relationships here from obvious grammatical connections — cases ↔
 * prepositions ↔ articles, verb topics ↔ tenses, clauses ↔ conjunctions, and so
 * on. Each of the 64 topics lists 3–5 related slugs. Unknown slugs are ignored
 * at render time, so the lists are safe to hand-edit.
 *
 * If `related_slugs` is ever populated in the DB, the page prefers it over this
 * map (see [slug].astro).
 */
export const RELATED_TOPICS = {
  // ---- A1.1 ----
  'alphabet-pronunciation': ['nouns-gender', 'personal-pronouns', 'numbers-counting', 'present-tense-regular'],
  'nouns-gender': ['definite-articles', 'indefinite-articles', 'n-declension', 'nominative-case', 'personal-pronouns'],
  'definite-articles': ['nouns-gender', 'indefinite-articles', 'nominative-case', 'accusative-intro', 'dative-case'],
  'indefinite-articles': ['definite-articles', 'nouns-gender', 'nominative-case', 'negation', 'accusative-intro'],
  'personal-pronouns': ['possessive-pronouns', 'nominative-case', 'accusative-intro', 'verb-sein', 'reflexive-verbs'],
  'verb-sein': ['verb-haben', 'present-tense-regular', 'perfect-tense-sein', 'simple-past-sein-haben', 'personal-pronouns'],
  'verb-haben': ['verb-sein', 'present-tense-regular', 'perfect-tense-haben', 'simple-past-sein-haben', 'modal-verbs-intro'],
  'present-tense-regular': ['verb-sein', 'verb-haben', 'separable-verbs', 'modal-verbs-intro', 'perfect-tense-haben'],

  // ---- A1.2 ----
  'basic-sentence-structure': ['question-words', 'negation', 'subordinate-word-order', 'coordinating-conjunctions', 'nominative-case'],
  'nominative-case': ['accusative-intro', 'dative-case', 'genitive-case', 'definite-articles', 'personal-pronouns'],
  'accusative-intro': ['nominative-case', 'dative-case', 'prepositions-accusative', 'two-way-prepositions', 'definite-articles'],
  'numbers-counting': ['alphabet-pronunciation', 'comparative', 'question-words', 'superlative'],
  'question-words': ['basic-sentence-structure', 'negation', 'indirect-questions', 'subordinating-conjunctions'],
  'negation': ['basic-sentence-structure', 'question-words', 'indefinite-articles', 'modal-verbs-intro'],
  'modal-verbs-intro': ['present-tense-regular', 'separable-verbs', 'imperative-mood', 'double-infinitive', 'verb-haben'],
  'prepositions-accusative': ['accusative-intro', 'prepositions-dative', 'two-way-prepositions', 'dative-case'],

  // ---- A2.1 ----
  'dative-case': ['accusative-intro', 'nominative-case', 'genitive-case', 'prepositions-dative', 'two-way-prepositions'],
  'prepositions-dative': ['dative-case', 'prepositions-accusative', 'two-way-prepositions', 'genitive-prepositions'],
  'two-way-prepositions': ['prepositions-accusative', 'prepositions-dative', 'dative-case', 'accusative-intro', 'verbs-with-prepositions'],
  'possessive-pronouns': ['personal-pronouns', 'definite-articles', 'nominative-case', 'dative-case', 'reflexive-verbs'],
  'separable-verbs': ['present-tense-regular', 'modal-verbs-intro', 'perfect-tense-haben', 'imperative-mood', 'verbs-with-prepositions'],
  'perfect-tense-haben': ['perfect-tense-sein', 'verb-haben', 'simple-past-sein-haben', 'present-tense-regular', 'separable-verbs'],
  'perfect-tense-sein': ['perfect-tense-haben', 'verb-sein', 'simple-past-sein-haben', 'future-tense', 'present-tense-regular'],
  'imperative-mood': ['modal-verbs-intro', 'separable-verbs', 'personal-pronouns', 'present-tense-regular'],

  // ---- A2.2 ----
  'reflexive-verbs': ['personal-pronouns', 'possessive-pronouns', 'accusative-intro', 'dative-case', 'verbs-with-prepositions'],
  'simple-past-sein-haben': ['verb-sein', 'verb-haben', 'perfect-tense-haben', 'simple-past-narrative', 'future-tense'],
  'coordinating-conjunctions': ['subordinating-conjunctions', 'basic-sentence-structure', 'subordinate-word-order', 'advanced-conjunctions'],
  'subordinating-conjunctions': ['coordinating-conjunctions', 'subordinate-word-order', 'relative-clauses-nom-acc', 'advanced-conjunctions', 'indirect-questions'],
  'subordinate-word-order': ['subordinating-conjunctions', 'coordinating-conjunctions', 'basic-sentence-structure', 'relative-clauses-nom-acc'],
  'comparative': ['superlative', 'participial-adjectives', 'adjective-declension-strong', 'numbers-counting'],
  'superlative': ['comparative', 'adjective-declension-strong', 'participial-adjectives', 'adjective-declension-weak-mixed'],
  'future-tense': ['future-perfect', 'perfect-tense-haben', 'konjunktiv-ii-wurde', 'present-tense-regular'],

  // ---- B1.1 ----
  'genitive-case': ['dative-case', 'accusative-intro', 'nominative-case', 'genitive-prepositions', 'n-declension'],
  'genitive-prepositions': ['genitive-case', 'prepositions-dative', 'prepositions-accusative', 'two-way-prepositions'],
  'relative-clauses-nom-acc': ['relative-clauses-dat-gen', 'subordinating-conjunctions', 'subordinate-word-order', 'nominative-case', 'accusative-intro'],
  'relative-clauses-dat-gen': ['relative-clauses-nom-acc', 'dative-case', 'genitive-case', 'subordinating-conjunctions'],
  'konjunktiv-ii-wurde': ['konjunktiv-ii-ware-hatte', 'konjunktiv-ii-past', 'future-tense', 'passive-voice-present'],
  'konjunktiv-ii-ware-hatte': ['konjunktiv-ii-wurde', 'konjunktiv-ii-past', 'konjunktiv-i-reported-speech', 'simple-past-sein-haben'],
  'infinitive-with-zu': ['um-zu-ohne-zu', 'modal-verbs-intro', 'double-infinitive', 'verbs-with-prepositions'],
  'um-zu-ohne-zu': ['infinitive-with-zu', 'subordinating-conjunctions', 'modal-verbs-intro', 'double-infinitive'],

  // ---- B1.2 ----
  'passive-voice-present': ['passive-voice-past', 'passive-alternatives', 'konjunktiv-ii-wurde', 'verbs-with-prepositions'],
  'passive-voice-past': ['passive-voice-present', 'passive-alternatives', 'perfect-tense-haben', 'simple-past-narrative'],
  'verbs-with-prepositions': ['prepositions-accusative', 'prepositions-dative', 'two-way-prepositions', 'reflexive-verbs', 'functional-verb-structures'],
  'adjective-declension-strong': ['adjective-declension-weak-mixed', 'definite-articles', 'comparative', 'participial-adjectives', 'nominative-case'],
  'adjective-declension-weak-mixed': ['adjective-declension-strong', 'definite-articles', 'indefinite-articles', 'participial-adjectives', 'comparative'],
  'simple-past-narrative': ['simple-past-sein-haben', 'perfect-tense-haben', 'future-tense', 'passive-voice-past'],
  'indirect-questions': ['question-words', 'subordinating-conjunctions', 'konjunktiv-i-reported-speech', 'subordinate-word-order'],
  'n-declension': ['nouns-gender', 'genitive-case', 'dative-case', 'definite-articles'],

  // ---- B2.1 ----
  'konjunktiv-ii-past': ['konjunktiv-ii-ware-hatte', 'konjunktiv-ii-wurde', 'konjunktiv-i-reported-speech', 'subjunctive-fixed-expressions'],
  'konjunktiv-i-reported-speech': ['konjunktiv-ii-past', 'indirect-questions', 'konjunktiv-ii-ware-hatte', 'subjunctive-fixed-expressions'],
  'passive-alternatives': ['passive-voice-present', 'passive-voice-past', 'konjunktiv-ii-wurde', 'functional-verb-structures'],
  'participial-adjectives': ['adjective-declension-strong', 'adjective-declension-weak-mixed', 'extended-attributes', 'comparative', 'passive-voice-past'],
  'extended-attributes': ['participial-adjectives', 'adjective-declension-strong', 'relative-clauses-nom-acc', 'nominalization'],
  'double-infinitive': ['infinitive-with-zu', 'um-zu-ohne-zu', 'modal-verbs-intro', 'causative-constructions'],
  'causative-constructions': ['double-infinitive', 'infinitive-with-zu', 'modal-verbs-intro', 'passive-alternatives'],
  'nominalization': ['adjective-declension-weak-mixed', 'participial-adjectives', 'extended-attributes', 'register-style', 'nouns-gender'],

  // ---- B2.2 ----
  'advanced-conjunctions': ['subordinating-conjunctions', 'coordinating-conjunctions', 'complex-sentence-building', 'subordinate-word-order'],
  'modal-particles': ['advanced-conjunctions', 'register-style', 'functional-verb-structures', 'subjunctive-fixed-expressions'],
  'functional-verb-structures': ['verbs-with-prepositions', 'passive-alternatives', 'nominalization', 'register-style'],
  'subjunctive-fixed-expressions': ['konjunktiv-ii-past', 'konjunktiv-i-reported-speech', 'konjunktiv-ii-ware-hatte', 'modal-particles'],
  'complex-sentence-building': ['advanced-conjunctions', 'subordinating-conjunctions', 'relative-clauses-dat-gen', 'extended-attributes', 'register-style'],
  'register-style': ['modal-particles', 'nominalization', 'complex-sentence-building', 'functional-verb-structures'],
  'future-perfect': ['future-tense', 'perfect-tense-haben', 'konjunktiv-ii-past', 'simple-past-narrative'],
  'review-integration': ['complex-sentence-building', 'register-style', 'advanced-conjunctions', 'konjunktiv-ii-past', 'passive-alternatives'],
};
