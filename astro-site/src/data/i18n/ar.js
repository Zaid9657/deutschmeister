// Arabic copy for the public pages of the Arabic edition (docs/arabic/README.md):
// /ar/, /ar/courses/, /ar/courses/a1-1/, /ar/pricing/, /ar/help/ and the Arabic
// chrome of Layout.astro.
//
// STATUS: DRAFT. Machine-authored Modern Standard Arabic, not yet reviewed by a
// native Arabic editor or a DaF teacher (the review gate is in the README, §4).
// Nothing here may be called reviewed until a named person signs it off.
//
// RULES (the same as the lesson sidecar, docs/arabic/translation-guide.md):
//   - Latin digits; prices, counts and durations are DERIVED from the data
//     modules and filled in by the helpers below, never typed into a sentence;
//   - a German word or sentence is written «like this» and rendered isolated
//     (`arRich`), with lang="de" and left-to-right, never transliterated;
//   - no outcome promises, no learner or usage counts, no staffing or response
//     times, no discounts that do not exist;
//   - where something is English (emails, checkout, later lessons) the page
//     says so instead of hiding it.
import { TRIAL_DAYS } from '../marketing.js';
import { COURSE_PRO_MONTHS } from '../pricing.js';

/** The app door every Arabic CTA uses: the free course, with Arabic chosen explicitly. */
export const AR_COURSE_HREF = '/course/a1.1?lang=ar';

// ── Arabic counting (number agreement with Latin digits) ────────────────────
const counted = (one, two, few, many) => (n) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;
/** 7 → "7 أيام", 14 → "14 يومًا". */
export const arDays = counted('يوم واحد', 'يومان', 'أيام', 'يومًا');
/** 3 → "3 أشهر", 12 → "12 شهرًا". */
export const arMonths = counted('شهر واحد', 'شهران', 'أشهر', 'شهرًا');
/** 3 → "3 دروس", 12 → "12 درسًا". */
export const arLessons = counted('درس واحد', 'درسان', 'دروس', 'درسًا');
/** 25 → "25 دقيقة", 5 → "5 دقائق". */
export const arMinutes = counted('دقيقة واحدة', 'دقيقتان', 'دقائق', 'دقيقة');
/** 40 → "40 ساعة". */
export const arHours = counted('ساعة واحدة', 'ساعتان', 'ساعات', 'ساعة');
/** 28 → "28 خطوة". */
export const arSteps = counted('خطوة واحدة', 'خطوتان', 'خطوات', 'خطوة');

// ── Inline marks → isolated HTML (mirror of src/components/lesson/richText.jsx) ──
const ARABIC_LETTER = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
const LATIN_LETTER = /[A-Za-zÄÖÜäöüß]/;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const german = (s) => LATIN_LETTER.test(s) && !ARABIC_LETTER.test(s);
/**
 * Arabic text → safe HTML for `set:html`: every German quotation «…» / „…“ and
 * every **bold** Latin run is wrapped in `<bdi lang="de" dir="ltr">`, so it keeps
 * its own order inside the right-to-left sentence and a screen reader switches
 * voice for it. Everything else is escaped; nothing is ever reversed.
 */
export const arRich = (text) =>
  esc(text)
    .replace(/\*\*([^*]+)\*\*/g, (m, inner) => `<strong>${german(inner) ? `<bdi lang="de" dir="ltr">${inner}</bdi>` : inner}</strong>`)
    .replace(/(«|„)([^»“]+)(»|“)/g, (m, open, inner, close) => (german(inner) ? `${open}<bdi lang="de" dir="ltr">${inner}</bdi>${close}` : m));

// ── The chrome (Layout.astro on an Arabic page) ─────────────────────────────
export const AR_CHROME = {
  skip: 'تخطَّ إلى المحتوى',
  mainNav: 'القائمة الرئيسية',
  logIn: 'تسجيل الدخول',
  startTrial: `ابدأ تجربة ${arDays(TRIAL_DAYS)}`,
  startFree: 'ابدأ A1.1 مجانًا',
  startFreeNoAccount: 'ابدأ A1.1 مجانًا — دون حساب',
  continueLearning: 'تابع التعلّم',
  dashboard: 'لوحة التحكم',
  menu: 'القائمة',
  coursesByLevel: 'الدورات حسب المستوى',
  free: 'مجاني',
  building: 'قيد الإعداد',
  footerBlurb:
    'الألمانية من A1.1 إلى B2.2، محطةً بعد محطة: دورات موجَّهة، وقواعد، واستماع، وقراءة، وتدريب على التحدّث بالذكاء الاصطناعي. الشرح العربي متوفر الآن في الدروس 1–3 من A1.1.',
  createAccount: 'أنشئ حسابًا مجانيًا',
  rights: 'جميع الحقوق محفوظة',
  help: 'المساعدة بالعربية',
  ogImageAlt: 'ختم DeutschMeister بجانب عبارة إنجليزية: «Learn German grammar, listening and speaking — A1 to B2»',
  language: 'اللغة',
};

