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
        <p className="text-[1rem] leading-relaxed text-graphite" lang={english ? 'en' : 'de'}>{inline(main)}</p>
        <OtherLanguage text={other} lang={lang} className="mt-3" />
        {(notice.examples || []).length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-rule pt-4" lang="de">
            {notice.examples.map((ex) => (
              <li key={ex} className="text-[1.0625rem] leading-relaxed text-ink">
                <span aria-hidden="true" className="mr-2 text-siegel">›</span>
                {ex}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-3 font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">
        {t('stage.notice.examples', lang)}
      </p>
    </StageShell>
  );
}
