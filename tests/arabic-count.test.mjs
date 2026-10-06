// Arabic number agreement (src/lib/arabicCount.js). The PR #188 review found a
// fixed noun after a number placeholder rendering „12 دروس", „2 يوم", „8 ساعة"
// and „2 تقييمات" on screen: the noun has to change with the number. This file
// pins the rule, the two syntaxes that use it, and — so the class stays closed —
// that no Arabic interface string puts a countable noun after a bare number.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import i18next from 'i18next';

const { arabicCount, registerArabicCount } = await import('../src/lib/arabicCount.js');
const { t, registerLessonStrings } = await import('../src/lib/lesson/strings.js');
const { default: AR_LESSON } = await import('../src/locales/ar/lesson.js');
const { default: AR_APP } = await import('../src/locales/ar/app.js');

const DAYS = ['يوم واحد', 'يومان', 'أيام', 'يومًا'];

test('the agreement rule: words for 1 and 2, plural for 3–10, singular for 11–99, 100+ again singular', () => {
  assert.equal(arabicCount(1, DAYS), 'يوم واحد');
  assert.equal(arabicCount(2, DAYS), 'يومان');
  assert.equal(arabicCount(3, DAYS), '3 أيام');
  assert.equal(arabicCount(10, DAYS), '10 أيام');
  assert.equal(arabicCount(11, DAYS), '11 يومًا');
  assert.equal(arabicCount(99, DAYS), '99 يومًا');
  assert.equal(arabicCount(103, DAYS), '103 أيام');
  assert.equal(arabicCount(100, [...DAYS, 'يوم']), '100 يوم');
  assert.equal(arabicCount('∞', ['كلمة واحدة', 'كلمتان', 'كلمات', 'كلمة']), '∞ كلمة', 'a non-number keeps its digit and the general form');
});

test('lesson tables: {n:…} counts in Arabic and leaves English untouched', () => {
  registerLessonStrings('ar', AR_LESSON);
  assert.equal(
    t('course.summary', 'ar', { lektionen: 12, checkpoints: 4, words: 263, exam: 'X' }),
    '12 درسًا · 4 اختبارات مرحلية · 263 كلمة · تنتهي باختبار نهائي بصيغة X',
  );
  assert.equal(t('checkpoint.limit', 'ar', { limit: 3, hours: 8 }), '3 محاولات كل 8 ساعات.');
  assert.equal(t('welcome.castIn', 'ar', { n: 2 }), 'في درسين');
  assert.equal(t('course.summary', 'en', { lektionen: 12, checkpoints: 4, words: 263, exam: 'X' }), '12 Lektionen · 4 checkpoints · 263 words · ends with the X final test');
});

test('i18next: {{n, arcount(forms: …)}} counts in the account screens', async () => {
  const i18n = i18next.createInstance();
  await i18n.init({ lng: 'ar', resources: { ar: { translation: AR_APP } }, interpolation: { escapeValue: false } });
  registerArabicCount(i18n);
  assert.equal(i18n.t('account.trial.daysLeft', { n: 2 }), 'يتبقى لك من الوصول الكامل يومان.');
  assert.equal(i18n.t('account.trial.daysLeft', { n: 5 }), 'يتبقى لك من الوصول الكامل 5 أيام.');
  assert.equal(i18n.t('account.signup.benefitAi', { writing: 2, speaking: 2 }), 'خلال التجربة: تقييمان آليان للكتابة وجلستا تحدّث بالذكاء الاصطناعي (بالألمانية والإنجليزية)');
  assert.equal(i18n.t('account.login.resendIn', { s: 44 }), 'أرسل رسالة جديدة بعد 44 ثانية');
});

test('the app registers arcount on its own i18next instance', async () => {
  const { readFileSync } = await import('node:fs');
  assert.match(readFileSync(new URL('../src/utils/i18n.js', import.meta.url), 'utf8'), /registerArabicCount\(i18n\);/);
});

// A countable noun right after a bare number placeholder is the bug this file
// exists for. Counted placeholders ({n:…}, {{n, arcount(…)}}) do not match.
const COUNTABLE = /\{\{?(\w+)\}?\}\s*(يوم|أيام|يومًا|درس|دروس|درسًا|كلمة|كلمات|دقيقة|دقائق|ساعة|ساعات|أسبوع|أسابيع|أسبوعًا|شهر|أشهر|شهرًا|محاولة|محاولات|مهمة|مهام|ثانية|ثوان|فصل|فصول|فصلًا|وحدة|وحدات|تقييم|تقييمات|جلسة|جلسات|اختبار|اختبارات|خطوة|خطوات|بطاقة|بطاقات|سؤال|أسئلة|مستوى|مستويات)(?![ء-ي])/;
const strings = (o, path = []) => Object.entries(o).flatMap(([k, v]) =>
  (typeof v === 'string' ? [[[...path, k].join('.'), v]] : v && typeof v === 'object' ? strings(v, [...path, k]) : []));

test('no Arabic interface string puts a countable noun after a bare number', () => {
  const offenders = [...strings(AR_LESSON), ...strings(AR_APP, ['app'])]
    .filter(([, v]) => COUNTABLE.test(v))
    .map(([k, v]) => `${k}: ${v}`);
  assert.deepEqual(offenders, [], 'count it: {n:one|two|few|many} or {{n, arcount(forms: …)}} (src/lib/arabicCount.js)');
});
