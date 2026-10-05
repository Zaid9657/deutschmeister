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
//   labelAr — the Arabic label (2026-10-05, docs/arabic/README.md). Every link
//           whose destination is NOT Arabic says so, „· EN“ or „· DE“, the
//           same way labelEn marks German destinations — an Arabic visitor is
//           never sent to an English page without being told.
//   hrefAr — optional: the Arabic equivalent page, used when the interface
//           locale is Arabic (only /courses/ and /pricing/ have one).
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_GROUPS = [
  {
    key: 'exams',
    labelEn: 'Exams',
    labelDe: 'Prüfungen',
    labelAr: 'الامتحانات',
    items: [
      { key: 'pruefung', labelEn: 'Exam Prep · DE', labelDe: 'Prüfungen', labelAr: 'التحضير للامتحانات · DE', href: '/pruefung/', kind: 'static', auth: 'any' },
    ],
  },
  {
    key: 'learn',
    labelEn: 'Learn',
    labelDe: 'Lernen',
    labelAr: 'التعلّم',
    items: [
      { key: 'courses', labelEn: 'Courses', labelDe: 'Kurse', labelAr: 'الدورات', href: '/courses/', hrefAr: '/ar/courses/', kind: 'static', auth: 'any' },
      { key: 'grammar', labelEn: 'Grammar', labelDe: 'Grammatik', labelAr: 'القواعد · EN', href: '/grammar/', kind: 'static', auth: 'any' },
      { key: 'videos', labelEn: 'Videos', labelDe: 'Videos', labelAr: 'فيديوهات · EN', href: '/video-library', kind: 'spa', auth: 'any' },
      { key: 'listening', labelEn: 'Listening', labelDe: 'Hören', labelAr: 'الاستماع · EN', href: '/listening/', kind: 'spa', auth: 'any' },
      { key: 'reading', labelEn: 'Reading', labelDe: 'Lesen', labelAr: 'القراءة · EN', href: '/reading/', kind: 'spa', auth: 'any' },
      { key: 'vocabulary', labelEn: 'Vocabulary', labelDe: 'Wortschatz', labelAr: 'المفردات · EN', href: '/vocabulary', kind: 'spa', auth: 'any' },
      { key: 'podcasts', labelEn: 'Podcasts', labelDe: 'Podcasts', labelAr: 'بودكاست · EN', href: '/podcasts/', kind: 'spa', auth: 'any' },
      { key: 'speaking', labelEn: 'Speaking', labelDe: 'Sprechen', labelAr: 'التحدّث · EN', href: '/speaking/', kind: 'spa', auth: 'authed' },
    ],
  },
  {
    key: 'tools',
    labelEn: 'Tools',
    labelDe: 'Werkzeuge',
    labelAr: 'الأدوات',
    items: [
      { key: 'level-test', labelEn: 'Level Test', labelDe: 'Einstufungstest', labelAr: 'اختبار تحديد المستوى · EN', href: '/level-test/', kind: 'spa', auth: 'any' },
      { key: 'xray', labelEn: 'X-Ray', labelDe: 'Satz-Analyse', labelAr: 'تحليل الجملة · EN', href: '/analyze/', kind: 'spa', auth: 'any' },
      { key: 'pricing', labelEn: 'Pricing', labelDe: 'Preise', labelAr: 'الأسعار', href: '/pricing/', hrefAr: '/ar/pricing/', kind: 'static', auth: 'anon' },
      { key: 'dashboard', labelEn: 'Dashboard', labelDe: 'Dashboard', labelAr: 'لوحة التحكم · EN', href: '/dashboard', kind: 'spa', auth: 'authed' },
    ],
  },
];

