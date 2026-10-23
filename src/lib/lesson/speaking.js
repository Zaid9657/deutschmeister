// Optional materials, bounded at the client/server boundary. Absent fields stay
// absent so A1 hand-offs and stored scenarios retain their original shape.
export function speakingMaterials(value = {}) {
  const clean = (s, max = 160) => typeof s === 'string' ? s.trim().slice(0, max) : '';
  const out = {};
  for (const key of ['cards', 'prompts']) {
    if (Array.isArray(value[key])) out[key] = value[key].slice(0, 4).map((s) => clean(s)).filter(Boolean);
  }
  if (Array.isArray(value.calendar)) out.calendar = value.calendar.slice(0, 2).map((c) => ({
    owner: clean(c?.owner, 60),
    slots: (Array.isArray(c?.slots) ? c.slots : []).slice(0, 12).map((s) => ({ time: clean(s?.time, 60), activity: clean(s?.activity) })).filter((s) => s.time && s.activity),
  }));
  return out;
}
