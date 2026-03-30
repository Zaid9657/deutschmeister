import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, ChevronRight, GraduationCap } from 'lucide-react';
import { grammarTopics } from '../data/grammarTopics';
import SEO from '../components/SEO';

const LEVEL_INFO = {
  'a1.1': { name: 'Complete Beginner', description: 'The absolute basics: alphabet, gender, articles, pronouns, and present tense.' },
  'a1.2': { name: 'Elementary', description: 'Basic sentence structure, cases, question words, negation, and modal verbs.' },
  'a2.1': { name: 'Pre-Intermediate', description: 'Dative case, prepositions, possessives, separable verbs, and perfect tense.' },
  'a2.2': { name: 'Intermediate Foundations', description: 'Reflexive verbs, conjunctions, subordinate clauses, comparatives, and future tense.' },
  'b1.1': { name: 'Lower Intermediate', description: 'Genitive case, relative clauses, subjunctive mood, and infinitive constructions.' },
  'b1.2': { name: 'Intermediate', description: 'Passive voice, adjective declension, verbs with prepositions, and narrative past.' },
  'b2.1': { name: 'Upper Intermediate', description: 'Advanced subjunctive, reported speech, participial adjectives, and nominalization.' },
  'b2.2': { name: 'Advanced Foundations', description: 'Modal particles, functional verbs, complex sentences, register, and stylistic mastery.' },
};

const LEVEL_ORDER = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

const CASE_TABLE = [
  { case: 'Nominative', function: 'Subject', example: 'Der Mann ist groß (The man is tall)', article: { m: 'der', f: 'die', n: 'das', pl: 'die' } },
  { case: 'Accusative', function: 'Direct object', example: 'Ich sehe den Mann (I see the man)', article: { m: 'den', f: 'die', n: 'das', pl: 'die' } },
  { case: 'Dative', function: 'Indirect object', example: 'Ich gebe dem Mann das Buch (I give the man the book)', article: { m: 'dem', f: 'der', n: 'dem', pl: 'den' } },
  { case: 'Genitive', function: 'Possession', example: 'Das Auto des Mannes (The man\'s car)', article: { m: 'des', f: 'der', n: 'des', pl: 'der' } },
];

