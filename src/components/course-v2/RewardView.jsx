import { useMemo, useState } from 'react';
import GameButton, { QuietButton } from './GameButton.jsx';
import InputView from './InputView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-course-ink';

/** The pieces of a reward block in the order SCHEMA §10 lists them. */
export function rewardPieces(reward) {
  const r = reward || {};
  const out = [];
  if (r.lesemagazin) out.push({ id: 'lesemagazin', label: 'Lesemagazin', input: { title: r.lesemagazin.title, text: { de: r.lesemagazin.text } }, items: r.lesemagazin.items || [] });
  if (r.hoermagazin) out.push({ id: 'hoermagazin', label: 'Hörmagazin', input: { title: r.hoermagazin.title, lines: r.hoermagazin.lines || [] }, items: r.hoermagazin.items || [] });
  if (r.scene && Array.isArray(r.scene.lines) && r.scene.lines.length) out.push({ id: 'scene', label: null, input: { lines: r.scene.lines }, items: [] });
  if (r.projekt && r.projekt.microOutput) out.push({ id: 'projekt', label: null, projekt: r.projekt, items: [] });
  return out;
}

/**
 * The Plateau's reward block (SCHEMA §10 `reward`, BLUEPRINT §5.2): a Lesemagazin text, a
 * Hörmagazin piece, a serial scene, a Landeskunde project — each read or heard first, then its
 * items with feedback. Never graded and never required: the items give feedback like any
 * Lernmodus item, but no result of theirs is shown or counted, and „Überspringen" is always there.
 *
 * onAttempt(payload) per answered item; onDone() once, when the learner moves on.
 */
export default function RewardView({ reward, unitId, stepId, level, lines = null, onAttempt, onDone }) {
  const [, t] = useV2Strings();
  const pieces = useMemo(() => rewardPieces(reward), [reward]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('read'); // read | items
  const piece = pieces[idx] || null;

  const nextPiece = () => {
    if (idx + 1 >= pieces.length) { if (typeof onDone === 'function') onDone(); return; }
    setIdx(idx + 1);
    setPhase('read');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const skip = (
    <QuietButton onClick={() => typeof onDone === 'function' && onDone()}>
      {t('as.rewardSkip')}
    </QuietButton>
  );

  if (!piece) {
    return <div className="flex justify-center">{skip}</div>;
  }

  const eyebrow = piece.label || (piece.id === 'scene' ? t('as.rewardScene') : t('as.rewardProjekt'));

  return (
    <div>
      <p className={LABEL}>{eyebrow}</p>
      <p className="mt-1 text-[0.9375rem] font-semibold text-game-muted">{t('as.rewardLead')}</p>

      {piece.projekt ? (
        <div className="mt-4">
          <div className="mb-4 rounded-[1.25rem] border-2 border-game-line bg-course-wash p-4">
            <p className="text-[1rem] font-semibold leading-relaxed text-game-text" lang="de">{piece.projekt.promptDe}</p>
          </div>
          <MicroOutputView key={`${stepId}-projekt`} mo={piece.projekt.microOutput} level={level} onDone={nextPiece} />
        </div>
      ) : phase === 'read' ? (
        <div className="mt-4">
          <InputView input={piece.input} unitId={unitId} />
          <div className="mt-8 flex flex-col items-stretch gap-2">
            <GameButton onClick={() => (piece.items.length ? setPhase('items') : nextPiece())}>
              {piece.items.length ? t('item.next') : t('as.rewardDone')}
            </GameButton>
            {skip}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <details className="mb-5 rounded-[1.25rem] border-2 border-game-line bg-white p-4">
            <summary className="min-h-11 cursor-pointer text-[0.9375rem] font-extrabold text-game-muted">{t('as.textAgain')}</summary>
            <div className="mt-3"><InputView input={piece.input} unitId={unitId} /></div>
          </details>
          <ItemRun
            key={`${stepId}-${piece.id}`}
            items={piece.items}
            unitId={unitId}
            lines={lines}
            stepId={stepId}
            level={level}
            onAttempt={onAttempt}
            onFinish={nextPiece}
          />
        </div>
      )}
    </div>
  );
}
