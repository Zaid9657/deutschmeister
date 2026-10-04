import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import GameButton from './GameButton.jsx';
import ItemRun from './ItemRun.jsx';
import RuleCardView from './RuleCardView.jsx';
import StoryCliffhanger from './StoryCliffhanger.jsx';
import { canDoTexts } from './content.js';
import { useV2Strings } from './strings.js';
import { proofParts } from '../../lib/course-v2/proofs.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const PANEL = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-5';

/**
 * The Lektions-Check (SCHEMA §8 Check, BLUEPRINT §3.1 LS7 / §3.2 LS8):
 *
 *   1. the 12 deterministic items — this unit's `check.items` plus `earlierItems`, the
 *      runtime draw from earlier units' reserves (`check.earlierDraw` / the compiled
 *      `check.earlier` refs are resolved by the player core and passed in; without them
 *      the check runs on this unit's items alone);
 *   2. the proof items, scored apart from the 12 (one per receptive can-do);
 *   3. „Das kann ich": each can-do with its proofs — an item answered right, the
 *      speaking/writing Aufgabe submitted (`aufgaben`, from the player's learner state), and/or the
 *      learner's own micro-output sent (`microOutputs`). An entry may name several (an item and
 *      an Aufgabe: the receptive and the productive side); each is listed with its own status and
 *      the can-do is ticked when every one is shown (SCHEMA §8, src/lib/course-v2/proofs.js);
 *   4. the B-skeleton Grammatik-Rückschau (rule cards) and Porträt, the cliffhanger and the
 *      step's end line.
 *
 * No AI anywhere; below 60 % the screen SUGGESTS repeating a Lernschritt and never blocks
 * (BLUEPRINT §3.5: no gate reads a score). `onDone({ stepId, correct, total, proofs, proofItems })`
 * counts the 12 only; `proofs` = { canDoId: proven } as „Das kann ich" showed it, `proofItems` =
 * { proofItemId: answeredRight } — the item evidence the player's recap re-reads with proofShown
 * once an Aufgabe is submitted after the Check (both additive).
 * `attempt` (the Check's plan.attempt) seeds the option order of its choice items (ItemView).
 * `onProgress(fraction)` (optional) — the items, then the proof items, then the summary (1).
 */
