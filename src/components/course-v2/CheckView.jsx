import { useMemo, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ItemRun from './ItemRun.jsx';
import RuleCardView from './RuleCardView.jsx';
import { canDoTexts } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/**
 * The Lektions-Check (SCHEMA §8 Check, BLUEPRINT §3.1 LS7 / §3.2 LS8):
 *
 *   1. the 12 deterministic items — this unit's `check.items` plus `earlierItems`, the
 *      runtime draw from earlier units' reserves (`check.earlierDraw` / the compiled
 *      `check.earlier` refs are resolved by the player core and passed in; without them
 *      the check runs on this unit's items alone);
 *   2. the proof items, scored apart from the 12 (one per receptive can-do);
 *   3. „Das kann ich": each can-do with its proof — an item answered right, or the
 *      speaking/writing Aufgabe submitted (`aufgaben`, from the player's learner state);
 *   4. the B-skeleton Grammatik-Rückschau (rule cards) and Porträt, the cliffhanger and the
 *      step's end line.
 *
 * No AI anywhere; below 60 % the screen SUGGESTS repeating a Lernschritt and never blocks
 * (BLUEPRINT §3.5: no gate reads a score). `onDone({ stepId, correct, total })` counts the
 * 12 only.
 */
export default function CheckView({ unit, level, stepId, endLine = null, earlierItems = [], aufgaben = null, course = null, canDos = null, ruleCards = null, lines, names, onAttempt, onDone }) {
  const [lang, t] = useV2Strings();
  const check = unit?.check || {};
  const items = useMemo(() => [...(check.items || []), ...(earlierItems || [])], [check.items, earlierItems]);
  const proofItems = check.proofItems || [];
  const [phase, setPhase] = useState(items.length ? 'items' : proofItems.length ? 'proofs' : 'summary');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [proofResults, setProofResults] = useState({});
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

  const proofStatus = (proof) => {
    if (proof.item) {
      if (!(proof.item in proofResults)) return { ok: false, label: t('check.proofOpen') };
      return proofResults[proof.item] ? { ok: true, label: t('check.proofItem') } : { ok: false, label: t('check.proofOpen') };
    }
    if (proof.aufgabe) {
      const task = t(proof.aufgabe === 'sprechen' ? 'check.aufgabeSprechen' : 'check.aufgabeSchreiben');
      const done = !!(aufgaben && aufgaben[proof.aufgabe]);
      return done ? { ok: true, label: t('check.proofAufgabe', { task }) } : { ok: false, label: t('check.aufgabeOpen', { task }) };
    }
    return { ok: false, label: t('check.proofOpen') };
  };

  if (phase === 'items') {
    return (
      <div>
        {/* The count the learner will actually answer: 12 once the earlier-unit draw is filled,
            fewer while earlier units have no reserve (the plan's `earlierMissing`). */}
        <p className="mb-4 text-[0.9375rem] text-graphite">{t('check.lead', { n: items.length })}</p>
        <ItemRun
          key="check-items"
          items={items}
          unitId={unit?.id}
          lines={lines}
          names={names}
          stepId={stepId}
          level={level}
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
          onAttempt={onProofAttempt}
          onFinish={() => setPhase('summary')}
        />
      </div>
    );
  }

  const pct = score.total ? score.correct / score.total : null;
  const rueckschau = (check.rueckschau || []).map((id) => cardsById.get(id)).filter(Boolean);

  return (
    <div className="space-y-4">
      {score.total > 0 && (
        <Card tone="wash" className="p-5">
          <p className="font-display text-[1.5rem] font-semibold text-ink">{t('check.result', { c: score.correct, t: score.total })}</p>
          {pct != null && pct < 0.6 && <p className="mt-2 text-[0.9375rem] text-ink">{t('check.repeatSuggest')}</p>}
        </Card>
      )}

      {Array.isArray(check.proofs) && check.proofs.length > 0 && (
        <Card className="p-5">
          <p className={LABEL}>{t('check.canDo')}</p>
          <ul className="mt-3 space-y-2.5">
            {check.proofs.map((p) => {
              const st = proofStatus(p);
              return (
                <li key={p.canDo} className="flex items-start gap-2.5 text-[0.9375rem]">
                  {st.ok
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-limette-ink" aria-hidden="true" />
                    : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-graphite" aria-hidden="true" />}
                  <span>
                    <span className="text-ink" lang="de">{texts[p.canDo] || p.canDo}</span>
                    <span className="block text-[0.8125rem] text-graphite">{st.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {rueckschau.length > 0 && (
        <div className="space-y-3">
          <p className={LABEL}>{t('check.rueckschau')}</p>
          {rueckschau.map((c) => <RuleCardView key={c.id} card={c} compact />)}
        </div>
      )}

      {check.portrait && (
        <Card className="p-5">
          <p className={LABEL}>{t('check.portrait')}</p>
          <p className="mt-2 text-[1rem] leading-relaxed text-ink" lang="de">{check.portrait.de}</p>
          {check.portrait.en && lang !== 'de' && <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">{check.portrait.en}</p>}
        </Card>
      )}

      {unit?.story?.cliffhanger && (
        <Card tone="sunk" className="p-5">
          <p className={LABEL}>{t('check.story')}</p>
          <p className="mt-2 font-display text-[1.125rem] leading-snug text-ink" lang="de">{unit.story.cliffhanger}</p>
        </Card>
      )}

      {endLine && <p className="text-[1rem] font-bold text-ink" lang="de">{endLine}</p>}

      <div className="flex justify-end">
        <Button onClick={() => onDone && onDone({ stepId, correct: score.correct, total: score.total })} size="lg" className="w-full sm:w-auto">
          {t('check.done')}
        </Button>
      </div>
    </div>
  );
}
