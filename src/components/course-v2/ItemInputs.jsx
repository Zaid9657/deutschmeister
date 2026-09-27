import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import ChoiceTile from '../ui/ChoiceTile.jsx';
import { useV2Strings } from './strings.js';

const LABEL = 'font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite';

/** A small deterministic hash → shuffle, so a re-render never reorders the screen. */
function seededOrder(n, seed) {
  let h = 2166136261;
  for (const ch of String(seed || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * The tile state of an option after the item is resolved: the learner's pick marked
 * right or wrong, the right answer marked as the solution. Before resolution: the pick
 * is `selected`.
 */
export function optionState(value, { picked, resolved, correctValue }) {
  if (!resolved) return picked === value ? 'selected' : 'idle';
  if (value === correctValue) return picked === value ? 'correct' : 'solution';
  if (picked === value) return 'wrong';
  return 'muted';
}

/** A vertical list of tap options (≤ 4 visible choices per item). */
export function ChoiceList({ options, picked, onPick, resolved, correctValue, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <ChoiceTile
          key={opt.value}
          keyLabel={opt.key || null}
          state={optionState(opt.value, { picked, resolved, correctValue })}
          disabled={disabled || resolved}
          onClick={() => onPick(opt.value)}
          lang="de"
        >
          {opt.label}
        </ChoiceTile>
      ))}
    </div>
  );
}

/** A native select for large block-level choice sets (12 ads, 15 words …). */
export function ChoiceSelect({ id, options, picked, onPick, resolved, disabled }) {
  const [, t] = useV2Strings();
  return (
    <select
      id={id}
      value={picked || ''}
      disabled={disabled || resolved}
      onChange={(e) => onPick(e.target.value || null)}
      className="w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk"
      lang="de"
    >
      <option value="">{t('item.choose')}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.key ? `${opt.key} – ${opt.label}` : opt.label}
        </option>
      ))}
    </select>
  );
}

/** A typed answer field: ≥ 16 px (no zoom on iOS), no autocorrect or spellcheck. */
export function TypedInput({ id, value, onChange, onSubmit, disabled, placeholder, multiline = false, inputRef }) {
  const [, t] = useV2Strings();
  const common = {
    id,
    value,
    disabled,
    autoComplete: 'off',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    onChange: (e) => onChange(e.target.value),
    className: 'mt-2 w-full rounded-clay border border-rule bg-white px-4 py-3 text-[1.0625rem] text-ink outline-none focus:border-siegel disabled:bg-paper-sunk',
    placeholder: placeholder || '…',
    lang: 'de',
  };
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{t('item.yourAnswer')}</label>
      {multiline ? (
        <textarea ref={inputRef} rows={2} {...common} />
      ) : (
        <input ref={inputRef} type="text" onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }} {...common} />
      )}
    </div>
  );
}

/**
 * Sentence building from tiles (the tiles ARE the cue, SCHEMA §3.1). The built sentence
 * is handed to the checker as one string; its first letter is capitalised so a tile
 * list written in lower case („der Zug") never turns a right order into a case slip.
 */
