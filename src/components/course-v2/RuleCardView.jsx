import { useEffect, useMemo, useRef, useState } from 'react';
import { Puzzle } from 'lucide-react';
import Chip from '../ui/Chip.jsx';
import GameButton from './GameButton.jsx';
import { StickyAction } from './GameParts.jsx';
import InlineFeedback from './InlineFeedback.jsx';
import StepScreen from './StepScreen.jsx';
import { SayButton } from './WordList.jsx';
import { gradeAnswer, RESULT } from './grade.js';
import { emphasize, ruleScreens } from './steps.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';

/**
 * A cell of a paradigm table. A token the card names in `caseMarks` is drawn as a kasus
 * chip — the ONLY place the four case colours appear in the player (design-tokens rule 1:
 * colour means grammatical case, and only where a case is named; the chip also carries
 * the case abbreviation, so it is never colour alone).
 */
function Cell({ text, caseMarks }) {
  const mark = (caseMarks || []).find((m) => m.token === text);
  if (mark) return <Chip tone={mark.kasus} size="md">{text}</Chip>;
  return <span>{text}</span>;
}

/**
 * The rule card of a Lernschritt (SCHEMA §7) as the book's GRAMMATIK box (owner feedback
 * 2026-09-29: "in a lesson there's no German grammar visible"): a panel every Lehrwerk has — a
 * header band „Grammatik" (with the grammar point's name when the caller knows it), the model
 * sentence, the rule in German (≤ 60/80 words) with its English twin, and the paradigm table on
 * white. The wash is the course palette's (`bg-course-wash`), never a kasus hue: colour means
 * case, and the case colours stay for the table tokens the card itself names in `caseMarks`.
 * Reference material: flat, no raised edge, nothing to press.
 *
 *   title      the grammar point („Präsens"), from the unit's outline — optional
 *   headingAs  the element of the band's label ('p' in a step, 'h3' in a reference list)
 */
export default function RuleCardView({ card, modelSentence = null, compact = false, title = null, headingAs = 'p' }) {
  const [lang, t] = useV2Strings();
  const model = modelSentence || card?.modelSentence || null;
  if (!card && !model) return null;
  const Heading = headingAs === 'h2' || headingAs === 'h3' ? headingAs : 'p';
  return (
    <section className="overflow-hidden rounded-[1.25rem] border-2 border-course-soft bg-course-wash" data-rule-card={card?.id || undefined}>
      <div className="flex items-center gap-2.5 border-b-2 border-course-soft bg-course-soft px-4 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-course-ink" aria-hidden="true">
          <Puzzle className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.4} />
        </span>
        <Heading className="min-w-0 text-[0.9375rem] font-extrabold leading-tight text-course-ink">
          <span className="uppercase tracking-[0.08em]">{t('rule.title')}</span>
          {title && <span className="font-extrabold normal-case tracking-normal" lang="de"> · {title}</span>}
        </Heading>
      </div>
      <div className="p-3 sm:p-5">
        {model && (
          <div className="rounded-xl border-l-4 border-course bg-white px-3.5 py-2.5">
            <p className={LABEL}>{t('rule.model')}</p>
            <p className="mt-0.5 text-[1.25rem] font-extrabold leading-snug text-game-text" lang="de">{model}</p>
          </div>
        )}
        {card?.de && <p className="mt-3 text-[1rem] font-semibold leading-relaxed text-game-text" lang="de">{card.de}</p>}
        {card?.en && lang !== 'de' && !compact && <p className="mt-2 text-[0.875rem] leading-relaxed text-game-muted">{card.en}</p>}
        {Array.isArray(card?.table) && card.table.length > 0 && <RuleTable card={card} />}
      </div>
    </section>
  );
}

