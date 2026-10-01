import { useEffect, useRef, useState } from 'react';
import GameButton from './GameButton.jsx';
import ItemView from './ItemView.jsx';
import RuleCardView from './RuleCardView.jsx';
import StepScreen from './StepScreen.jsx';
import { useV2Strings } from './strings.js';

export const REQUEUE_CAP = 4;

/**
 * A run of items, one per screen (BLUEPRINT §7.1, §3.3 segment 4).
 *
 * - The eyebrow counts FIRST presentations only; a re-asked miss shows „+1 Wiederholung".
 * - A miss returns once as a DIFFERENT item of the same topic, drawn from `requeuePool`
 *   (the pool's unserved items), never more than REQUEUE_CAP per run; only when no
 *   alternate exists is the same item asked again (the legacy requeue.js rule). The
 *   feedback sheet of that miss says so („Diese Aufgabe kommt gleich noch einmal.").
 * - Stuck-point repair: after 2 misses of the same item class (topic × type) the rule
 *   card is shown once, after „Weiter" — never a third failure in a row without help.
 *
 * `onFinish({ correct, total })` — first-presentation results only (a requeue never
 * improves the score it repeats). `onAttempt(payload)` for every answer. `attempt` (the
 * step's, default 1) seeds the option order of non-exam choice items (ItemView).
 * `onProgress(fraction)` (optional) — how far through the run the learner is, 0..1, for
 * the player's progress bar.
 */
export default function ItemRun({ items, requeuePool = [], requeue = false, unitId, lines, stepId, level, ruleCard = null, names = null, attempt = 1, onAttempt, onFinish, onProgress = null }) {
  const [, t] = useV2Strings();
  const [queue, setQueue] = useState(() => (items || []).map((item) => ({ item, requeued: false })));
  const [pos, setPos] = useState(0);
  const [repair, setRepair] = useState(false);
  const [repeatOf, setRepeatOf] = useState(null); // { pos, kind: 'same' | 'similar' } of the miss just requeued
  const stats = useRef({ correct: 0, total: 0, requeued: 0 });
  const used = useRef(new Set((items || []).map((i) => i.id)));
  const misses = useRef(new Map());
  const repaired = useRef(new Set());
  const finished = useRef(false);
  const pendingRepair = useRef(false);
  const progressSink = useRef(onProgress);
  progressSink.current = onProgress;

  const firstTotal = (items || []).length;
  const entry = queue[pos] || null;

  useEffect(() => {
    if (typeof progressSink.current === 'function') progressSink.current(queue.length ? Math.min(1, pos / queue.length) : 1);
  }, [pos, queue.length]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    if (typeof onFinish === 'function') onFinish({ correct: stats.current.correct, total: stats.current.total });
  };

  const onResult = (payload) => {
    if (typeof onAttempt === 'function') onAttempt(payload);
    if (!entry) return;
    if (!entry.requeued) {
      stats.current.total += 1;
      if (payload.correct) stats.current.correct += 1;
    }
    if (payload.correct) return;
    const klass = `${entry.item.topic}|${entry.item.type}`;
    const n = (misses.current.get(klass) || 0) + 1;
    misses.current.set(klass, n);
    if (n >= 2 && ruleCard && !repaired.current.has(klass)) {
      repaired.current.add(klass);
      pendingRepair.current = true; // shown after „Weiter", never over the feedback
    }
    if (!requeue || entry.requeued || stats.current.requeued >= REQUEUE_CAP) return;
    const alt = (requeuePool || []).find((it) => it.topic === entry.item.topic && it.type !== 'match' && !used.current.has(it.id));
    const again = alt || entry.item;
    used.current.add(again.id);
    stats.current.requeued += 1;
    setQueue((q) => [...q, { item: again, requeued: true }]);
    setRepeatOf({ pos, kind: alt ? 'similar' : 'same' });
  };

  const next = () => {
    setPos(pos + 1);
    if (pendingRepair.current) {
      pendingRepair.current = false;
      setRepair(true);
      return;
    }
    if (pos + 1 >= queue.length) finish();
  };

  const closeRepair = () => {
    setRepair(false);
    if (pos >= queue.length) finish();
  };

  if (repair) {
    // Its one action lives in the bottom bar like every other screen's (audit WT-03: in flow
    // it sat below the fold under a full rule card).
    return (
      <StepScreen title={t('rule.repairLead')} action={<GameButton onClick={closeRepair}>{t('item.next')}</GameButton>}>
        <RuleCardView card={ruleCard} />
      </StepScreen>
    );
  }

  if (!entry) {
    // Nothing (left) to answer: one button that reports the run.
    return <StepScreen action={<GameButton onClick={finish}>{t('item.next')}</GameButton>}>{null}</StepScreen>;
  }

  const firstIndex = entry.requeued ? null : queue.slice(0, pos).filter((e) => !e.requeued).length;

  return (
    <ItemView
      key={`${entry.item.id}-${pos}`}
      item={entry.item}
      level={level}
      stepId={stepId}
      unitId={unitId}
      lines={lines}
      names={names}
      index={firstIndex}
      total={firstTotal}
      requeued={entry.requeued}
      repeat={repeatOf && repeatOf.pos === pos ? repeatOf.kind : null}
      attempt={attempt}
      onResult={onResult}
      onNext={next}
    />
  );
}
