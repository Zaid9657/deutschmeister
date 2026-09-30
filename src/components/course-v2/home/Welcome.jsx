import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import CastAvatar from '../CastAvatar.jsx';
import { useV2Strings } from '../strings.js';
import GameButton from './GameButton.jsx';
import { hueVars } from './hue.js';

// The first visit's welcome (pathModel.welcomeModel): a few short screens, ONE thing
// each, in place of the long plan that used to open the page (owner 2026-09-30: "it looks
// intimidating and too much … step for step"). The page shows it only while nothing in
// the level is finished and the welcome was not finished or skipped on this device
// (pathModel.showWelcome, welcomeStorageKey).
//   1 „hallo" — Priya (the A1 narrator) pops in, and a speech bubble with the course's
//               promise in two short sentences (pathModel.shortPromise);
//   2 „ziele" — „Das lernen Sie in A1.1": three big rows from the can-dos
//               (pathModel.outcomeLine), and „12 Kapitel · 4 Module · Abschlusstest"
//               counted from the manifest (pathModel.courseShape);
//   3 „tempo" — „Wie viel Zeit haben Sie pro Tag?": the three pace presets as big tiles
//               (minutes per learning day, days per week, the finish date) — the same
//               pick and the same storage as the plan's pace picker.
// A top bar with a thin dot indicator and a quiet „Überspringen"; one big button at the
// bottom: „Weiter", and „Los geht’s" on the last screen, which ends the welcome.
// The chrome (headings, buttons, the tiles' lines) follows the lesson language like the
// player (strings.js `welcome.*`, English by default) — a complete beginner has to be able
// to read the screen that asks for their pace. The promise and the can-dos are content and
// stay German (lang="de"); pathModel.welcomeModel/paceTile take the same `lang`.

const ROW_HUES = ['tuerkis', 'orange', 'beere'];

function Dots({ count, at }) {
  if (count < 2) return <span />;
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, k) => (
        <span
          key={k}
          className={
            k === at
              ? 'h-2.5 w-7 rounded-full bg-course transition-all duration-200 motion-reduce:transition-none'
              : k < at
                ? 'h-2.5 w-2.5 rounded-full bg-course transition-all duration-200 motion-reduce:transition-none'
                : 'h-2.5 w-2.5 rounded-full bg-game-locked transition-all duration-200 motion-reduce:transition-none'
          }
        />
      ))}
    </span>
  );
}

function Hallo({ model, headRef }) {
  const [, t] = useV2Strings();
  return (
    <div className="flex flex-col items-center">
      <h1 ref={headRef} tabIndex={-1} className="sr-only">{t('welcome.title', { code: model.code })}</h1>
      {model.narrator ? (
        <CastAvatar name={model.narrator} size={120} decorative className="motion-safe:animate-pop-in" />
      ) : (
        <span className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-course-wash text-[2rem] font-black text-course-ink motion-safe:animate-pop-in" aria-hidden="true">
          {model.code}
        </span>
      )}
      <div className="relative mt-7 w-full rounded-[22px] border-2 border-b-4 border-game-line bg-white px-5 py-4">
        <span aria-hidden="true" className="absolute -top-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-game-line bg-white" />
        <p className="relative text-[1.3125rem] font-extrabold leading-snug text-game-text" lang="de">{model.promise}</p>
      </div>
    </div>
  );
}

function Ziele({ model, headRef }) {
  return (
    <div>
      <h1 ref={headRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight">{model.heading}</h1>
      <ul className="mt-6 flex flex-col gap-3">
        {model.outcomes.map((o, k) => (
          <li
            key={o}
            style={hueVars(ROW_HUES[k % ROW_HUES.length])}
            className="flex min-h-[4.5rem] items-center gap-4 rounded-[18px] border-2 border-b-4 border-game-line bg-white px-4 py-3"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--hue)] text-white shadow-[0_3px_0_var(--hue-edge)]" aria-hidden="true">
              <Check className="h-6 w-6" strokeWidth={3.4} />
            </span>
            <span className="text-lg font-black leading-snug" lang="de">{o}</span>
          </li>
        ))}
      </ul>
      {model.shape && <p className="mt-5 text-center text-base font-bold text-game-muted">{model.shape}</p>}
      {model.note && <p className="mt-1.5 text-center text-[0.9375rem] font-bold text-game-muted">{model.note}</p>}
    </div>
  );
}

