import { bankFeatureInputs } from './lesenGate.mjs';

// Lift the existing binary surface heuristics to all printed choices. Each pair
// votes; tied top choices receive fractional credit. No key enters the picks.
export function surfaceAudit(papers) {
  const units = papers.flat().filter(u => u.options);
  const totals = new Map();
  for (const unit of units) {
    const ranks = {};
    for (let i = 0; i < unit.options.length; i++) for (let j = i + 1; j < unit.options.length; j++) {
      const pair = { ...unit, text: unit.text || unit.audioText, options: [unit.options[i], unit.options[j]] };
      const { picks } = bankFeatureInputs([[pair]])[0];
      for (const [name, pick] of Object.entries(picks)) {
        if (['identical option set within pair', 'pair role'].includes(name)) continue;
        ranks[name] ||= unit.options.map(() => 0);
        ranks[name][i] += pick === null ? 0.5 : pick === 0 ? 1 : 0;
        ranks[name][j] += pick === null ? 0.5 : pick === 1 ? 1 : 0;
      }
    }
    const key = unit.options.indexOf(unit.answer);
    for (const [name, rank] of Object.entries(ranks)) {
      const best = Math.max(...rank);
      const ties = rank.filter(x => x === best).length;
      totals.set(name, (totals.get(name) || 0) + (rank[key] === best ? 1 / ties : 0));
    }
  }
  const strategies = [...totals].map(([name, score]) => ({ name, score, rate: score / units.length })).sort((a, b) => b.score - a.score);
  const positions = Array.from({ length: Math.max(0, ...units.map(u => u.options.length)) }, (_, i) => units.filter(u => u.options.indexOf(u.answer) === i).length);
  const bySlot = [];
  for (const paper of papers) paper.filter(u => u.options).forEach((u, i) => {
    bySlot[i] ||= {};
    const key = u.options.indexOf(u.answer);
    bySlot[i][key] = (bySlot[i][key] || 0) + 1;
  });
  return {
    count: units.length, chance: units.reduce((s, u) => s + 1 / u.options.length, 0) / units.length,
    positions, orderBest: bySlot.reduce((s, keys) => s + Math.max(...Object.values(keys)), 0) / units.length,
    worst: strategies[0], strategies,
  };
}

export function a21BankAudit(curriculum) {
  const banks = curriculum.checkpoints.flatMap(cp => ['lesen', 'hoeren'].map(section => ({
    checkpoint: cp.nr, section, ...surfaceAudit(cp[section].papers),
  })));
  const papers = curriculum.checkpoints.flatMap(cp => ['lesen', 'hoeren'].flatMap(section => cp[section].papers));
  const kinds = ['mc3', 'match', 'trueFalse'].map(kind => ({kind, ...surfaceAudit(papers.map(p => p.filter(u => u.kind === kind)).filter(p => p.length))}));
  return { banks, kinds };
}
