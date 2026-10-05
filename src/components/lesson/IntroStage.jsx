import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, CheckCircle2 } from 'lucide-react';
import StageShell from './StageShell.jsx';
import CharacterAvatar from '../illustrations/CharacterAvatar.jsx';
import SituationScene from '../illustrations/SituationScene.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { lektionHasSupport, supportKeys } from '../../lib/lesson/support.js';
import { switchLocale } from '../../locales';
import SupportText from './SupportText.jsx';
import { A11_META } from '../../data/curricula/a11.meta.js';
import { courseHome } from '../../lib/courseFlow.js';

// The Lektion intro screen (Wave 1, 2026-09-19): the one screen a first-time
// learner sees BEFORE the first stage, so the pretest never opens on a person
// who does not yet know where they are. It is player state (`introDone` in
// LessonPlayerPage.jsx), not a `buildLesson` stage: it carries no item, records
// nothing, and `preview` mode skips it — so the stage count, the progress bar
// and every validator that reads the stage list stay exactly as they were.
//
// What it shows, and where each line comes from:
//   * the chapter (A11_META.chapters, grouped off the checkpoints) — orientation;
//   * "Lektion N · <title>" and the situation (lektionIntro.situationEn, or the
//     German `lektion.situation` in Deutsch-Modus);
//   * "By the end you can …" — lektionIntro.canDoEn, parallel to lektion.canDo
//     (tests/course-meta.test.mjs pins same length, same order);
//   * the people who speak in this Lektion — A11_META.characters filtered by
//     `appearsIn`, initial circles carrying `data-avatar-slot` for the Wave 2 art;
//   * the minutes (`lektion.minutes`, never typed);
//   * ONE primary action, Start.
//
// Chrome strings are `intro.*` keys of the lesson string table
// (src/lib/lesson/strings.js, en / de / ar), picked by the same useLessonLang()
// flag as every stage. The situation, the can-dos, the chapter and the roles
// are learning support (src/lib/lesson/support.js): English and German from the
// meta module and the curriculum, Arabic from the sidecar.
//
// A Lektion OUTSIDE the translated scope of the learner's language (Arabic
// covers Lektionen 1–3 for now) says so on this screen, before the first
// stage, with a one-tap way to the language that is complete — never a silent
// switch to English halfway through.
//
// A level without a meta module (anything but A1.1 today) still gets the
// screen: the German can-dos and situation from the curriculum, and the cast
// read off the dialogue lines.

/** The orientation module for a level, when one exists (A1.1 only today). */
export const courseMetaFor = (level) => (String(level).toLowerCase() === A11_META.level ? A11_META : null);

/** Cast of one Lektion: from the meta module when there is one, else read off the dialogue. */
export function castFor(lektion, meta) {
  if (meta?.characters) return meta.characters.filter((c) => c.appearsIn.includes(lektion.nr));
  const seen = [];
  for (const line of lektion.dialog?.lines ?? []) {
    const name = String(line.speaker || '').trim();
    if (name && !seen.some((c) => c.name === name)) seen.push({ name, roleEn: '', appearsIn: [lektion.nr] });
  }
  return seen;
}

