import { useMemo, useRef, useState } from 'react';
import GameButton from './GameButton.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import AudioButton from './AudioButton.jsx';
import ItemView from './ItemView.jsx';
import { laneLabel, playsFor, resolveText, speakerName, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/** An exam text with its `⟦NN⟧` gap markers drawn as numbered gaps. */
function GapText({ text }) {
  const parts = String(text || '').split(/⟦(\d{2})⟧/);
  return parts.map((p, i) => (i % 2 === 1
    ? <span key={i} className="mx-0.5 inline-flex min-w-[2.5rem] justify-center rounded border border-ink px-1 font-data text-[0.8125rem] font-bold text-ink">{Number(p)}</span>
    : <span key={i}>{p}</span>));
}

/** A written exam text (text, ad, sign, form, document): flat reference styling. */
function ReadingText({ text, keyLabel = null }) {
  return (
    <div className="rounded-clay border border-rule bg-white p-4" lang="de">
      <div className="flex items-baseline gap-2">
        {keyLabel && <span className="font-data text-[0.8125rem] font-bold uppercase text-graphite">{keyLabel}</span>}
        {text.title && <p className="font-bold text-ink">{text.title}</p>}
      </div>
      {text.text && <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink"><GapText text={text.text} /></p>}
    </div>
  );
}

/**
 * One listening text: play control with the lane's play count, and the transcript only
 * after the items that depend on it are answered (BLUEPRINT §7.3 S4: „transcript after
 * submission"). After that the replay is free — the counted plays are the exam's, the
 * learning afterwards is not.
 */
function ListeningText({ text, unitId, plays, answered, names }) {
  const [, t] = useV2Strings();
  const [used, setUsed] = useState(0);
  const lines = text.lines || [];
  const left = plays == null || answered ? null : Math.max(0, plays - used);
  return (
    <div className="rounded-clay border border-rule bg-white p-4">
      {text.title && <p className="font-bold text-ink" lang="de">{text.title}</p>}
      <div className="mt-2">
        <AudioButton unitId={unitId} lines={lines} playsLeft={left} onPlayed={() => setUsed((n) => n + 1)} />
      </div>
      {plays != null && !answered && <p className="mt-2 text-[0.8125rem] text-graphite">{t('audio.playsRule', { n: plays })}</p>}
      {answered ? (
        <div className="mt-3 border-t border-rule pt-3">
          <p className={LABEL}>{t('exam.transcript')}</p>
          <ul className="mt-1 space-y-1">
            {lines.map((l) => (
              <li key={l.id} className="text-[0.9375rem] leading-relaxed text-ink" lang="de">
                <span className="font-data text-[0.75rem] text-graphite">{speakerName(l.speaker, names)}: </span>{l.de}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[0.8125rem] text-graphite">{t('exam.transcriptAfter')}</p>
      )}
    </div>
  );
}

/**
 * An exam block in Lernmodus (SCHEMA §8 ExamBlock; BLUEPRINT §3.6, §7.3 S4): the Teil's
 * label and lane, our paraphrased instruction, the strategy card, the texts, and every item
 * of the block on one screen with feedback after each answer. Listening texts keep the
 * lane's play count (ga2.h1: 2×, ga2.h2: 1× …). A text that belongs to exactly one item
 * sits right above that item; shared texts (one long Hören text, a reading text with gaps,
 * a set of ads) sit at the top.
 *
 * `onDone({ blockId, correct, total })` once every item is answered.
 * `onAttempt(payload)` per item (the ItemView contract payload).
 */
export default function ExamBlockView({ block, unitId, stepId, level, texts = null, strategy = null, lines = null, names = null, onAttempt, onDone }) {
  const [lang, t] = useV2Strings();
  const [answers, setAnswers] = useState({}); // itemId → correct
  const reported = useRef(false);
  const pool = useMemo(() => [...(block?.texts || []), ...(texts || [])], [block, texts]);
  const items = useMemo(() => block?.items || [], [block]);
  const plays = playsFor(block);

  // Which text is used by how many items → inline (1 item) or shared (top).
  const usage = useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const tx = it.textRef ? resolveText(it.textRef, pool) : null;
      if (tx) m.set(tx.id, [...(m.get(tx.id) || []), it.id]);
    }
    return m;
  }, [items, pool]);
  const choiceTextIds = new Set((block?.choices || []).map((c) => (c.textRef ? resolveText(c.textRef, pool)?.id : null)).filter(Boolean));
  const refTexts = (block?.textRefs || []).map((r) => resolveText(r, pool)).filter(Boolean);
  const usedTexts = [...usage.keys()].map((id) => pool.find((x) => x.id === id)).filter(Boolean);
  const sharedTexts = [...new Map([...refTexts, ...(block?.texts || []), ...usedTexts].map((x) => [x.id, x])).values()]
    .filter((x) => (usage.get(x.id) || []).length !== 1 || choiceTextIds.has(x.id));

  const answeredAll = (ids) => ids.length > 0 && ids.every((id) => id in answers);
  const total = items.length;
  const done = Object.keys(answers).length;
  const correct = Object.values(answers).filter(Boolean).length;

  const onItem = (payload) => {
    setAnswers((prev) => ({ ...prev, [payload.itemId]: payload.correct }));
    if (typeof onAttempt === 'function') onAttempt({ ...payload, stepId });
  };

  const finish = () => {
    if (reported.current) return;
    reported.current = true;
    if (typeof onDone === 'function') onDone({ blockId: block.id, correct, total });
  };

  if (!block) return null;

  const renderText = (x, key = null) => (x.kind === 'audio' || (x.lines && x.lines.length && !x.text)
    ? <ListeningText key={x.id} text={x} unitId={unitId} plays={plays} names={names} answered={answeredAll(usage.get(x.id) || items.map((i) => i.id))} />
    : <ReadingText key={x.id} text={x} keyLabel={key} />);

  const keyOfText = (id) => (block.choices || []).find((c) => c.textRef && resolveText(c.textRef, pool)?.id === id)?.key || null;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="label">{teilLabel(block.template)}</Chip>
        <Chip tone="quiet">{laneLabel(block.lane)}</Chip>
        <Chip tone="quiet">{t('exam.lern')}</Chip>
        {block.length && block.length !== 'full' && <Chip tone="quiet">{block.length === 'mini' ? 'Mini' : lang === 'de' ? 'verkürzt' : 'reduced'}</Chip>}
      </div>
      <p className="mt-3 text-[1rem] font-bold leading-relaxed text-ink" lang="de">{block.instructionsDe}</p>
      <p className="mt-1 text-[0.8125rem] text-graphite">{t('exam.lernLead')}</p>

      {strategy && (
        <Card tone="sunk" className="mt-4 p-4">
          <p className={LABEL}>{t('exam.strategy')}</p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink" lang="de">{strategy.de}</p>
          {strategy.en && lang !== 'de' && <p className="mt-1 text-[0.8125rem] leading-relaxed text-graphite">{strategy.en}</p>}
        </Card>
      )}

      {sharedTexts.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className={LABEL}>{t('exam.texts')}</p>
          {sharedTexts.map((x) => renderText(x, keyOfText(x.id)))}
        </div>
      )}

      {(block.choices || []).some((c) => c.de && !c.textRef) && (
        <div className="mt-4">
          <p className={LABEL}>{t('exam.choices')}</p>
          <ul className="mt-2 space-y-1.5">
            {block.choices.filter((c) => c.de).map((c) => (
              <li key={c.key} className="flex gap-2 rounded-clay border border-rule bg-white px-3 py-2 text-[0.9375rem] text-ink" lang="de">
                <span className="font-data font-bold uppercase text-graphite">{c.key}</span> {c.de}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <p className={LABEL}>{t('exam.items')}</p>
        <ol className="mt-1 divide-y divide-rule">
          {items.map((it) => {
            const tx = it.textRef ? resolveText(it.textRef, pool) : null;
            const inline = tx && (usage.get(tx.id) || []).length === 1 && !choiceTextIds.has(tx.id);
            return (
              <li key={it.id}>
                {inline && <div className="pt-4">{renderText(tx)}</div>}
                <ItemView
                  item={it}
                  level={level}
                  stepId={stepId}
                  unitId={unitId}
                  lines={lines}
                  block={block}
                  texts={texts}
                  compact
                  onResult={onItem}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {done === total && total > 0 && (
        <Card tone="wash" className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-[1rem] font-bold text-ink">{t('exam.score', { c: correct, t: total })}</p>
          {typeof onDone === 'function' && !reported.current && (
            <GameButton onClick={finish} size="lg" className="w-full sm:w-auto">{t('item.next')}</GameButton>
          )}
        </Card>
      )}
    </section>
  );
}
