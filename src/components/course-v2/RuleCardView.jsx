import { useState } from 'react';
import { Puzzle } from 'lucide-react';
import Chip from '../ui/Chip.jsx';
import GameButton from './GameButton.jsx';
import InlineFeedback from './InlineFeedback.jsx';
import { gradeAnswer, RESULT } from './grade.js';
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
        {Array.isArray(card?.table) && card.table.length > 0 && (
          <div className="-mx-2 mt-4 overflow-x-auto rounded-xl bg-white sm:mx-0">
            <table className="w-full border-collapse text-left text-[0.875rem] sm:text-[0.9375rem]" lang="de">
              <tbody>
                {card.table.map((row, r) => (
                  <tr key={r} className="border-t-2 border-game-line first:border-t-0">
                    {row.map((cell, c) => (
                      <td key={c} className="px-2 py-1.5 align-top font-semibold text-game-text sm:px-3 sm:py-2">
                        <Cell text={cell} caseMarks={card.caseMarks} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The B-skeleton rule table (SpracheStep.ruleTable, BLUEPRINT §3.2 LS3): the learner fills
 * the blank cells from Texts A/B, then sees the card. Each blank is checked with the same
 * grader as every item (the cell text is the answer). `onDone({ correct, total })` once.
 */
export function RuleTableFill({ table, stepId, onDone, onAttempt }) {
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

  return (
    <div>
      <p className="text-[1rem] font-semibold text-game-muted">{t('rule.fillTable')}</p>
      {/* a wide B-level table scrolls inside its own box, never the page */}
      <div className="-mx-1 mt-3 overflow-x-auto px-1">
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
      {!results && (
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
    </div>
  );
}
