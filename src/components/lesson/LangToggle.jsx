import { Languages } from 'lucide-react';
import { LESSON_LANGS, t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * The Deutsch-Modus toggle: one small control in the header row of the player,
 * the checkpoint and the review screen. Two pills, `aria-pressed` on the one
 * that is on, persisted through useLessonLang (`dm_lesson_lang`). Default
 * English (docs/language-strategy.md: English chrome, German content). It
 * switches the CHROME only — the dialogue, the questions and the answers are
 * German in both modes, because that is what is being learned.
 *
 * Each pill is labelled in its own language („Deutsch" / "English") so the
 * learner who cannot read the current chrome can still find the way out.
 */
export default function LangToggle({ className = '' }) {
  const [lang, setLang] = useLessonLang();
  return (
    <div
      role="group"
      aria-label={t('lang.label', lang)}
      className={`inline-flex shrink-0 items-center rounded-pill border border-rule bg-white p-0.5 ${className}`}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5 text-graphite" aria-hidden="true" />
      {LESSON_LANGS.map((code) => {
        const on = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={on}
            className={`rounded-pill px-2 py-0.5 font-data text-[0.6875rem] font-bold uppercase tracking-[0.08em] transition-colors duration-100 motion-reduce:transition-none ${
              on ? 'bg-siegel text-white' : 'text-graphite hover:text-siegel-deep'
            }`}
          >
            {t(`lang.${code}`, lang)}
          </button>
        );
      })}
    </div>
  );
}
