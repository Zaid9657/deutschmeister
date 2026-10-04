import { useEffect, useId, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ReferenceShell, { ChapterJump } from '../../components/course-v2/ReferenceShell.jsx';
import WordList from '../../components/course-v2/WordList.jsx';
import { searchWords, wordChapters } from '../../components/course-v2/kapitel.js';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { loadManifest, loadWords } from '../../lib/course-v2/loaders.js';
import { normalizeLevel } from '../../lib/course-v2/ids.js';

// /course/:level/wortschatz — the level's Lernwortschatz, the way a Lehrwerk prints its word list at
// the back of the book: every word of words.json, Kapitel by Kapitel, a noun with its article and
// plural („die Sprachschule, -n"; the article in neutral ink, never a kasus colour), its English
// gloss, and its example sentence on tap. One search field finds a word by its German (umlauts and ß
// folded: „strasse" finds „Straße") or its English. Read-only: nothing here is graded or stored.

export default function WordsPage() {
  const { level: levelParam } = useParams();
  const level = normalizeLevel(levelParam);
  const [, t] = useV2Strings();
  const [data, setData] = useState({ status: 'loading', manifest: null, words: [] });
  const [query, setQuery] = useState('');
  const searchId = useId();

  useEffect(() => {
    if (!level) return undefined;
    let cancelled = false;
    setData({ status: 'loading', manifest: null, words: [] });
    Promise.all([loadManifest(level), loadWords(level)])
      .then(([manifest, words]) => { if (!cancelled) setData({ status: 'ready', manifest, words: words || [] }); })
      .catch(() => { if (!cancelled) setData({ status: 'ready', manifest: null, words: [] }); });
    return () => { cancelled = true; };
  }, [level]);

  const hits = useMemo(() => searchWords(data.words, query), [data.words, query]);
  const chapters = useMemo(() => wordChapters(data.manifest, hits), [data.manifest, hits]);

  if (!level) return <Navigate to="/courses/" replace />;
  const LVL = level.toUpperCase();
  const searching = query.trim().length > 0;

  return (
    <ReferenceShell level={level} page="wortschatz" title={t('ref.wordsTitle', { level: LVL })} lead={data.words.length ? t('ref.wordsLead', { n: data.words.length }) : null}>
      {data.status === 'loading' && <p className="py-12 text-center text-[1rem] font-semibold text-game-muted">{t('ref.loading')}</p>}
      {data.status === 'ready' && !data.words.length && <p className="py-12 text-center text-[1rem] font-semibold text-game-muted">{t('ref.soon')}</p>}
      {data.words.length > 0 && (
        <>
          <div className="mb-5">
            <label htmlFor={searchId} className="text-[0.875rem] font-extrabold text-game-text">{t('ref.search')}</label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-game-muted" aria-hidden="true" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('ref.searchHint')}
                autoComplete="off"
                spellCheck={false}
                className="min-h-12 w-full rounded-2xl border-2 border-game-line bg-white py-2.5 pl-11 pr-4 text-[1.0625rem] font-bold text-game-text outline-none placeholder:font-semibold placeholder:text-game-muted focus:border-course"
              />
            </div>
            <p className="mt-2 text-[0.875rem] font-semibold text-game-muted" role="status" aria-live="polite">
              {searching ? (hits.length === 1 ? t('ref.resultOne') : hits.length ? t('ref.results', { n: hits.length }) : t('ref.noResults')) : ''}
            </p>
          </div>
          {!searching && <ChapterJump chapters={chapters} idPrefix="wk" />}
          <div className="space-y-8">
            {chapters.map((ch) => {
              const hid = ch.nr != null ? `wk-${ch.nr}` : 'wk-weitere';
              return (
                <section key={hid} id={hid} className="scroll-mt-24" aria-labelledby={`${hid}-h`}>
                  <h2 id={`${hid}-h`} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b-2 border-game-line pb-2 text-[1.25rem] font-extrabold leading-tight text-game-text">
                    <span>
                      {ch.nr != null ? (
                        <>
                          <span className="text-course-ink">{t('player.unit', { n: ch.nr })}</span>
                          {ch.title && <span lang="de"> · {ch.title}</span>}
                        </>
                      ) : t('ref.moreWords')}
                    </span>
                    <span className="text-[0.875rem] font-bold text-game-muted">{ch.words.length === 1 ? t('kap.wordOne') : t('kap.wordCount', { n: ch.words.length })}</span>
                  </h2>
                  <div className="mt-3 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4">
                    <WordList words={ch.words} idPrefix={hid} />
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </ReferenceShell>
  );
}
