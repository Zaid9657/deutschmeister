import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ReferenceShell, { ChapterJump } from '../../components/course-v2/ReferenceShell.jsx';
import RuleCardView from '../../components/course-v2/RuleCardView.jsx';
import { grammarChapters } from '../../components/course-v2/kapitel.js';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { hasUnit, loadManifest, loadRuleCards } from '../../lib/course-v2/loaders.js';
import { normalizeLevel, v2Paths } from '../../lib/course-v2/ids.js';

// /course/:level/grammatik — the level's grammar, the way a Lehrwerk prints its Grammatikübersicht
// at the back of the book: every rule card, Kapitel by Kapitel (the outline of each manifest row
// says which grammar the Kapitel teaches; kapitel.js grammarChapters), each with its model sentence,
// rule and table, plus a jump list. A grammar point taught again later without a new card is a
// „see Kapitel n" line, never the same card twice. Read-only: nothing here is graded or stored.

export default function GrammarPage() {
  const { level: levelParam } = useParams();
  const level = normalizeLevel(levelParam);
  const [, t] = useV2Strings();
  const [data, setData] = useState({ status: 'loading' });

  useEffect(() => {
    if (!level) return undefined;
    let cancelled = false;
    setData({ status: 'loading' });
    Promise.all([loadManifest(level), loadRuleCards(level)])
      .then(([manifest, cards]) => { if (!cancelled) setData({ status: 'ready', chapters: grammarChapters(manifest, cards) }); })
      .catch(() => { if (!cancelled) setData({ status: 'ready', chapters: [] }); });
    return () => { cancelled = true; };
  }, [level]);

  if (!level) return <Navigate to="/courses/" replace />;
  const LVL = level.toUpperCase();
  const chapters = data.chapters || [];

  return (
    <ReferenceShell level={level} page="grammatik" title={t('ref.grammarTitle', { level: LVL })} lead={t('ref.grammarLead')}>
      {data.status === 'loading' && <p className="py-12 text-center text-[1rem] font-semibold text-game-muted">{t('ref.loading')}</p>}
      {data.status === 'ready' && !chapters.length && <p className="py-12 text-center text-[1rem] font-semibold text-game-muted">{t('ref.soon')}</p>}
      {chapters.length > 0 && <ChapterJump chapters={chapters} />}
      <div className="space-y-10">
        {chapters.map((ch) => {
          const hid = ch.nr != null ? `kapitel-${ch.nr}` : 'kapitel-weitere';
          return (
            <section key={hid} id={hid} className="scroll-mt-24" aria-labelledby={`${hid}-h`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b-2 border-game-line pb-2">
                <h2 id={`${hid}-h`} className="text-[1.25rem] font-extrabold leading-tight text-game-text">
                  {ch.nr != null ? (
                    <>
                      <span className="text-course-ink">{t('player.unit', { n: ch.nr })}</span>
                      {ch.title && <span lang="de"> · {ch.title}</span>}
                    </>
                  ) : t('ref.more')}
                </h2>
                {ch.nr != null && hasUnit(level, ch.nr) && (
                  <Link to={v2Paths.unit(level, ch.nr)} className="inline-flex min-h-11 items-center gap-1 text-[0.875rem] font-extrabold text-course-ink hover:underline">
                    {t('ref.toChapter', { n: ch.nr })} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="mt-4 space-y-4">
                {ch.cards.map((card) => <RuleCardView key={card.id} card={card} title={(ch.titles && ch.titles[card.id]) || null} headingAs="h3" />)}
              </div>
              {ch.seeAlso.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {ch.seeAlso.map((x) => (
                    <li key={x.card.id}>
                      <a href={`#kapitel-${x.nr}`} className="inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-extrabold text-course-ink hover:underline">
                        {t('ref.seeAlso', { name: x.title || x.card.modelSentence || x.card.id, n: x.nr })} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </ReferenceShell>
  );
}