export default function IntroStage({ curriculum, lektion, meta = courseMetaFor(curriculum?.level), onStart }) {
  const [lang] = useLessonLang();
  const de = lang === 'de';
  const level = curriculum?.level;
  const chapter = meta?.chapters.find((c) => c.lektionen.includes(lektion.nr)) || null;
  const intro = meta?.lektionIntro?.[lektion.id] || null;
  const canDosDe = lektion.canDo || [];
  const canDosEn = intro?.canDoEn?.length ? intro.canDoEn : null;
  const cast = castFor(lektion, meta);
  const outOfScope = !lektionHasSupport(lang, level, lektion.id);

  return (
    <div className="min-h-screen bg-paper font-body text-ink" data-intro-stage>
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-6 sm:pb-10 sm:pt-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            to={courseHome(curriculum.level)}
            className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep"
            aria-label={t('intro.backToCourse', lang)}
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /> <span dir="ltr">{curriculum.code}</span>
          </Link>
          {lektion.minutes ? (
            <span className="inline-flex items-center gap-1 rounded-pill bg-siegel-wash px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel-deep">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {t('intro.minutes', lang, { n: lektion.minutes })}
            </span>
          ) : null}
        </div>

        <SituationScene lektionId={lektion.id} className="mb-4 h-32 w-full rounded-clay border border-rule object-cover sm:h-40" />

        <StageShell
          eyebrow={chapter
            ? <>{t('intro.chapterLabel', lang, { nr: chapter.nr })} · <SupportText level={level} k={supportKeys.chapterTitle(chapter.nr)} en={chapter.titleEn} de={chapter.titleDe} /></>
            : t('intro.eyebrow', lang)}
          title={<>{t('intro.lektionLabel', lang, { nr: lektion.nr })} · <span lang="de" dir="ltr">{lektion.title}</span></>}
          lead={de || !intro?.situationEn
            ? <span lang="de" dir="ltr">{lektion.situation || ''}</span>
            : <SupportText level={level} k={supportKeys.introSituation(lektion.id)} en={intro.situationEn} />}
          primaryLabel={t('intro.start', lang)}
          onPrimary={onStart}
        >
          {outOfScope && (
            <div className="-mt-1 mb-5 rounded-clay border border-siegel/30 bg-siegel-wash p-4 text-[0.9375rem] leading-relaxed text-ink" role="note">
              <p>{t('intro.supportScope', lang)}</p>
              <button
                type="button"
                onClick={() => switchLocale('en', { surface: 'scope_notice' })}
                className="mt-2 inline-flex min-h-11 items-center rounded-pill border border-siegel px-4 text-sm font-bold text-siegel-deep hover:bg-white"
                lang="en"
                dir="ltr"
              >
                English
              </button>
            </div>
          )}
          {chapter && !de && (
            <p className="-mt-2 mb-5 font-data text-[0.75rem] text-graphite">
              <span lang="de" dir="ltr">{chapter.titleDe}</span> · <SupportText level={level} k={supportKeys.chapterStory(chapter.nr)} en={chapter.storyEn} />
            </p>
          )}
          <p className="mb-5 text-[0.8125rem] leading-relaxed text-graphite">{t('intro.stopResume', lang)}</p>

          {canDosDe.length > 0 && (
            <section aria-labelledby="dm-intro-cando" className="rounded-clay border border-rule bg-white p-4">
              <h2 id="dm-intro-cando" className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">
                {t('intro.byTheEnd', lang)}
              </h2>
              <ul className="mt-3 space-y-2">
                {canDosDe.map((lineDe, i) => (
                  <li key={lineDe} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-ink">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
                    {de || !canDosEn
                      ? <span lang="de" dir="ltr">{lineDe}</span>
                      : <SupportText level={level} k={supportKeys.introCanDo(lektion.id, i)} en={canDosEn[i]} />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {cast.length > 0 && (
            <section aria-labelledby="dm-intro-cast" className="mt-5">
              <h2 id="dm-intro-cast" className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">
                {t('intro.people', lang)}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-3">
                {cast.map((c) => (
                  <li key={c.name} className="flex items-center gap-2.5">
                    <span className="shrink-0 overflow-hidden rounded-full bg-siegel-wash" data-avatar-slot={c.name}>
                      <CharacterAvatar name={c.name} size={40} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.875rem] font-bold leading-tight text-ink">{c.name}</span>
                      {!de && c.roleEn ? <SupportText as="span" level={level} k={supportKeys.character(c.name)} en={c.roleEn} className="block max-w-[14rem] text-[0.75rem] leading-snug text-graphite" /> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </StageShell>
      </div>
    </div>
  );
}
