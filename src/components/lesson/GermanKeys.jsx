import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** The German letters a foreign keyboard (Arabic, English, French …) does not have. */
export const GERMAN_KEYS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

/**
 * Insert `ch` into a text input at its caret and keep typing where it was.
 * Returns the new value; the caller owns the state (a controlled input).
 */
export function insertAtCaret(input, value, ch) {
  const v = String(value || '');
  if (!input || typeof input.selectionStart !== 'number') return v + ch;
  const start = input.selectionStart;
  const end = typeof input.selectionEnd === 'number' ? input.selectionEnd : start;
  return v.slice(0, start) + ch + v.slice(end);
}

/**
 * A row of insert buttons under a German answer field: ä ö ü ß and the
 * capitals. Typing `ae`/`oe`/`ue`/`ss` is accepted by the checker anyway
 * (src/utils/answerMatch.js), so this is a convenience, never a requirement —
 * and it never transliterates an Arabic answer. Each button is labelled in the
 * interface language („أدخل ä"), keeps the focus in the field and puts the
 * caret after the inserted letter.
 */
export default function GermanKeys({ inputRef, value, onChange, disabled = false, className = '' }) {
  const [lang] = useLessonLang();
  const insert = (ch) => {
    const input = inputRef && inputRef.current;
    const next = insertAtCaret(input, value, ch);
    const caret = input && typeof input.selectionStart === 'number' ? input.selectionStart + ch.length : next.length;
    onChange(next);
    if (input) {
      // After React has written the new value.
      window.requestAnimationFrame(() => {
        input.focus();
        try { input.setSelectionRange(caret, caret); } catch { /* not a text input */ }
      });
    }
  };
  return (
    <div role="group" aria-label={t('keys.label', lang)} className={`flex flex-wrap gap-1.5 ${className}`} dir="ltr">
      {GERMAN_KEYS.map((ch) => (
        <button
          key={ch}
          type="button"
          lang="de"
          disabled={disabled}
          // Keep the caret in the field: a mousedown on the button would blur it first.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(ch)}
          aria-label={t('keys.insert', lang, { char: ch })}
          className="min-h-9 min-w-9 rounded-clay border border-rule bg-white px-2 font-body text-[1rem] font-bold text-ink hover:border-siegel disabled:opacity-50"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
