import { dirname, join, resolve } from 'node:path';

export function flag(argv, name, fallback) {
  const index = argv.findIndex((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (index === -1) return fallback;
  const arg = argv[index];
  const value = arg === `--${name}` ? argv[index + 1] : arg.slice(name.length + 3);
  if (!value || value.startsWith('--')) throw new Error(`--${name} needs a value`);
  return value;
}

export function evaluationOutput(name, { argv = process.argv.slice(2), cwd = process.cwd(), now = new Date(), report } = {}) {
  const out = flag(argv, 'out');
  const run = `${name}-${now.toISOString().replace(/[:.]/g, '-')}`;
  const destination = resolve(cwd, out ?? join('.cache', 'evaluation', run));
  // Retain Lighthouse's existing --out=path/report.json form alongside the
  // shared --out directory option used by all three capture tools.
  if (name === 'lighthouse' && report && out && /\.json$/i.test(out)) return { directory: dirname(destination), report: destination };
  return { directory: destination, report: report ? join(destination, report) : undefined };
}
