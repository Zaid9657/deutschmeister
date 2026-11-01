// A recorded, reproducible local run of the course answer checker, not an AI
// writing assessment. The owned sample is the course's greeting correction.
import pool from '../../../src/data/lessonPools/a11.extra.json' with { type: 'json' };
import explanations from '../../../src/data/lessonPools/a11.explanationsEn.json' with { type: 'json' };

const item = pool.items.find((entry) => entry.id === 'extra-a11-l01-08');
export const RECORDED_CORRECTION = {
  recordedOn: '2026-11-01',
  item,
  draft: 'Gute Tag, Frau Kaya!',
  revision: item.answer,
  explanation: explanations[item.id],
  beforeResult: 'wrong',
  afterResult: 'correct',
};
