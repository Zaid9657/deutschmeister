import { ALPHABET, DIGITS, PRICES, FULL_HOUR } from '../../data/curricula/a11.sets.js';
import { referenceKinds } from '../../lib/lesson/taughtSet.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import SetBoard from './SetBoard.jsx';

const sets = [ALPHABET, DIGITS, PRICES, FULL_HOUR];
/** Native details keeps the reference one tap away, with keyboard and close support. */
export default function SetReference({ item, lektionId }) {
  const [lang] = useLessonLang();
  const kinds = referenceKinds(item, sets);
  if (!kinds.length || !String(lektionId || '').startsWith('a1.1-')) return null;
  return <details className="my-3 rounded-xl border border-rule bg-white p-3">
    <summary className="min-h-11 cursor-pointer text-sm font-bold text-siegel">{t('set.reference', lang)}</summary>
    {sets.filter((set) => kinds.includes(set.kind)).map((set) => <section key={set.id}>
      <h3 className="mt-3 font-semibold text-ink">{lang === 'de' ? set.titleDe : set.titleEn}</h3>
      <SetBoard members={set.members} lektionId={lektionId} boardKey={`reference-${set.id}`} lang={lang} />
      {set.rule && <><p className="text-sm text-ink">{set.rule[lang]}</p>{set.rule.examples && <SetBoard members={set.rule.examples} lektionId={lektionId} boardKey={`reference-${set.id}-rule`} lang={lang} />}</>}
    </section>)}
  </details>;
}
