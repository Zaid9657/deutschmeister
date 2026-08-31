// ─────────────────────────────────────────────────────────────────────────────
// THE navigation registry — one source of truth for every nav and footer link
// on both front ends.
//
// Byte-identical twin: src/data/navigation.js ⟷ astro-site/src/data/navigation.js
// (drift-guarded by scripts/check-duplicates.mjs, like pricing.js/marketing.js).
// The SPA Navbar, the SPA Footer and astro-site's Layout.astro all render from
// this module; tests/navigation.test.mjs asserts every href resolves to a real
// route in the right serving class with the right trailing slash. Before this
// module the three navs disagreed (the Astro nav had no Listening/Reading/
// Speaking and no auth state; Vocabulary and the guides were reachable from
// nowhere inside the app).
//
// Field contract:
//   href  — canonical form INCLUDING the trailing-slash class from CLAUDE.md:
//           Astro pages and prerendered SPA routes end in '/', plain SPA
//           rewrites don't. Retype nowhere; link only via this module.
//   kind  — 'spa'    → client-side route; the SPA may <Link> to it.
//           'static' → served by the Astro build; ALWAYS a full page load
//                      (an in-app <Link> would render a dead or shadowed twin).
//   auth  — 'any' | 'authed' | 'anon' — who sees the link.
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_GROUPS = [
  {
    key: 'learn',
    labelEn: 'Learn',
    labelDe: 'Lernen',
    items: [
      { key: 'grammar', labelEn: 'Grammar', labelDe: 'Grammatik', href: '/grammar/', kind: 'static', auth: 'any' },
      { key: 'videos', labelEn: 'Videos', labelDe: 'Videos', href: '/video-library', kind: 'spa', auth: 'any' },
      { key: 'listening', labelEn: 'Listening', labelDe: 'Hören', href: '/listening/', kind: 'spa', auth: 'any' },
      { key: 'reading', labelEn: 'Reading', labelDe: 'Lesen', href: '/reading/', kind: 'spa', auth: 'any' },
      { key: 'vocabulary', labelEn: 'Vocabulary', labelDe: 'Wortschatz', href: '/vocabulary', kind: 'spa', auth: 'any' },
      { key: 'podcasts', labelEn: 'Podcasts', labelDe: 'Podcasts', href: '/podcasts/', kind: 'spa', auth: 'any' },
      { key: 'speaking', labelEn: 'Speaking', labelDe: 'Sprechen', href: '/speaking/', kind: 'spa', auth: 'authed' },
    ],
  },
  {
    key: 'tools',
    labelEn: 'Tools',
    labelDe: 'Werkzeuge',
    items: [
      { key: 'level-test', labelEn: 'Level Test', labelDe: 'Einstufungstest', href: '/level-test/', kind: 'spa', auth: 'any' },
      { key: 'xray', labelEn: 'X-Ray', labelDe: 'Satz-Analyse', href: '/analyze/', kind: 'spa', auth: 'any' },
      { key: 'pricing', labelEn: 'Pricing', labelDe: 'Preise', href: '/pricing/', kind: 'static', auth: 'anon' },
      { key: 'dashboard', labelEn: 'Dashboard', labelDe: 'Dashboard', href: '/dashboard', kind: 'spa', auth: 'authed' },
    ],
  },
];

export const FOOTER_GROUPS = [
  {
    key: 'grammar',
    titleEn: 'Grammar',
    titleDe: 'Grammatik',
    items: [
      { labelEn: 'A1.1 Grammar', labelDe: 'A1.1 Grammatik', href: '/grammar/a1.1/', kind: 'static' },
      { labelEn: 'A1.2 Grammar', labelDe: 'A1.2 Grammatik', href: '/grammar/a1.2/', kind: 'static' },
      { labelEn: 'A2.1 Grammar', labelDe: 'A2.1 Grammatik', href: '/grammar/a2.1/', kind: 'static' },
      { labelEn: 'B1.1 Grammar', labelDe: 'B1.1 Grammatik', href: '/grammar/b1.1/', kind: 'static' },
      { labelEn: 'All levels →', labelDe: 'Alle Niveaus →', href: '/grammar/', kind: 'static' },
    ],
  },
  {
    key: 'learn',
    titleEn: 'Learn',
    titleDe: 'Lernen',
    items: [
      { labelEn: 'AI Speaking Practice', labelDe: 'KI-Sprechtraining', href: '/speaking/', kind: 'spa' },
      { labelEn: 'Sentence X-Ray', labelDe: 'Satz-Analyse', href: '/analyze/', kind: 'spa' },
      { labelEn: 'Listening Practice', labelDe: 'Hörtraining', href: '/listening/', kind: 'spa' },
      { labelEn: 'Reading Lessons', labelDe: 'Leselektionen', href: '/reading/', kind: 'spa' },
      { labelEn: 'Vocabulary', labelDe: 'Wortschatz', href: '/vocabulary', kind: 'spa' },
      { labelEn: 'Podcasts', labelDe: 'Podcasts', href: '/podcasts/', kind: 'spa' },
      { labelEn: 'Level Test', labelDe: 'Einstufungstest', href: '/level-test/', kind: 'spa' },
      { labelEn: 'Pricing', labelDe: 'Preise', href: '/pricing/', kind: 'static' },
    ],
  },
  {
    key: 'guides',
    titleEn: 'Guides',
    titleDe: 'Leitfäden',
    items: [
      { labelEn: 'Alle Prüfungsleitfäden', labelDe: 'Alle Prüfungsleitfäden', href: '/leitfaden/', kind: 'static' },
      { labelEn: 'telc B1', labelDe: 'telc B1', href: '/leitfaden/telc-b1/', kind: 'static' },
      { labelEn: 'Goethe-Zertifikat B1', labelDe: 'Goethe-Zertifikat B1', href: '/leitfaden/goethe-b1/', kind: 'static' },
      { labelEn: 'telc B2', labelDe: 'telc B2', href: '/leitfaden/telc-b2/', kind: 'static' },
      { labelEn: 'DTZ', labelDe: 'DTZ', href: '/leitfaden/dtz/', kind: 'static' },
      { labelEn: 'Plattform-Vergleich', labelDe: 'Plattform-Vergleich', href: '/vergleich/', kind: 'static' },
      { labelEn: 'FAQ', labelDe: 'FAQ', href: '/faq/', kind: 'spa' },
      { labelEn: 'Über uns', labelDe: 'Über uns', href: '/ueber-uns/', kind: 'spa' },
    ],
  },
];

export const LEGAL_LINKS = [
  { labelEn: 'Privacy Policy', labelDe: 'Datenschutz', href: '/privacy/', kind: 'static' },
  { labelEn: 'Impressum', labelDe: 'Impressum', href: '/impressum/', kind: 'static' },
];

/** All nav+footer items flattened — what the consistency test iterates. */
export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...FOOTER_GROUPS.flatMap((g) => g.items),
  ...LEGAL_LINKS,
];