// ── The language switch (LanguageSwitch.astro) ──────────────────────────────
export const LANGUAGE_SWITCH = {
  label: 'Language · اللغة · Sprache',
  suggest: 'هذه الصفحة متوفرة بالعربية.',
  suggestLink: 'اعرضها بالعربية',
  dismiss: 'إغلاق',
  // Shown on the English page a "Deutsch" click lands on: there is no German
  // version of these pages, but the app interface follows the choice.
  germanNotice: 'Diese Seite gibt es nur auf Englisch. Die App — Kurs, Lektionen und Anmeldung — zeigt ab jetzt Deutsch.',
};

// ── Level descriptions (one line each; the English is LEVEL_OUTCOME_EN) ─────
export const LEVEL_OUTCOME_AR = {
  'a1.1': 'عرّف بنفسك، واطرح أسئلة بسيطة، وافهم اللافتات والإعلانات القصيرة.',
  'a1.2': 'تحدّث عن يومك وبيتك وخططك، واكتب رسالة إلكترونية قصيرة؛ يغطي محتوى امتحان «Start Deutsch 1» كاملًا.',
  'a2.1': 'تعامَل مع المواعيد والتسوّق والاتجاهات وزيارة الطبيب؛ وهنا تبدأ نهايات الصفات وصيغة الماضي.',
  'a2.2': 'اذكر الأسباب والآراء، واطلب بأدب، وتابع الأخبار والإعلانات؛ يغطي محتوى امتحان «Goethe-Zertifikat A2» كاملًا.',
  'b1.1': 'ادعم رأيك بـ«weil» و«obwohl» و«deshalb»؛ والجمل الموصولة، و«Konjunktiv II»، وحالة الإضافة «Genitiv».',
  'b1.2': 'المبني للمجهول، والكلام المنقول، والماضي السردي؛ يغطي محتوى امتحانَي «telc B1» و«Goethe B1» كاملًا.',
  'b2.1': 'الجمل المركّبة، والأسلوب الاسمي، وأدوات الربط الدقيقة للعمل والدراسة.',
  'b2.2': 'لغة الدراسة والعمل المهني؛ يغطي محتوى امتحان «telc B2» كاملًا.',
};

/** What exists in Arabic today — the same table on the home, catalogue and A1.1 pages. */
export const COVERAGE_ROWS = [
  { what: 'وصف الدورات والأسعار والمساعدة', where: 'هذه الصفحات العربية', ar: true },
  { what: 'الشرح داخل الدروس: التعليمات، والمعاني، والقواعد، والتصحيح', where: 'A1.1، الدروس 1–3', ar: true },
  { what: 'واجهة الدورة: الأزرار، والتقدّم، والمراجعة، وتسجيل الدخول', where: 'صفحة دورة A1.1 ودروسها ومراجعتها', ar: true },
  { what: 'الشرح داخل الدروس', where: 'A1.1، الدروس 4–12، والمستويات الأخرى', ar: false, note: 'بالإنجليزية حاليًا — يظهر عليه وسم «بالإنجليزية»' },
  { what: 'تقييم الكتابة والتحدّث بالذكاء الاصطناعي', where: 'كل الدورات', ar: false, note: 'بالألمانية' },
  { what: 'رسائل البريد الإلكتروني وصفحة الدفع', where: 'الحساب والشراء', ar: false, note: 'بالإنجليزية (صفحة الدفع لا تدعم العربية: تظهر بلغة المتصفح إن كانت مدعومة)' },
];

export const COVERAGE_HEAD = { what: 'ماذا', where: 'أين', status: 'بالعربية؟', yes: 'نعم', no: 'لا' };

// ── Shared lines ─────────────────────────────────────────────────────────────
export const AR_LINES = {
  draftNote: 'الترجمة العربية في هذه الصفحات مسودّة لم يراجعها بعدُ محرّر عربي. إن وجدت خطأً فأخبرنا من صفحة المساعدة.',
  englishOnly: 'شرح بالإنجليزية فقط',
  germanContent: 'الحوارات والتمارين والإجابات بالألمانية دائمًا — فهذا ما تتعلّمه.',
  proMonths: `${arMonths(COURSE_PRO_MONTHS)} من Pro مشمولة`,
};
