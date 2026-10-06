// Arabic number agreement, with Latin digits (docs/arabic/translation-guide.md).
//
// In Arabic the counted noun changes with the number: 1 and 2 replace the digit
// with a word (يوم واحد, يومان), 3–10 take the plural (7 أيام), 11–99 the
// singular accusative (14 يومًا), and 100, 101, 102 … the singular again. A
// fixed noun after a placeholder is therefore wrong for most values — the
// PR #188 review found „12 دروس", „2 يوم" and „8 ساعة" on screen. Every
// counted noun in the Arabic tables goes through this one function instead
// (tests/arabic-count.test.mjs keeps it that way):
//
//   lesson tables (src/lib/lesson/strings.js t()):  {n:درس واحد|درسان|دروس|درسًا}
//   i18next (src/locales/ar/app.js):                {{n, arcount(forms: يوم واحد|يومين|أيام|يومًا)}}
//
// The forms are written in the case the sentence needs (after من, في, بعد the
// dual is genitive: يومين). An optional fifth form is used for 0 and 100+;
// without it those take the fourth.

/**
 * @param {number|string} n
 * @param {string[]} forms [one, two, few (3–10), many (11–99), other?]
 */
export function arabicCount(n, forms) {
  const [one, two, few, many, other = many] = forms;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 0) return `${n} ${many}`;
  if (num === 1) return one;
  if (num === 2) return two;
  const r = num % 100;
  if (r >= 3 && r <= 10) return `${num} ${few}`;
  if (r >= 11 && r <= 99) return `${num} ${many}`;
  return `${num} ${other}`;
}

/** `{name:f1|f2|f3|f4}` → the counted phrase for vars[name]; anything unknown stays as written. */
export const COUNTED_PLACEHOLDER = /\{(\w+):([^{}]+)\}/g;

export function fillCounted(s, vars) {
  return s.replace(COUNTED_PLACEHOLDER, (m, name, forms) =>
    (vars[name] === undefined || vars[name] === null ? m : arabicCount(vars[name], forms.split('|'))));
}

/** Registers `arcount` with an i18next instance (src/utils/i18n.js). */
export function registerArabicCount(i18n) {
  i18n.services?.formatter?.add('arcount', (value, lng, options) =>
    arabicCount(value, String(options.forms || '').split('|')));
}