/** A rule card's paradigm table on white (a wide one scrolls inside its own box, never the page). */
function RuleTable({ card, big = false }) {
  return (
    <div className={`overflow-x-auto bg-white ${big ? 'rounded-[1.25rem] border-2 border-b-4 border-game-line p-1.5' : '-mx-2 mt-4 rounded-xl sm:mx-0'}`}>
      <table className={`w-full border-collapse text-left ${big ? 'text-[1rem]' : 'text-[0.875rem] sm:text-[0.9375rem]'}`} lang="de">
        <tbody>
          {card.table.map((row, r) => (
            <tr key={r} className="border-t-2 border-game-line first:border-t-0">
              {row.map((cell, c) => (
                <td key={c} className={`align-top font-semibold text-game-text ${big ? 'px-2.5 py-2.5' : 'px-2 py-1.5 sm:px-3 sm:py-2'}`}>
                  <Cell text={cell} caseMarks={card.caseMarks} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The rule card of a Lernschritt as two or three small screens (owner feedback 2026-09-30: the whole
 * card on one screen was "too much") — steps.js ruleScreens:
 *   „Grammatik-Tipp"   the model sentence big, the form it teaches marked in the course ink with an
 *                      underline (steps.js emphasize — never a kasus hue: colour means case), its
 *                      voice on a speaker key, then the rule in German (+ English in English chrome);
 *   „Auf einen Blick"  the paradigm table on its own screen — the kasus chips exactly where the
 *                      card's `caseMarks` name a case, as in the panel;
 * or both on one screen when the card is small. One „Weiter" per screen in the bottom bar;
 * `onProgress(i / screens)` feeds the step's bar, `onDone()` once. The panel (RuleCardView) stays
 * for the reference pages, the Kapitel page, the Rückschau and the stuck-point repair.
 */
export function RuleCardSteps({ card, modelSentence = null, title = null, missing = false, unitId = null, onDone, onProgress = null }) {
  const [lang, t] = useV2Strings();
  const model = modelSentence || (card && card.modelSentence) || null;
  const screens = useMemo(() => {
    const s = ruleScreens(card, model);
    return s.length ? s : ['tip'];
  }, [card, model]);
  const [at, setAt] = useState(0);
  const finished = useRef(false);
  const sink = useRef(onProgress);
  sink.current = onProgress;
  useEffect(() => {
    if (typeof sink.current === 'function') sink.current(Math.min(1, at / screens.length));
  }, [at, screens.length]);
  const next = () => {
    if (at + 1 < screens.length) { setAt(at + 1); return; }
    if (finished.current) return;
    finished.current = true;
    if (typeof onDone === 'function') onDone();
  };
  const kind = screens[at];
  const hasTable = Array.isArray(card && card.table) && card.table.length > 0;
  const name = title ? (
    <p className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-course-wash px-2.5 py-1 text-[0.875rem] font-extrabold text-course-ink" lang="de">
      <Puzzle className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" /> {title}
    </p>
  ) : null;
  const tip = (
    <>
      {model && (
        <div className="flex items-start gap-3 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4">
          <SayButton unitId={unitId} id={`${(card && card.id) || 'rule'}-model`} text={model} label={t('card.hearModel')} />
          <p className="min-w-0 pt-1 text-[1.375rem] font-extrabold leading-snug text-game-text [hyphens:auto]" lang="de">
            {emphasize(model, card).map((s, i) => (s.strong
              ? <strong key={i} className="font-extrabold text-course-ink underline decoration-course decoration-[3px] underline-offset-[5px]">{s.text}</strong>
              : <span key={i}>{s.text}</span>))}
          </p>
        </div>
      )}
      {card && card.de && <p className="mt-5 text-[1.0625rem] font-semibold leading-relaxed text-game-text" lang="de">{card.de}</p>}
      {card && card.en && lang !== 'de' && <p className="mt-3 text-[0.9375rem] leading-relaxed text-game-muted" lang="en">{card.en}</p>}
      {missing && <p className="mt-3 text-[0.875rem] text-game-muted">{t('rule.missing')}</p>}
    </>
  );
  return (
    <StepScreen title={kind === 'table' ? t('card.table') : t('card.tip')} action={<GameButton onClick={next}>{t('item.next')}</GameButton>}>
      <section key={kind} className="motion-safe:animate-pop-in" data-rule-card={(card && card.id) || undefined} data-rule-screen={kind}>
        {name}
        {kind !== 'table' && tip}
        {kind !== 'tip' && hasTable && (kind === 'all' ? <div className="mt-5"><RuleTable card={card} big /></div> : <RuleTable card={card} big />)}
      </section>
    </StepScreen>
  );
}

/**
 * The B-skeleton rule table (SpracheStep.ruleTable, BLUEPRINT §3.2 LS3): the learner fills
 * the blank cells from Texts A/B, then sees the card. Each blank is checked with the same
 * grader as every item (the cell text is the answer). `onDone({ correct, total })` once.
 * With `onNext` (a Lernschritt screen) „Prüfen", then „Weiter", sit in the bottom bar and the
 * lead line is left to the screen's heading.
 */
export function RuleTableFill({ table, stepId, onDone, onAttempt, onNext = null }) {
  const [, t] = useV2Strings();
  const rows = Array.isArray(table?.rows) ? table.rows : [];
  const blanks = Array.isArray(table?.blanks) ? table.blanks : [];
  const isBlank = (r, c) => blanks.some(([br, bc]) => br === r && bc === c);
  const [values, setValues] = useState({});
  const [results, setResults] = useState(null);

  const check = () => {
    const out = {};
    let correct = 0;
    for (const [r, c] of blanks) {
      const expected = rows[r]?.[c] ?? '';
      const item = { id: `${stepId}-table-${r}-${c}`, type: 'fill_blank', topic: 'table', answer: expected, accepted: [expected] };
      const res = gradeAnswer(item, values[`${r}-${c}`] || '');
      const ok = res.result !== RESULT.WRONG;
      out[`${r}-${c}`] = ok;
      if (ok) correct += 1;
      if (typeof onAttempt === 'function') {
        onAttempt({ itemId: item.id, stepId, correct: ok, answer: values[`${r}-${c}`] || '', errorTag: ok ? null : 'table', typo: res.result === RESULT.TYPO });
      }
    }
    setResults(out);
    if (typeof onDone === 'function') onDone({ correct, total: blanks.length });
  };

  const allFilled = blanks.every(([r, c]) => String(values[`${r}-${c}`] || '').trim());

  const stepped = typeof onNext === 'function';
  return (
    <div className={stepped ? 'pb-32 sm:pb-0' : ''}>
      {!stepped && <p className="text-[1rem] font-semibold text-game-muted">{t('rule.fillTable')}</p>}
      {/* a wide B-level table scrolls inside its own box, never the page */}
      <div className={`-mx-1 overflow-x-auto px-1 ${stepped ? '' : 'mt-3'}`}>
        <table className="w-full border-collapse text-left text-[0.9375rem]" lang="de">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t-2 border-game-line first:border-t-0">
                {row.map((cell, c) => (
                  <td key={c} className="py-2 pr-3 align-top">
                    {isBlank(r, c) ? (
                      <span className="flex items-center gap-2">
                        <input
                          type="text"
                          aria-label={`${r + 1}/${c + 1}`}
                          value={values[`${r}-${c}`] || ''}
                          disabled={!!results}
                          autoComplete="off"
                          spellCheck={false}
                          onChange={(e) => setValues((v) => ({ ...v, [`${r}-${c}`]: e.target.value }))}
                          className="w-full min-w-[5rem] rounded-xl border-2 border-game-line bg-white px-3 py-2 text-[1rem] font-bold text-game-text outline-none focus:border-course disabled:bg-course-ground"
                        />
                        {results && (results[`${r}-${c}`]
                          ? <span className="font-extrabold text-game-right-ink" aria-label={t('item.srRight')}>✓</span>
                          : <span className="font-bold text-game-wrong-ink" aria-label={t('item.srWrong')}>✗ <strong>{cell}</strong></span>)}
                      </span>
                    ) : (
                      <span className="font-semibold text-game-text">{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!results && !stepped && (
        <div className="mt-4 flex justify-end">
          <GameButton size="md" onClick={check} disabled={!allFilled}>{t('item.check')}</GameButton>
        </div>
      )}
      {results && (
        <InlineFeedback
          result={Object.values(results).every(Boolean) ? RESULT.CORRECT : RESULT.WRONG}
          message={`${Object.values(results).filter(Boolean).length}/${blanks.length}`}
        />
      )}
      {stepped && (
        <StickyAction>
          {results
            ? <GameButton onClick={onNext}>{t('item.next')}</GameButton>
            : <GameButton onClick={check} disabled={!allFilled}>{t('item.check')}</GameButton>}
        </StickyAction>
      )}
    </div>
  );
}
