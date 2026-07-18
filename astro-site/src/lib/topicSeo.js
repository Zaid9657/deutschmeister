// Per-topic SEO enrichment rendered by src/pages/grammar/[level]/[slug].astro.
// Keyed by `${level}/${slug}`. Content lives in code (not the Supabase grammar
// tables) so it can target search queries without touching lesson data.
//
// - snippetIntro: featured-snippet-style lead rendered as the first paragraph
//   of the page, above the topic's own description. Keep it to ~2 sentences
//   that directly answer the main question of the cluster.
// - faqHeading + faqs: rendered as an FAQ section near the end of the page and
//   emitted as FAQPage JSON-LD alongside the existing schemas.
export const TOPIC_SEO = {
  'a1.1/nouns-gender': {
    snippetIntro:
      'German has three grammatical genders: masculine (der), feminine (die), and neuter (das). ' +
      'Every noun in the German language has one of these genders — not just people, but also objects and ideas — and it decides which article and endings you use.',
    faqHeading: 'Common questions about German genders',
    faqs: [
      {
        q: 'Does German have gendered nouns?',
        a: 'Yes. Every German noun has one of three grammatical genders: masculine, feminine, or neuter. You see the gender in the article that comes before the noun — der Mann (masculine), die Frau (feminine), das Kind (neuter). Unlike English, this applies to objects and ideas too, not just people.',
      },
      {
        q: 'How many genders does German have?',
        a: 'German has three genders: masculine (der), feminine (die), and neuter (das). English only marks natural gender on pronouns like he, she, and it, but German assigns a grammatical gender to every single noun — including things like tables, lamps, and windows.',
      },
      {
        q: 'Is German a gendered language?',
        a: 'Yes — German is a gendered language. The gender of a noun affects the article (der, die, das), the endings of adjectives that describe it, and the pronoun that replaces it. That is why learning the gender together with each new word is one of the most useful habits for German learners.',
      },
      {
        q: 'How do I know the gender of a German word?',
        a: 'Sometimes the ending tells you: nouns ending in -ung, -heit, or -keit are feminine, and nouns ending in -chen or -lein are neuter, for example. Many genders simply have to be memorized, though — so always learn a noun together with its article: der Tisch, not just Tisch.',
      },
      {
        q: 'Are the genders of German nouns logical?',
        a: 'Mostly not — grammatical gender is not the same as biological gender. Das Mädchen (the girl) is neuter, and der Löffel (the spoon) is masculine. Word endings and word groups give useful patterns, but for many nouns the gender is a convention you learn with the word itself.',
      },
      {
        q: 'Does the gender of words in German change the rest of the sentence?',
        a: 'Yes. The gender decides which article you use (der, die, das), which endings adjectives take (ein kleiner Tisch vs. eine kleine Lampe), and which pronoun stands in for the noun (er, sie, es). It also feeds into the case system once you meet the accusative and dative.',
      },
    ],
  },
};
