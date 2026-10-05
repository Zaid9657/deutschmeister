import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { useSupportVersion, supportText } from '../../lib/lesson/support.js';
import { inline } from './richText.jsx';

/**
 * One piece of learning-support text (a meaning, an explanation, a task) in
 * the learner's interface language, with its language and direction on the
 * element that holds it. When the learner's language has no entry for this
 * key yet, the English source is shown — marked `lang="en"`, left-to-right,
 * with a visible „(بالإنجليزية)" — so a fallback is never a silent mix
 * (docs/arabic/README.md §4, fallback policy).
 *
 * `render` turns the text into nodes (NoticeStage's `inline` for **bold**);
 * `as` is the element.
 */
export default function SupportText({ level, k, en = null, de = null, as: Tag = 'span', className = '', render = null }) {
  const [lang] = useLessonLang();
  useSupportVersion();
  const v = supportText(lang, level, k, { en, de });
  if (!v.text) return null;
  // Default rendering keeps the course's two marks (**bold**, *italic*) and, in
  // Arabic, isolates German quotations (richText.jsx).
  const body = render ? render(v.text, v.lang) : inline(v.text, { rtl: v.lang === 'ar' });
  return (
    <Tag className={className} lang={v.lang} dir={v.lang === 'ar' ? 'rtl' : 'ltr'}>
      {body}
      {v.fallback && (
        <span lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="ms-1 text-[0.75em] font-normal text-graphite">
          {t(v.lang === 'de' ? 'support.inGerman' : 'support.inEnglish', lang)}
        </span>
      )}
    </Tag>
  );
}

/** The same lookup for places that need a string (aria-labels, tiles). */
export function useSupport(level) {
  const [lang] = useLessonLang();
  useSupportVersion();
  return (k, src) => supportText(lang, level, k, src || {});
}

/** German content: always lang="de", always left-to-right, isolated from the surrounding Arabic. */
export function De({ children, as: Tag = 'span', className = '' }) {
  return (
    <Tag lang="de" dir="ltr" className={className}>
      {children}
    </Tag>
  );
}
