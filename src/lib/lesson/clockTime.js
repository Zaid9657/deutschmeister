// Shared limits for the frame checker and sentence reader. Relative clock
// expressions use the twelve-hour dial, with halb instead of dreißig nach.
export function clockMinutes(hour, minute = 0) {
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 24
    && minute >= 0 && minute < 60 && (hour !== 24 || minute === 0)
    ? (hour % 12) * 60 + minute : null;
}

export function relativeClock(amount, relation, hour, half = false, minutesSaid = false) {
  if (!Number.isInteger(hour) || hour < 1 || hour > 12 || !Number.isInteger(amount)
    || amount < 1 || amount >= (minutesSaid ? 60 : half ? 15 : 30)) return null;
  const base = half ? (hour - 1) * 60 + 30 : (hour % 12) * 60;
  return (base + (relation === 'vor' ? -amount : amount) + 720) % 720;
}

/** Text with number words already converted to digits. */
export function invalidClock(text) {
  const t = text.toLowerCase();
  if (/(?<!\p{L})(?:halb\s+\d+|viertel\s+(?:nach|vor)\s+\d+|\d+\s+(?:nach|vor)\s+(?:halb\s+)?\d+)\s+uhr(?!\p{L})/u.test(t)) return true;
  for (const m of t.matchAll(/(?<![\p{L}\d])(\d+)\s+(nach|vor)\s+(halb\s+)?(\d+)(?![\p{L}\d])/gu)) {
    if (relativeClock(+m[1], m[2], +m[4], Boolean(m[3])) === null) return true;
  }
  return false;
}
