import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';

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

// The course tile (design-tokens.js "THE COURSE THEME"): chunky, with a HARD bottom edge
// (border-2 + border-b-4) that a press flattens. Selected is the palette primary; after the
// check right is the game green and wrong the game crimson — each state also carries an icon
// and a visually hidden word, so it is never colour alone. Full literal class strings only.
const TILE_STATE = {
  idle: 'border-game-line bg-white text-game-text hover:bg-course-wash active:translate-y-0.5 active:border-b-2',
  selected: 'border-course bg-course-wash text-course-ink',
  correct: 'border-game-right bg-game-right-wash text-game-right-ink',
  wrong: 'border-game-wrong bg-game-wrong-wash text-game-wrong-ink',
  solution: 'border-dashed border-game-right bg-white text-game-right-ink',
  muted: 'border-game-line bg-white text-game-muted opacity-60',
};

const TILE_SR = { correct: 'item.srRight', wrong: 'item.srWrong', solution: 'item.srSolution', selected: 'item.srSelected' };

/** One tappable answer tile (choice, Zuordnung, match). ≥ 56 px tall, full width. */
export function GameTile({ state = 'idle', disabled = false, onClick, lang, keyLabel = null, compact = false, className = '', children, ...rest }) {
  const [, t] = useV2Strings();
  const icon = state === 'wrong'
    ? <X className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
    : (state === 'selected' || state === 'correct' || state === 'solution')
      ? <Check className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
      : null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'selected'}
      lang={lang}
      className={
        `flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-b-4 px-4 text-left font-extrabold ${compact ? 'min-h-12 py-2 text-[1rem]' : 'min-h-14 py-3 text-[1.125rem]'} ` +
        'transition-[transform,background-color,border-color] duration-100 ease-snap motion-reduce:transition-none disabled:cursor-default ' +
        `${TILE_STATE[state] || TILE_STATE.idle} ${className}`
      }
      {...rest}
    >
      <span className="flex min-w-0 items-baseline gap-2.5">
        {keyLabel && <span className="shrink-0 rounded-md border-2 border-current px-1.5 text-[0.75rem] uppercase opacity-70">{keyLabel}</span>}
        <span className="min-w-0">{children}</span>
      </span>
      {icon}
      {TILE_SR[state] && <span className="sr-only">{t(TILE_SR[state])}</span>}
    </button>
  );
}

/** A vertical list of tap options (≤ 4 visible choices per item). */
export function ChoiceList({ options, picked, onPick, resolved, correctValue, disabled, compact = false }) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {options.map((opt) => (
        <GameTile
          key={opt.value}
          keyLabel={opt.key || null}
          state={optionState(opt.value, { picked, resolved, correctValue })}
          disabled={disabled || resolved}
          onClick={() => onPick(opt.value)}
          compact={compact}
          lang="de"
        >
          {opt.label}
        </GameTile>
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
      className="min-h-14 w-full rounded-2xl border-2 border-b-4 border-game-line bg-white px-4 py-3 text-[1.0625rem] font-bold text-game-text outline-none focus:border-course disabled:bg-course-ground"
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
    className: 'mt-2 w-full rounded-2xl border-2 border-b-4 border-game-line bg-white px-4 py-3.5 text-[1.125rem] font-bold text-game-text outline-none placeholder:text-game-locked-icon focus:border-course disabled:bg-course-ground',
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
    'inline-flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-b-4 px-3.5 py-2 text-[1.0625rem] font-extrabold ' +
    'transition-[transform,background-color] duration-100 ease-snap active:translate-y-0.5 active:border-b-2 motion-reduce:transition-none disabled:opacity-80';

  return (
    <div data-item={itemId}>
      <p className="text-[0.9375rem] font-semibold text-game-muted">{t('tiles.instructions')}</p>
      <p className={`mt-4 ${LABEL}`}>{t('tiles.yourSentence')}</p>
      <div className="mt-2 flex min-h-[4rem] flex-wrap content-start gap-2 border-b-2 border-game-line py-2">
        {built.map((entry) => (
          <button
            key={entry.key}
            type="button"
            disabled={disabled}
            onClick={() => remove(entry)}
            aria-label={t('tiles.remove', { word: entry.tok })}
            className={`${tileBase} border-course bg-course-wash text-course-ink`}
            lang="de"
          >
            <span>{entry.tok}</span>
            {!disabled && <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className={`mt-5 ${LABEL}`}>{t('tiles.bank')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {bank.map((entry) => (
          <button
            key={entry.key}
            type="button"
            disabled={disabled}
            onClick={() => add(entry)}
            className={`${tileBase} border-game-line bg-white text-game-text hover:bg-course-wash`}
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
      <p className="text-[0.9375rem] font-semibold text-game-muted">{t('match.instructions')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2.5">
          {pairs.map((p, i) => (
            <GameTile
              key={`l-${i}`}
              compact
              state={cls(selected === i, flash && flash.l === i, matched.has(i))}
              disabled={disabled || matched.has(i)}
              onClick={() => pickLeft(i)}
              aria-label={`${t('match.left', { n: i + 1 })}: ${p[0]}`}
              lang="de"
            >
              {p[0]}
            </GameTile>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          {order.map((i) => (
            <GameTile
              key={`r-${i}`}
              compact
              state={cls(false, flash && flash.r === i, matched.has(i))}
              disabled={disabled || matched.has(i)}
              onClick={() => pickRight(i)}
              aria-label={`${t('match.right', { n: i + 1 })}: ${pairs[i][1]}`}
            >
              {pairs[i][1]}
            </GameTile>
          ))}
        </div>
      </div>
      {matched.size === pairs.length && (
        <p className="mt-3 flex items-center gap-2 text-[0.9375rem] font-extrabold text-game-right-ink">
          <Check className="h-4 w-4" aria-hidden="true" /> {pairs.length}/{pairs.length}
        </p>
      )}
    </div>
  );
}
