/** Frames are finite sentence patterns, expanded before the ordinary answer checker. */
export function expandProofPart(part, sets = {}) {
  const forms = [...(Array.isArray(part?.forms) ? part.forms : [])];
  for (const frame of Array.isArray(part?.frames) ? part.frames : []) {
    if (typeof frame?.pattern !== 'string') continue;
    const names = [...new Set([...frame.pattern.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
    let rows = [frame.pattern];
    for (const name of names) {
      const values = sets[frame.slots?.[name]];
      rows = Array.isArray(values) && values.every((v) => typeof v === 'string')
        ? rows.flatMap((row) => values.map((v) => row.replaceAll(`{${name}}`, v))) : [];
    }
    forms.push(...rows);
  }
  return { ...part, forms: [...new Set(forms)] };
}
