// What each sub-level course CONTAINS — the non-grammar half of the course pages
// (/courses/ and /courses/<level>/). Grammar topics come from the content cache
// at build time (lib/grammar.js getTopicsForLevel); reading, listening, vocabulary
// and speaking are snapshotted here because the Astro build must work offline in
// CI (see CLAUDE.md). Counted against the live tables on the date below — refresh
// by re-running the SQL in the header of docs/course-factory-tracker.md's
// "Measured baseline" section, and bump countedOn. A course page never claims a
// number that is not in this file or in the cache.
export const COURSE_CONTENTS_COUNTED_ON = '2026-09-08';

export const COURSE_CONTENTS = {
  'a1.1': {
    reading: ['I am Anna', 'My Family', 'My Day', 'At the Supermarket', 'The Weather Today', 'My Town', 'Colors and Clothes', 'Breakfast', 'Reading small ads (exam-style, part 2)', 'Signs and notices (exam-style, part 3)'],
    listening: ['Im Supermarkt', 'Im Restaurant und Café', 'Am Bahnhof', 'Beim Arzt', 'Am Telefon', 'Im Hotel'],
    listeningQuestions: 138, dictation: 18, words: 339, wordCategories: 15, missions: 8,
    finalTest: { slug: 'abschlusstest-a1-1', format: 'Start Deutsch 1' }, plan: '/a1-1-phase',
  },
  'a1.2': {
    reading: ['My Hobbies', 'Food and Drink', 'Shopping in Germany', 'My Apartment', 'An Email to a Friend', 'On the Weekend', 'Through Germany by Train', 'At the Bakery', 'Two short emails (exam-style, part 1)', 'Ads about housing and work (exam-style, part 2)'],
    listening: ['Beim Einkaufen', 'Wegbeschreibungen', 'Im Büro', 'Freizeitaktivitäten', 'Wohnung und Haus', 'Wetter und Jahreszeiten'],
    listeningQuestions: 138, dictation: 18, words: 413, wordCategories: 18, missions: 12,
    finalTest: { slug: 'abschlusstest-a1-2', format: 'Start Deutsch 1' }, plan: '/a1-2-phase',
  },
  'a2.1': {
    reading: ['My Trip to Vienna', 'At the Doctor', 'My Job as a Software Developer', 'Getting Around in the City', 'An Evening at the Restaurant', 'A Move to Hamburg', 'The Sports Club', 'A Visit to the Weekly Market', 'Reading Part 1: A newspaper text (exam-style)', 'Reading Part 3: An email (exam-style)'],
    listening: ['Beim Arzt (erweitert)', 'Im Restaurant bestellen', 'Reisen und Verkehrsmittel', 'Termine und Verabredungen', 'Einkaufen im Alltag', 'Nachrichten und Durchsagen'],
    listeningQuestions: 138, dictation: 18, words: 423, wordCategories: 18, missions: 8,
    finalTest: { slug: 'abschlusstest-a2-1', format: 'Goethe-Zertifikat A2' }, plan: '/a2-1-phase',
  },
  'a2.2': {
    reading: ['An Unforgettable Experience', 'My Plans for the Future', 'True Friendship', 'Apartment Hunting in Germany', 'Media and News', 'German Culture and Traditions', 'Festivals and Holidays in Germany', 'Living Healthily', 'Reading Part 2: An information board (exam-style)', 'Reading Part 4: Matching ads (exam-style)'],
    listening: ['Arbeit und Beruf', 'Gesundheit und Fitness', 'Kultur und Veranstaltungen', 'Bank und Finanzen', 'Behörden und Ämter', 'Umwelt und Nachhaltigkeit'],
    listeningQuestions: 138, dictation: 18, words: 373, wordCategories: 17, missions: 8,
    finalTest: { slug: 'abschlusstest-a2-2', format: 'Goethe-Zertifikat A2' }, plan: '/a2-2-phase',
  },
  'b1.1': {
    reading: ['The Art of Discussion', 'Environment and Sustainability', 'Work-Life-Balance: A Balancing Act', 'Lifelong Learning', 'Living Together in a Diverse Society', 'Technology in Everyday Life: Curse or Blessing?', 'Understanding Germany: History and Identity', 'Volunteering: Why Germans Work for Free'],
    listening: ['Arbeitswelt und Karriere', 'Wohnungssuche und Umzug', 'Gesundheitssystem', 'Bildung und Weiterbildung', 'Reiseplanung', 'Nachrichten und Medien'],
    listeningQuestions: 60, dictation: 0, words: 262, wordCategories: 12, missions: 8,
    finalTest: null, plan: null,
  },
  'b1.2': {
    reading: ['Travel Stories: Adventure in South America', 'Health and Well-being in Modern Life', 'Career: Finding the Right Path', 'Money and Finance: Handling Money Wisely', 'Modern Relationships: Love in the 21st Century', 'German Cuisine: More Than Sausage and Sauerkraut', 'Sports in Germany: More Than Just Football', 'Art and Culture in Germany'],
    listening: ['Gesellschaft und Zusammenleben', 'Technologie im Alltag', 'Umwelt und Klimaschutz', 'Beziehungen und Konflikte', 'Recht und Gesetz', 'Zukunftspläne und Träume'],
    listeningQuestions: 60, dictation: 0, words: 261, wordCategories: 12, missions: 8,
    finalTest: null, plan: null,
  },
  'b2.1': {
    reading: ['Artificial Intelligence: Revolution or Risk?', "The Energiewende: Germany's Path to Climate Neutrality", 'Between Home Office and Workplace: The New World of Work', 'Why We Buy What We Buy: The Psychology of Consumption', 'Emigrate or Stay? Germans Abroad', 'Understanding the German Healthcare System', 'City of the Future: How We Will Live Tomorrow', 'Science in Everyday Life: How Studies Change Our Lives'],
    listening: ['Wissenschaft und Forschung', 'Wirtschaft und Globalisierung', 'Medien und Journalismus', 'Philosophie und Ethik', 'Geschichte und Politik', 'Kunst und Literatur'],
    listeningQuestions: 60, dictation: 0, words: 244, wordCategories: 11, missions: 8,
    finalTest: null, plan: null,
  },
  'b2.2': {
    reading: ['German Literature: From Goethe to the Present', 'Ethics in the 21st Century: Old Questions, New Challenges', 'Globalization: Interconnections and Disruptions', 'Philosophy of Mind: The Riddle of Consciousness', 'History and Memory: How We Understand the Past', 'Law and Justice: A Difficult Relationship', 'Sociology: Understanding Society', 'Art History: From the Middle Ages to Modernity', 'Language and Thought: Insights into Linguistics', 'The Future of Humanity: Between Hope and Risk'],
    listening: ['Psychologie und menschliches Verhalten', 'Wissenschaftsphilosophie', 'Globale Herausforderungen', 'Sprache und Kommunikation', 'Arbeitswelt der Zukunft', 'Identität und Selbstbild'],
    listeningQuestions: 60, dictation: 0, words: 246, wordCategories: 10, missions: 8,
    finalTest: null, plan: null,
  },
};

/** URL slug for a level: 'a2.1' → 'a2-1' (and back). */
export const levelToSlug = (level) => level.replace('.', '-');
export const slugToLevel = (slug) => slug.replace('-', '.');

/** One-line promise per band — what the learner can do at the end. No outcome guarantees. */
export const LEVEL_OUTCOME_EN = {
  'a1.1': 'Introduce yourself, ask simple questions, understand signs and short notices.',
  'a1.2': 'Talk about your day, your home and your plans; write a short email; the full Start Deutsch 1 range.',
  'a2.1': 'Handle appointments, shopping, directions and the doctor; adjective endings and the past tense start here.',
  'a2.2': 'Give reasons and opinions, make polite requests, follow news and notices; the full Goethe-Zertifikat A2 range.',
  'b1.1': 'Argue a point with weil, obwohl and deshalb; relative clauses, Konjunktiv II and the genitive.',
  'b1.2': 'Passive, reported speech and the narrative past; the full telc / Goethe B1 range.',
  'b2.1': 'Complex sentences, nominal style and precise connectors for work and study.',
  'b2.2': 'Academic and professional register; the full telc B2 range.',
};
