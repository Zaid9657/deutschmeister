import { useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import ItemView from './ItemView.jsx';
import RuleCardView from './RuleCardView.jsx';
import { useV2Strings } from './strings.js';

export const REQUEUE_CAP = 4;

/**
 * A run of items, one per screen (BLUEPRINT §7.1, §3.3 segment 4).
 *
 * - The eyebrow counts FIRST presentations only; a re-asked miss shows „+1 Wiederholung".
 * - A miss returns once as a DIFFERENT item of the same topic, drawn from `requeuePool`
 *   (the pool's unserved items), never more than REQUEUE_CAP per run; only when no
 *   alternate exists is the same item asked again (the legacy requeue.js rule).
 * - Stuck-point repair: after 2 misses of the same item class (topic × type) the rule
 *   card is shown once, after „Weiter" — never a third failure in a row without help.
 *
 * `onFinish({ correct, total })` — first-presentation results only (a requeue never
 * improves the score it repeats). `onAttempt(payload)` for every answer. `attempt` (the
 * step's, default 1) seeds the option order of non-exam choice items (ItemView).
 */
export default function ItemRun({ items, requeuePool = [], requeue = false, unitId, lines, stepId, level, ruleCard = null, names = null, attempt = 1, onAttempt, onFinish }) {
  const [, t] = useV2Strings();
  const [queue, setQueue] = useState(() => (items || []).map((item) => ({ item, requeued: false })));
  const [pos, setPos] = useState(0);
  const [repair, setRepair] = useState(false);
  const stats = useRef({ correct: 0, total: 0, requeued: 0 });
  const used = useRef(new Set((items || []).map((i) => i.id)));
  const misses = useRef(new Map());
  const repaired = useRef(new Set());
  const finished = useRef(false);
  const pendingRepair = useRef(false);

  const firstTotal = (items || []).length;
  const entry = queue[pos] || null;

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
    return (
      <div>
        <p className="mb-3 text-[0.9375rem] font-bold text-ink">{t('rule.repairLead')}</p>
        <RuleCardView card={ruleCard} />
        <div className="mt-6 flex justify-end">
          <Button onClick={closeRepair} size="lg" className="w-full sm:w-auto">{t('item.next')}</Button>
        </div>
      </div>
    );
  }

  if (!entry) {
    // Nothing (left) to answer: one button that reports the run.
    return (
      <div className="flex justify-end">
        <Button onClick={finish} size="lg">{t('item.next')}</Button>
      </div>
    );
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
      attempt={attempt}
      onResult={onResult}
      onNext={next}
    />
  );
}