function Tempo({ tiles, pace, onPace, headRef }) {
  const [, t] = useV2Strings();
  return (
    <div>
      <h1 ref={headRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight">{t('welcome.tempo')}</h1>
      <fieldset className="mt-6">
        <legend className="sr-only">{t('welcome.tempoLegend')}</legend>
        <div className="flex flex-col gap-3">
          {tiles.map((t) => {
            const on = t.id === pace;
            return (
              <label key={t.id} className="block cursor-pointer">
                <input
                  type="radio"
                  name="dm-welcome-tempo"
                  value={t.id}
                  checked={on}
                  onChange={() => onPace(t.id)}
                  className="peer sr-only"
                />
                <span
                  className={`flex items-center gap-4 rounded-[18px] border-2 border-b-4 px-4 py-3.5 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-course-soft ${
                    on ? 'border-course bg-course-wash' : 'border-game-line bg-white hover:bg-course-wash'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[1.3125rem] font-black leading-tight">{t.title}</span>
                      <span className={`text-[0.8125rem] font-black uppercase tracking-wider ${on ? 'text-course-ink' : 'text-game-muted'}`}>{t.name}</span>
                    </span>
                    {t.days && <span className="mt-0.5 block text-[0.9375rem] font-bold leading-snug text-game-muted">{t.days}</span>}
                    {t.finish && <span className={`block text-[0.9375rem] font-extrabold leading-snug ${on ? 'text-course-ink' : 'text-game-muted'}`}>{t.finish}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-course bg-course text-white' : 'border-game-line bg-white'}`}
                  >
                    {on && <Check className="h-5 w-5" strokeWidth={3.6} />}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export default function Welcome({ model, tiles = [], pace, onPace, onDone, lifted = false }) {
  const [, t] = useV2Strings();
  const screens = model.screens;
  const [at, setAt] = useState(0);
  const headRef = useRef(null);
  const screen = screens[Math.min(at, screens.length - 1)];
  const last = at >= screens.length - 1;

  // a new screen: its heading takes focus, so a screen reader reads the new screen
  useEffect(() => {
    if (at > 0 && headRef.current) headRef.current.focus({ preventScroll: true });
    try {
      window.scrollTo(0, 0);
    } catch {
      // no window (tests)
    }
  }, [at]);

  const next = () => (last ? onDone('done') : setAt((i) => i + 1));

  return (
    <div
      className={`mx-auto flex max-w-xl flex-col px-5 pt-16 ${
        lifted ? 'min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh]' : 'min-h-[100dvh]'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-4">
        <Dots count={screens.length} at={at} />
        <p className="sr-only" aria-live="polite">{t('welcome.stepOf', { n: at + 1, t: screens.length })}</p>
        <button
          type="button"
          onClick={() => onDone('skipped')}
          className="-mr-2 min-h-11 rounded-xl px-3 text-base font-black text-game-muted hover:bg-course-wash hover:text-course-ink"
        >
          {t('welcome.skip')}
        </button>
      </div>
      <div key={screen} className="flex flex-1 flex-col justify-center py-6 motion-safe:animate-fade-in">
        {screen === 'hallo' && <Hallo model={model} headRef={headRef} />}
        {screen === 'ziele' && <Ziele model={model} headRef={headRef} />}
        {screen === 'tempo' && <Tempo tiles={tiles} pace={pace} onPace={onPace} headRef={headRef} />}
      </div>
      <div className="shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <GameButton onClick={next} className="w-full">{last ? t('welcome.go') : t('welcome.next')}</GameButton>
      </div>
    </div>
  );
}
