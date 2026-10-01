import GameButton from './GameButton.jsx';

// The end of the learn path once every Kapitel is done (pathModel.courseFinish, audit
// CRITIC-02): a calm card under the Abschlusstest trophy — a headline („A1.1 geschafft!"
// once the Abschlusstest is submitted, „Alle 12 Kapitel geschafft!" before), one line, and
// ONE next action. The page scrolls it to the middle of the screen (it is focusable for that,
// not a tab stop). Its words come in the chrome language from strings.js (finish.*).
export default function CourseFinish({ finish }) {
  if (!finish) return null;
  return (
    <section
      id={finish.anchor}
      tabIndex={-1}
      aria-labelledby={`${finish.anchor}-title`}
      className="mx-auto mb-4 flex max-w-[22rem] flex-col items-center rounded-[20px] border-2 border-game-line bg-white px-5 py-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-course"
    >
      <h2 id={`${finish.anchor}-title`} className="text-[1.625rem] font-black leading-tight text-game-text">
        {finish.title}
      </h2>
      <p className="mt-2 text-base font-bold leading-snug text-game-muted">{finish.body}</p>
      {finish.action && finish.action.href && (
        <GameButton to={finish.action.href} className="mt-5 w-full">
          {finish.action.label}
        </GameButton>
      )}
    </section>
  );
}