export const FOOTER_GROUPS = [
  {
    key: 'grammar',
    titleEn: 'Grammar',
    titleDe: 'Grammatik',
    titleAr: 'القواعد · EN',
    items: [
      { labelEn: 'A1.1 Grammar', labelDe: 'A1.1 Grammatik', labelAr: 'قواعد A1.1 · EN', href: '/grammar/a1.1/', kind: 'static' },
      { labelEn: 'A1.2 Grammar', labelDe: 'A1.2 Grammatik', labelAr: 'قواعد A1.2 · EN', href: '/grammar/a1.2/', kind: 'static' },
      { labelEn: 'A2.1 Grammar', labelDe: 'A2.1 Grammatik', labelAr: 'قواعد A2.1 · EN', href: '/grammar/a2.1/', kind: 'static' },
      { labelEn: 'B1.1 Grammar', labelDe: 'B1.1 Grammatik', labelAr: 'قواعد B1.1 · EN', href: '/grammar/b1.1/', kind: 'static' },
      { labelEn: 'All levels →', labelDe: 'Alle Niveaus →', labelAr: 'كل المستويات · EN', href: '/grammar/', kind: 'static' },
    ],
  },
  {
    key: 'learn',
    titleEn: 'Learn',
    titleDe: 'Lernen',
    titleAr: 'التعلّم',
    items: [
      { labelEn: 'AI Speaking Practice', labelDe: 'KI-Sprechtraining', labelAr: 'تدريب التحدّث بالذكاء الاصطناعي · EN', href: '/speaking/', kind: 'spa' },
      { labelEn: 'Sentence X-Ray', labelDe: 'Satz-Analyse', labelAr: 'تحليل الجملة · EN', href: '/analyze/', kind: 'spa' },
      { labelEn: 'Listening Practice', labelDe: 'Hörtraining', labelAr: 'تدريب الاستماع · EN', href: '/listening/', kind: 'spa' },
      { labelEn: 'Reading Lessons', labelDe: 'Leselektionen', labelAr: 'دروس القراءة · EN', href: '/reading/', kind: 'spa' },
      { labelEn: 'Vocabulary', labelDe: 'Wortschatz', labelAr: 'المفردات · EN', href: '/vocabulary', kind: 'spa' },
      { labelEn: 'Podcasts', labelDe: 'Podcasts', labelAr: 'بودكاست · EN', href: '/podcasts/', kind: 'spa' },
      { labelEn: 'Level Test', labelDe: 'Einstufungstest', labelAr: 'اختبار تحديد المستوى · EN', href: '/level-test/', kind: 'spa' },
      { labelEn: 'Pricing', labelDe: 'Preise', labelAr: 'الأسعار', href: '/pricing/', hrefAr: '/ar/pricing/', kind: 'static' },
    ],
  },
  {
    key: 'guides',
    titleEn: 'German Exams & Guides',
    titleDe: 'Prüfungen & Leitfäden',
    titleAr: 'الامتحانات الألمانية والأدلة · DE',
    items: [
      { labelEn: 'Exam preparation · DE', labelDe: 'Prüfungsvorbereitung', labelAr: 'التحضير للامتحانات · DE', href: '/pruefung/', kind: 'static' },
      { labelEn: 'telc B1 preparation · DE', labelDe: 'telc B1 Vorbereitung', labelAr: 'التحضير لامتحان telc B1 · DE', href: '/pruefung/telc-b1/', kind: 'static' },
      { labelEn: 'All exam guides · DE', labelDe: 'Alle Prüfungsleitfäden', labelAr: 'كل أدلة الامتحانات · DE', href: '/leitfaden/', kind: 'static' },
      { labelEn: 'telc B1 guide · DE', labelDe: 'telc B1', labelAr: 'دليل telc B1 · DE', href: '/leitfaden/telc-b1/', kind: 'static' },
      { labelEn: 'Goethe B1 guide · DE', labelDe: 'Goethe-Zertifikat B1', labelAr: 'دليل Goethe B1 · DE', href: '/leitfaden/goethe-b1/', kind: 'static' },
      { labelEn: 'telc B2 guide · DE', labelDe: 'telc B2', labelAr: 'دليل telc B2 · DE', href: '/leitfaden/telc-b2/', kind: 'static' },
      { labelEn: 'DTZ guide · DE', labelDe: 'DTZ', labelAr: 'دليل DTZ · DE', href: '/leitfaden/dtz/', kind: 'static' },
      { labelEn: 'Platform comparisons · DE', labelDe: 'Plattform-Vergleich', labelAr: 'مقارنة المنصّات · DE', href: '/vergleich/', kind: 'static' },
      { labelEn: 'FAQ', labelDe: 'FAQ', labelAr: 'الأسئلة الشائعة · EN', href: '/faq/', kind: 'spa' },
      { labelEn: 'About us', labelDe: 'Über uns', labelAr: 'من نحن · EN', href: '/ueber-uns/', kind: 'spa' },
      { labelEn: 'Share your story', labelDe: 'Erfahrung teilen', labelAr: 'شارك تجربتك · EN', href: '/share-your-story/', kind: 'static' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Off-site channels. The YouTube channel URL used to be retyped at every call
// site (the Astro homepage, the podcasts tab, two organization.js twins and the
// index.html JSON-LD) — five literals that could drift apart, and a viewer sent
// to a dead handle is a subscriber lost. It is written ONCE here; the handle
// form is what YouTube canonicalises to (channel id UCnBauEHinta8cqDstwxA7RQ),
// and share links carry a `?si=` tracking suffix that must never be pasted in.
// kind: 'external' — always a full page load, always target=_blank + noopener.
// ─────────────────────────────────────────────────────────────────────────────
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@deutschmeister_de';

export const SOCIAL_LINKS = [
  {
    key: 'youtube',
    labelEn: 'YouTube',
    labelDe: 'YouTube',
    labelAr: 'YouTube',
    href: YOUTUBE_CHANNEL_URL,
    kind: 'external',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// THE way to reach a human. A ticket system shipped on 2026-09-13 and drew 0
// tickets from 1,685 accounts: its only form sat at the bottom of /profile,
// behind SubscriptionGuard, so ~97% of accounts (trial over, never paid) and
// every signed-out visitor could not reach it. /support is guard-free: signed
// in it shows the ticket form, signed out it offers sign-in or the published
// contact address. Rendered in both footers, the navbar account menu and the
// course home's own footer (tests/support.test.mjs pins every placement).
// ─────────────────────────────────────────────────────────────────────────────
export const SUPPORT_LINK = {
  key: 'support',
  labelEn: 'Help & feedback',
  labelDe: 'Hilfe & Feedback',
  labelAr: 'المساعدة والملاحظات · EN',
  href: '/support',
  kind: 'spa',
};

export const LEGAL_LINKS = [
  { labelEn: 'Privacy Policy', labelDe: 'Datenschutz', labelAr: 'سياسة الخصوصية · EN', href: '/privacy/', kind: 'static' },
  { labelEn: 'Impressum', labelDe: 'Impressum', labelAr: 'بيانات الناشر (Impressum) · DE', href: '/impressum/', kind: 'static' },
];

/** All nav+footer items flattened — what the consistency test iterates. */
export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...FOOTER_GROUPS.flatMap((g) => g.items),
  SUPPORT_LINK,
  ...LEGAL_LINKS,
];