const GrammarOverviewPage = () => {
  // Generate ItemList schema with all 64 topics
  const generateItemListSchema = () => {
    const items = [];
    let position = 1;

    LEVEL_ORDER.forEach(level => {
      const topics = grammarTopics[level] || [];
      topics.forEach(topic => {
        items.push({
          "@type": "ListItem",
          "position": position++,
          "name": topic.titleEn,
          "description": topic.descriptionEn,
          "url": `https://deutsch-meister.de/grammar/${level}/${topic.slug}`
        });
      });
    });

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Complete German Grammar Topics by CEFR Level",
      "description": "Comprehensive list of all 64 German grammar topics from A1.1 (complete beginner) to B2.2 (upper intermediate)",
      "numberOfItems": 64,
      "itemListElement": items
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16">
      <SEO
        title="Complete German Grammar Guide: 64 Topics A1-B2 | DeutschMeister"
        description="Master German grammar with our complete guide covering all 64 topics from A1 to B2. Organized by CEFR level with clear explanations and examples. The definitive German grammar reference."
        keywords="German grammar guide, German grammar topics, CEFR grammar, German cases, German verb conjugation, learn German grammar, complete German grammar"
        path="/grammar/overview"
        structuredData={[
          generateItemListSchema(),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
              {"@type": "ListItem", "position": 2, "name": "Grammar", "item": "https://deutsch-meister.de/grammar"},
              {"@type": "ListItem", "position": 3, "name": "Complete Guide", "item": "https://deutsch-meister.de/grammar/overview"}
            ]
          }
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
            <BookMarked className="w-4 h-4" />
            Complete Reference Guide
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
            Complete German Grammar Guide
          </h1>
          <p className="text-xl text-slate-600 mb-2">All 64 Topics by CEFR Level (A1-B2)</p>
          <p className="text-slate-500 max-w-2xl mx-auto">
            A comprehensive reference covering every grammar topic from complete beginner to upper intermediate. Organized by the Common European Framework of Reference (CEFR).
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How to Use This Guide</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-4">
              German grammar is systematic and learnable. This guide presents all 64 essential grammar topics organized by CEFR level, from A1.1 (complete beginner) to B2.2 (upper intermediate). Each level builds on the previous one, creating a clear learning path.
            </p>
            <p className="text-slate-600 mb-4">
              <strong>CEFR Levels Explained:</strong> The Common European Framework of Reference divides language learning into six main levels (A1, A2, B1, B2, C1, C2). We further divide each level into two sub-levels (e.g., A1.1 and A1.2) for more precise progression. This guide covers A1 through B2 — taking you from absolute beginner to upper intermediate proficiency.
            </p>
            <p className="text-slate-600">
              <strong>How to Learn:</strong> Start with your current level. Work through each topic in order, as later topics build on earlier ones. Each topic includes detailed explanations, examples with audio, and interactive exercises. Click any topic below to start learning.
            </p>
          </div>
        </motion.div>

        {/* Grammar Topics by Level */}
        <div className="space-y-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">Grammar Topics by Level</h2>
          {LEVEL_ORDER.map((level, levelIndex) => {
            const topics = grammarTopics[level] || [];
            const levelInfo = LEVEL_INFO[level];

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + levelIndex * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Level Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {level.toUpperCase()} - {levelInfo.name}
                      </h3>
                      <p className="text-white/90 text-sm">{levelInfo.description}</p>
                    </div>
                    <span className="text-white/70 text-sm font-medium">
                      {topics.length} topics
                    </span>
                  </div>
                </div>

                {/* Topics List */}
                <div className="p-6">
                  <ol className="space-y-3">
                    {topics.map((topic, index) => (
                      <li key={topic.id}>
                        <Link
                          to={`/grammar/${level}/${topic.slug}`}
                          className="group flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-1">
                              {topic.titleEn}
                            </h4>
                            <p className="text-sm text-slate-500">{topic.descriptionEn}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Reference Tables */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8 mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-800 text-center">Quick Reference Tables</h2>

          {/* German Cases */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">German Cases Overview</h3>
              <p className="text-white/90 text-sm mt-1">The four grammatical cases and their functions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Case</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Function</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Example</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Articles (m/f/n/pl)</th>
                  </tr>
                </thead>
                <tbody>
                  {CASE_TABLE.map((row, index) => (
                    <tr key={row.case} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.case}</td>
                      <td className="px-6 py-4 text-slate-600">{row.function}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">{row.example}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                        {row.article.m} / {row.article.f} / {row.article.n} / {row.article.pl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Verb Conjugations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
              <h3 className="text-2xl font-bold text-white">Essential Verb Conjugations</h3>
              <p className="text-white/90 text-sm mt-1">Present tense conjugations of sein and haben</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Pronoun</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">sein (to be)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">haben (to have)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pronoun: 'ich', sein: 'bin', haben: 'habe' },
                    { pronoun: 'du', sein: 'bist', haben: 'hast' },
                    { pronoun: 'er/sie/es', sein: 'ist', haben: 'hat' },
                    { pronoun: 'wir', sein: 'sind', haben: 'haben' },
                    { pronoun: 'ihr', sein: 'seid', haben: 'habt' },
                    { pronoun: 'sie/Sie', sein: 'sind', haben: 'haben' },
                  ].map((row, index) => (
                    <tr key={row.pronoun} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.pronoun}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{row.sein}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono">{row.haben}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-xl"
        >
          <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Master German Grammar?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Start with A1.1 and work your way through all 64 topics. Each lesson includes detailed explanations, audio examples, and interactive exercises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/grammar/a1.1"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Start at A1.1
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/level-test"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all"
            >
              Take Level Test
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GrammarOverviewPage;