export function TilesInput({ itemId, tiles, onChange, disabled }) {
  const [, t] = useV2Strings();
  const [bank, setBank] = useState(() => tiles.map((tok, key) => ({ tok, key })));
  const [built, setBuilt] = useState([]);

  const emit = (next) => {
    const joined = next.map((e) => e.tok).join(' ');
    const sentence = joined ? joined.charAt(0).toUpperCase() + joined.slice(1) : '';
    onChange(next.length === tiles.length ? sentence : '');
  };
  // The parent is told in the event handler, never from inside a state updater
  // (an updater runs during render, and a parent setState there is a React warning).
  const add = (entry) => {
    if (disabled) return;
    const next = [...built, entry];
    setBank(bank.filter((e) => e.key !== entry.key));
    setBuilt(next);
    emit(next);
  };
  const remove = (entry) => {
    if (disabled) return;
    const next = built.filter((e) => e.key !== entry.key);
    setBuilt(next);
    setBank([...bank, entry]);
    emit(next);
  };

  const tileBase =
    'inline-flex min-h-11 items-center gap-1.5 rounded-clay border px-3.5 py-2 text-[0.9375rem] font-bold transition-all duration-100 ease-snap motion-reduce:transition-none disabled:opacity-70';

  return (
    <div data-item={itemId}>
      <p className="text-[0.9375rem] text-graphite">{t('tiles.instructions')}</p>
      <p className={`mt-4 ${LABEL}`}>{t('tiles.yourSentence')}</p>
      <div className="mt-2 flex min-h-[3rem] flex-wrap gap-2 rounded-clay border border-dashed border-rule bg-paper-sunk p-3">
        {built.map((entry) => (
          <button
            key={entry.key}
            type="button"
            disabled={disabled}
            onClick={() => remove(entry)}
            aria-label={t('tiles.remove', { word: entry.tok })}
            className={`${tileBase} border-siegel bg-siegel text-white shadow-raise-siegel active:translate-y-1 active:shadow-none`}
            lang="de"
          >
            <span>{entry.tok}</span>
            {!disabled && <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className={`mt-4 ${LABEL}`}>{t('tiles.bank')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {bank.map((entry) => (
          <button
            key={entry.key}
            type="button"
            disabled={disabled}
            onClick={() => add(entry)}
            className={`${tileBase} border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none`}
            lang="de"
          >
            {entry.tok}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Match pairs ([[left, right]], SCHEMA §3.1). A wrong tap never commits: it flashes
 * (icon + colour) and counts as a miss; `onComplete(misses)` fires once every pair is
 * matched. The right column is shuffled deterministically by the item id.
 */
export function MatchInput({ itemId, pairs, onComplete, disabled }) {
  const [, t] = useV2Strings();
  const order = useMemo(() => seededOrder(pairs.length, itemId), [pairs.length, itemId]);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [flash, setFlash] = useState(null);
  const [misses, setMisses] = useState(0);

  const pickLeft = (i) => { if (!disabled && !matched.has(i)) { setFlash(null); setSelected(i); } };
  const pickRight = (i) => {
    if (disabled || matched.has(i) || selected == null) return;
    if (selected === i) {
      const next = new Set(matched).add(i);
      setMatched(next);
      setSelected(null);
      if (next.size === pairs.length) onComplete(misses);
    } else {
      setMisses((m) => m + 1);
      setFlash({ l: selected, r: i });
      setSelected(null);
    }
  };

  const cls = (on, wrong, done) => {
    if (done) return 'correct';
    if (wrong) return 'wrong';
    return on ? 'selected' : 'idle';
  };

  return (
    <div>
      <p className="text-[0.9375rem] text-graphite">{t('match.instructions')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((p, i) => (
            <ChoiceTile
              key={`l-${i}`}
              state={cls(selected === i, flash && flash.l === i, matched.has(i))}
              disabled={disabled || matched.has(i)}
              onClick={() => pickLeft(i)}
              aria-label={`${t('match.left', { n: i + 1 })}: ${p[0]}`}
              lang="de"
            >
              {p[0]}
            </ChoiceTile>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {order.map((i) => (
            <ChoiceTile
              key={`r-${i}`}
              state={cls(false, flash && flash.r === i, matched.has(i))}
              disabled={disabled || matched.has(i)}
              onClick={() => pickRight(i)}
              aria-label={`${t('match.right', { n: i + 1 })}: ${pairs[i][1]}`}
            >
              {pairs[i][1]}
            </ChoiceTile>
          ))}
        </div>
      </div>
      {matched.size === pairs.length && (
        <p className="mt-3 flex items-center gap-2 text-[0.875rem] font-bold text-siegel-deep">
          <Check className="h-4 w-4" aria-hidden="true" /> {pairs.length}/{pairs.length}
        </p>
      )}
    </div>
  );
}
