import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { lektionPath, rememberPlace, saveProgressSignupHref, settleAsk } from '../../lib/course/saveProgressAsk.js';

// The save-progress ask after a signed-out learner's first checked answer
// (owner decision 2026-10-06; the rule and its reasons are in
// src/lib/course/saveProgressAsk.js). It takes the place of the next screen
// for one stop and is never a wall: "Continue without saving" goes straight on
// to the screen the learner was heading to. Either button settles the ask for
// this Lektion, so it does not come back after the next answer.
//
// The signup door is a plain href (the door tag is read on a page load). The
// login link is a router <Link> carrying the Lektion as `state.from`, which
// LoginPage honours; the run itself survives in this tab's sessionStorage.

export default function SaveProgressAsk({ level, lektion, onContinue }) {
  const [lang] = useLessonLang();
  const heading = useRef(null);
  const here = lektionPath(level, lektion.nr);

  // The ask replaces the screen the learner just left: say so to a screen reader.
  useEffect(() => { heading.current?.focus(); }, []);

  const settle = () => settleAsk(level, lektion.id);
  const save = () => {
    settle();
    rememberPlace({ level, lektionId: lektion.id, lektionNr: lektion.nr });
  };

  return (
    <section aria-labelledby="save-ask-title" className="flex min-h-[60vh] flex-col" data-save-ask="first">
      <header className="mb-5">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{t('saveAsk.eyebrow', lang)}</p>
        <h1
          id="save-ask-title"
          ref={heading}
          tabIndex={-1}
          className="mt-2 font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.018em] outline-none sm:text-[1.75rem]"
        >
          {t('saveAsk.title', lang)}
        </h1>
      </header>

      <Card raised edge="siegel" className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
            <Save className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed text-graphite">{t('saveAsk.body', lang)}</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            href={saveProgressSignupHref({ door: 'first', level, lektionNr: lektion.nr })}
            onClick={save}
            size="lg"
            className="w-full text-center sm:w-auto"
          >
            {t('saveAsk.cta', lang)}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => { settle(); onContinue(); }}
            className="w-full text-center sm:w-auto"
          >
            {t('saveAsk.skip', lang)}
          </Button>
        </div>
        <Link
          to="/login"
          state={{ from: { pathname: here } }}
          onClick={settle}
          className="mt-4 inline-block font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-siegel hover:text-siegel-deep"
        >
          {t('save.haveAccount', lang)}
        </Link>
      </Card>
    </section>
  );
}
