import { useState } from 'react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { inline } from './richText.jsx';
import SupportText from './SupportText.jsx';
import { levelOfLektion, supportKeys } from '../../lib/lesson/support.js';

export { inline } from './richText.jsx';

/**
 * The paragraph in the OTHER language, behind a small disclosure. In English
 * chrome the main paragraph is `bodyEn` and this opens the German original;
 * in Deutsch-Modus it is inverted. Exported for the practice feedback, which
 * shows `explanationEn` / `explanationDe` the same way.
 */
export function OtherLanguage({ text, lang, className = '', otherLang = null }) {
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
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite" lang={otherLang || (lang === 'de' ? 'en' : 'de')} dir="ltr">
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
export default function NoticeStage({ stage, lektionId, onBack, onDone }) {
  const notice = stage.notice || {};
  const [lang] = useLessonLang();
  const id = lektionId || stage.lektionId || null;
  const level = levelOfLektion(id);
  // The rule in the interface language: English, German (Deutsch-Modus) or the
  // Arabic sidecar — and the German original one tap away in every language
  // but German itself.
  const english = lang === 'en' && notice.bodyEn;
  const other = lang === 'de' ? notice.bodyEn : notice.bodyDe;
  return (
    <StageShell
      eyebrow={t('stage.notice.eyebrow', lang)}
      title={notice.title ? <span lang="de" dir="ltr">{notice.title}</span> : null}
      lead={lang === 'ar' && notice.title ? <SupportText level={level} k={id ? supportKeys.noticeTitle(id) : null} de={notice.title} /> : null}
      onBack={onBack}
      primaryLabel={t('action.understood', lang)}
      onPrimary={onDone}
    >
      <Card className="p-5 sm:p-6">
        {lang !== 'ar' ? (
          <p className="text-[1rem] leading-relaxed text-graphite" lang={english ? 'en' : 'de'}>{inline(english ? notice.bodyEn : notice.bodyDe)}</p>
        ) : (
          <SupportText as="p" level={level} k={id ? supportKeys.noticeBody(id) : null} en={notice.bodyEn} de={notice.bodyDe} className="block text-[1rem] leading-relaxed text-graphite" />
        )}
        <OtherLanguage text={other} lang={lang} otherLang={lang === 'de' ? 'en' : 'de'} className="mt-3" />
        {(notice.examples || []).length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-rule pt-4" lang="de" dir="ltr">
            {notice.examples.map((ex) => (
              <li key={ex} className="text-[1.0625rem] leading-relaxed text-ink">
                <span aria-hidden="true" className="me-2 text-siegel">›</span>
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
