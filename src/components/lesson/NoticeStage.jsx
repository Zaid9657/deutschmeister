import { useState } from 'react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/** **bold** → <strong>, *italic* → <em>. The curriculum's notice body is plain
 * text with at most those two marks, so nothing here needs a markdown parser
 * and nothing renders raw HTML. Exported: the practice feedback renders the
 * pool's `explanationEn` / `explanationDe`, which use the same two marks. */
export function inline(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

/**
 * The paragraph in the OTHER language, behind a small disclosure. In English
 * chrome the main paragraph is `bodyEn` and this opens the German original;
 * in Deutsch-Modus it is inverted. Exported for the practice feedback, which
 * shows `explanationEn` / `explanationDe` the same way.
 */
export function OtherLanguage({ text, lang, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel hover:text-siegel-deep"
      >
        {t('lang.readOther', lang)}
      </button>
      {open && (
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite" lang={lang === 'de' ? 'en' : 'de'}>
          {inline(text)}
        </p>
      )}
    </div>
  );
}

/**
 * Stage 3 — Notice. ONE grammar point, ≤ 60 words, with two examples taken
 * verbatim from the dialogue the learner just read, so the rule lands on
 * language already met. Reference material, so the card is FLAT (tokens rule 3).
 *
 * The rule is read in the chrome language: `bodyEn` first in English chrome
 * with the German `bodyDe` one tap away, and the other way round in
 * Deutsch-Modus. A notice without `bodyEn` (a draft level) shows the German
 * in both modes rather than nothing. The examples are German either way —
 * they are the content.
 */
export default function NoticeStage({ stage, onBack, onDone }) {
  const notice = stage.notice || {};
  const [lang] = useLessonLang();
  const english = lang !== 'de' && notice.bodyEn;
  const main = english ? notice.bodyEn : notice.bodyDe;
  const other = english ? notice.bodyDe : notice.bodyEn;
  return (
    <StageShell eyebrow={t('stage.notice.eyebrow', lang)} title={notice.title} onBack={onBack} primaryLabel={t('action.understood', lang)} onPrimary={onDone}>
      <Card className="p-5 sm:p-6">
        {notice.readingExample && (
          <section className="mb-5 border-b border-rule pb-5" aria-label={notice.readingExample.title}>
            <h2 className="font-bold text-ink" lang="de">{notice.readingExample.title}</h2>
            <p className="mt-2 text-sm text-graphite">{lang === 'de' ? notice.readingExample.questionDe : notice.readingExample.questionEn}</p>
            <blockquote className="mt-3 whitespace-pre-line border-l-2 border-siegel pl-4 text-ink" lang="de">{notice.readingExample.text}</blockquote>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-bold text-siegel">{lang === 'de' ? 'Antwort und Erklärung' : 'Answer and explanation'}</summary>
              <p className="mt-2 font-bold" lang="de">{notice.readingExample.answer}</p>
              <p className="mt-1 text-graphite">{lang === 'de' ? notice.readingExample.explanationDe : notice.readingExample.explanationEn}</p>
            </details>
          </section>
        )}
        <p className="text-[1rem] leading-relaxed text-graphite" lang={english ? 'en' : 'de'}>{inline(main)}</p>
        <OtherLanguage text={other} lang={lang} className="mt-3" />
        {(notice.examples || []).length > 0 && (
          <div className="mt-5 border-t border-rule pt-4">
          <p className="mb-2 font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">{t('stage.notice.examples', lang)}</p>
          <ul className="space-y-2" lang="de">
            {notice.examples.map((ex) => (
              <li key={ex} className="text-[1.0625rem] leading-relaxed text-ink">
                <span aria-hidden="true" className="mr-2 text-siegel">›</span>
                {ex}
              </li>
            ))}
          </ul>
          </div>
        )}
        {(notice.formExamples || []).length > 0 && (
          <div className="mt-5 border-t border-rule pt-4">
            <p className="font-bold text-ink">{t('stage.notice.moreExamples', lang)}</p>
            <ul className="mt-2 space-y-2 text-ink" lang="de">
              {notice.formExamples.map((ex) => <li key={ex}>{ex}</li>)}
            </ul>
          </div>
        )}
      </Card>
    </StageShell>
  );
}
