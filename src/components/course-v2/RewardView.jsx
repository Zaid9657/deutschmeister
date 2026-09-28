import { useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import InputView from './InputView.jsx';
import ItemRun from './ItemRun.jsx';
import MicroOutputView from './MicroOutputView.jsx';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

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
    <button
      type="button"
      onClick={() => typeof onDone === 'function' && onDone()}
      className="inline-flex min-h-11 items-center rounded-pill border border-rule bg-white px-4 py-2 text-[0.875rem] font-bold text-graphite hover:border-siegel hover:text-ink"
    >
      {t('as.rewardSkip')}
    </button>
  );

  if (!piece) {
    return <div className="flex justify-end">{skip}</div>;
  }

  const eyebrow = piece.label || (piece.id === 'scene' ? t('as.rewardScene') : t('as.rewardProjekt'));

  return (
    <div>
      <p className={LABEL}>{eyebrow}</p>
      <p className="mt-1 text-[0.8125rem] text-graphite">{t('as.rewardLead')}</p>

      {piece.projekt ? (
        <div className="mt-4">
          <Card tone="sunk" className="mb-4 p-4">
            <p className="text-[0.9375rem] leading-relaxed text-ink" lang="de">{piece.projekt.promptDe}</p>
          </Card>
          <MicroOutputView key={`${stepId}-projekt`} mo={piece.projekt.microOutput} level={level} onDone={nextPiece} />
        </div>
      ) : phase === 'read' ? (
        <div className="mt-4">
          <InputView input={piece.input} unitId={unitId} />
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-rule pt-4">
            {skip}
            <Button size="lg" className="w-full sm:w-auto" onClick={() => (piece.items.length ? setPhase('items') : nextPiece())}>
              {piece.items.length ? t('item.next') : t('as.rewardDone')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <details className="mb-5 rounded-clay border border-rule bg-white p-4">
            <summary className="cursor-pointer text-[0.875rem] font-bold text-graphite">{t('as.textAgain')}</summary>
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
