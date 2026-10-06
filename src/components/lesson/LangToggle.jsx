import { useState } from 'react';
import { Languages } from 'lucide-react';
import { LOCALE_NAMES, LOCALE_SWITCH_ORDER, useLocale } from '../../lib/locale.js';
import { switchLocale } from '../../locales';

// The group's name in each interface language. It lives here, not in the lesson
// string table, because the site navigation renders this switch on every page:
// importing src/lib/lesson/strings.js from the navbar put the whole lesson table
// (three languages) into the main bundle — +16 kB gzipped for every visitor.
const GROUP_LABEL = { en: 'Instruction language', de: 'Sprache der Anleitungen', ar: 'لغة الواجهة والشرح' };

/**
 * The language switch: one small control in the header row of the player,
 * the checkpoint, the review screen, the course home and the app menu. Three
 * pills — „العربية · English · Deutsch", each named in its own language and
 * marked with its own `lang`, no flags — `aria-pressed` on the one that is on.
 * It switches the INTERFACE (instructions, explanations, feedback) for the
 * whole product (src/lib/locale.js); the dialogue, the questions and the
 * answers are German in every language, because that is what is being learned.
 * Switching never remounts the stage: answers, the current item and the run
 * snapshot stay exactly where they were.
 *
 * Arabic is loaded on demand (src/locales/index.js) before the switch happens,
 * so the pill never flips to a table of English fallbacks.
 *
 * `size="touch"` (the site navigation and the phone menu) makes every pill a
 * 44px target, like the rest of the navigation; the lesson headers keep the
 * compact row because they share it with the progress bar.
 */
export default function LangToggle({ className = '', surface = 'lesson', size = 'compact' }) {
  const [lang] = useLocale();
  const [busy, setBusy] = useState(null);
  const choose = (code) => {
    if (code === lang || busy) return;
    setBusy(code);
    switchLocale(code, { surface }).finally(() => setBusy(null));
  };
  return (
    <div
      role="group"
      aria-label={GROUP_LABEL[lang] || GROUP_LABEL.en}
      className={`inline-flex shrink-0 items-center rounded-pill border border-rule bg-white p-0.5 ${className}`}
    >
      <Languages className="ms-1.5 h-3.5 w-3.5 text-graphite" aria-hidden="true" />
      {LOCALE_SWITCH_ORDER.map((code) => {
        const on = lang === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            dir={code === 'ar' ? 'rtl' : 'ltr'}
            onClick={() => choose(code)}
            aria-pressed={on}
            aria-busy={busy === code || undefined}
            // The Arabic name on a non-Arabic screen uses system faces only, so naming
            // Arabic never downloads the Arabic face (design-tokens.js `endonym`).
            className={`${code === 'ar' && lang !== 'ar' ? 'font-endonym ' : ''}${size === 'touch' ? 'min-h-11 min-w-11 px-3' : 'min-h-8 px-2'} rounded-pill py-0.5 text-[0.75rem] font-bold transition-colors duration-100 motion-reduce:transition-none ${
              on ? 'bg-siegel text-white' : 'text-graphite hover:text-siegel-deep'
            }`}
          >
            {LOCALE_NAMES[code]}
          </button>
        );
      })}
    </div>
  );
}
