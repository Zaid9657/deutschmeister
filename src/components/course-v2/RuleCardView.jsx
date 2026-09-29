import { useState } from 'react';
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
 * The rule card of a Lernschritt (SCHEMA §7): model sentence, the rule in German (≤ 60/80
 * words) with its English twin, and the paradigm table. Reference material: flat, with
 * hairlines — never raised, never an interactive colour (BLUEPRINT §7.2).
 */
export default function RuleCardView({ card, modelSentence = null, compact = false }) {
  const [lang, t] = useV2Strings();
  const model = modelSentence || card?.modelSentence || null;
  if (!card && !model) return null;
  return (
    <section className="rounded-[1.25rem] border-2 border-game-line bg-white p-4 sm:p-5">
      <p className={LABEL}>{t('rule.title')}</p>
      {model && (
        <>
          <p className={`mt-3 ${LABEL}`}>{t('rule.model')}</p>
          <p className="mt-1 text-[1.3125rem] font-extrabold leading-snug text-game-text" lang="de">{model}</p>
        </>
      )}
      {card?.de && <p className="mt-3 text-[1rem] font-semibold leading-relaxed text-game-text" lang="de">{card.de}</p>}
      {card?.en && lang !== 'de' && !compact && <p className="mt-2 text-[0.875rem] leading-relaxed text-game-muted">{card.en}</p>}
      {Array.isArray(card?.table) && card.table.length > 0 && (
        <table className="mt-4 w-full border-collapse text-left text-[0.9375rem]" lang="de">
          <tbody>
            {card.table.map((row, r) => (
              <tr key={r} className="border-t-2 border-game-line first:border-t-0">
                {row.map((cell, c) => (
                  <td key={c} className="py-2 pr-4 align-top font-semibold text-game-text">
                    <Cell text={cell} caseMarks={card.caseMarks} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
      <table className="mt-3 w-full border-collapse text-left text-[0.9375rem]" lang="de">
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