export default function CheckView({ unit, level, stepId, endLine = null, earlierItems = [], attempt = 1, aufgaben = null, microOutputs = null, course = null, canDos = null, ruleCards = null, lines, names, onAttempt, onDone, onProgress = null }) {
  const [lang, t] = useV2Strings();
  const check = unit?.check || {};
  const items = useMemo(() => [...(check.items || []), ...(earlierItems || [])], [check.items, earlierItems]);
  const proofItems = check.proofItems || [];
  const [phase, setPhase] = useState(items.length ? 'items' : proofItems.length ? 'proofs' : 'summary');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [proofResults, setProofResults] = useState({});
  const progressSink = useRef(onProgress);
  progressSink.current = onProgress;
  const itemsShare = proofItems.length ? 0.8 : 0.95;
  const report = (f) => { if (typeof progressSink.current === 'function') progressSink.current(f); };
  useEffect(() => {
    if (phase === 'summary' && typeof progressSink.current === 'function') progressSink.current(1);
  }, [phase]);
  const texts = useMemo(() => canDoTexts(unit, course, canDos), [unit, course, canDos]);
  const cardsById = useMemo(() => {
    const m = new Map();
    for (const c of Array.isArray(ruleCards) ? ruleCards : Object.values(ruleCards || {})) if (c && c.id) m.set(c.id, c);
    return m;
  }, [ruleCards]);

  const onProofAttempt = (p) => {
    setProofResults((prev) => ({ ...prev, [p.itemId]: p.correct }));
    if (typeof onAttempt === 'function') onAttempt(p);
  };

  // every proof the entry names, each with its own line: an item answered right, the Aufgabe
  // submitted, the learner's own micro-output sent (SCHEMA §8 Check.proofs, 2026-09-28)
  const proofStatus = (proof) => {
    const parts = proofParts(proof, { items: proofResults, aufgaben, microOutputs });
    if (!parts.length) return { ok: false, labels: [t('check.proofOpen')] };
    const several = parts.length > 1;
    const labels = parts.map((part) => {
      if (part.kind === 'item') return part.ok ? t('check.proofItem') : t(several ? 'check.itemOpen' : 'check.proofOpen');
      if (part.kind === 'aufgabe') {
        const task = t(part.ref === 'sprechen' ? 'check.aufgabeSprechen' : 'check.aufgabeSchreiben');
        return part.ok ? t('check.proofAufgabe', { task }) : t('check.aufgabeOpen', { task });
      }
      return part.ok ? t('check.proofMicro') : t('check.microOpen');
    });
    return { ok: parts.every((part) => part.ok), labels };
  };

  if (phase === 'items') {
    return (
      <div>
        {/* The count the learner will actually answer: 12 once the earlier-unit draw is filled,
            fewer while earlier units have no reserve (the plan's `earlierMissing`). */}
        <p className="mb-4 text-[1rem] font-semibold text-game-muted">{t('check.lead', { n: items.length })}</p>
        <ItemRun
          key="check-items"
          items={items}
          unitId={unit?.id}
          lines={lines}
          names={names}
          stepId={stepId}
          level={level}
          attempt={attempt}
          onProgress={(f) => report(f * itemsShare)}
          onAttempt={onAttempt}
          onFinish={(r) => { setScore(r); setPhase(proofItems.length ? 'proofs' : 'summary'); }}
        />
      </div>
    );
  }

  if (phase === 'proofs') {
    return (
      <div>
        <p className={`mb-4 ${LABEL}`}>{t('check.proofs')}</p>
        <ItemRun
          key="check-proofs"
          items={proofItems}
          unitId={unit?.id}
          lines={lines}
          names={names}
          stepId={stepId}
          level={level}
          attempt={attempt}
          onProgress={(f) => report(itemsShare + f * (0.95 - itemsShare))}
          onAttempt={onProofAttempt}
          onFinish={() => setPhase('summary')}
        />
      </div>
    );
  }

  const pct = score.total ? score.correct / score.total : null;
  const rueckschau = (check.rueckschau || []).map((id) => cardsById.get(id)).filter(Boolean);
  // { canDoId: proven } — reported with onDone so the player's recap ticks exactly what
  // „Das kann ich" ticked here, and the closing line („Sie können jetzt …") is said only
  // when every can-do of the unit is proven.
  const proofs = Object.fromEntries((check.proofs || []).map((p) => [p.canDo, proofStatus(p).ok]));
  const allProven = Object.values(proofs).every(Boolean);

  return (
    <div className="space-y-4">
      {score.total > 0 && (
        <div className="rounded-[1.25rem] border-2 border-b-4 border-course bg-course-wash p-5 text-course-ink">
          <p className="text-[1.5rem] font-extrabold">{t('check.result', { c: score.correct, t: score.total })}</p>
          {pct != null && pct < 0.6 && <p className="mt-2 text-[1rem] font-semibold">{t('check.repeatSuggest')}</p>}
        </div>
      )}

      {Array.isArray(check.proofs) && check.proofs.length > 0 && (
        <div className={PANEL}>
          <p className={LABEL}>{t('check.canDo')}</p>
          <ul className="mt-3 space-y-3">
            {check.proofs.map((p) => {
              const st = proofStatus(p);
              return (
                <li key={p.canDo} className="flex items-start gap-2.5 text-[1rem]">
                  {st.ok
                    ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-game-right" aria-hidden="true" />
                    : <Circle className="mt-0.5 h-6 w-6 shrink-0 text-game-locked-icon" aria-hidden="true" />}
                  <span>
                    <span className="font-bold text-game-text" lang="de">{texts[p.canDo] || p.canDo}</span>
                    {st.labels.map((label, k) => <span key={k} className="block text-[0.875rem] font-semibold text-game-muted">{label}</span>)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rueckschau.length > 0 && (
        <div className="space-y-3">
          <p className={LABEL}>{t('check.rueckschau')}</p>
          {rueckschau.map((c) => <RuleCardView key={c.id} card={c} compact />)}
        </div>
      )}

      {check.portrait && (
        <div className={PANEL}>
          <p className={LABEL}>{t('check.portrait')}</p>
          <p className="mt-2 text-[1.0625rem] font-semibold leading-relaxed text-game-text" lang="de">{check.portrait.de}</p>
          {check.portrait.en && lang !== 'de' && <p className="mt-2 text-[0.875rem] leading-relaxed text-game-muted">{check.portrait.en}</p>}
        </div>
      )}

      {unit?.story?.cliffhanger && (
        <div className="rounded-[1.25rem] border-2 border-game-line bg-course-wash p-5">
          <p className={LABEL}>{t('check.story')}</p>
          <StoryCliffhanger story={unit.story} idPrefix={`${stepId}-story`} className="mt-2 text-[1.125rem] font-bold leading-snug text-game-text" />
        </div>
      )}

      {endLine && allProven && <p className="text-[1.125rem] font-extrabold text-course-ink" lang="de">{endLine}</p>}

      <div className="pt-2">
        <GameButton onClick={() => onDone && onDone({ stepId, correct: score.correct, total: score.total, proofs, proofItems: { ...proofResults } })}>
          {t('check.done')}
        </GameButton>
      </div>
    </div>
  );
}
