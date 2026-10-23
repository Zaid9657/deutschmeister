import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import PracticeItem from '../../src/components/lesson/PracticeItem.jsx';
import { PracticeItem as CheckpointItem } from '../../src/pages/lesson/CheckpointPage.jsx';
import SpeakingStage from '../../src/components/lesson/SpeakingStage.jsx';
import IntroStage from '../../src/components/lesson/IntroStage.jsx';
import WortfeldStage from '../../src/components/lesson/WortfeldStage.jsx';
import { a2EngineCourse, unitFor } from './a2-engine-course.mjs';
import { examUnitItem } from '../../src/lib/lesson/exam.js';
import { CURRICULUM_A11 } from '../../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../../src/data/curricula/a12.js';
import { buildCheckpoint } from '../../src/lib/checkpoint/buildCheckpoint.js';
import CourseWelcome from '../../src/components/course/CourseWelcome.jsx';
import { A11_META } from '../../src/data/curricula/a11.meta.js';

const noop = () => {};
export const modes = ['Lesen MC', 'Lesen Zuordnung', 'Hören Bilder', 'Checkpoint MC', 'Checkpoint Zuordnung', 'Sprechen 1', 'Sprechen 2', 'Sprechen 3', 'Intro', 'Wortfeld'];

export function A1Surface({ level, mode }) {
  const c = level === 'a1.1' ? CURRICULUM_A11 : CURRICULUM_A12;
  const l = c.lektionen[0];
  if (mode === 'Intro') return <IntroStage curriculum={c} lektion={l} onStart={noop} />;
  if (mode === 'Wortfeld') return <WortfeldStage curriculum={c} stage={{ words: l.wortfeld }} onBack={noop} onDone={noop} />;
  if (mode === 'Welcome') return <CourseWelcome curriculum={c} meta={level === 'a1.1' ? A11_META : null} />;
  if (mode === 'Speaking') return <SpeakingStage stage={{ open: l.sprechen.open, readAloud: [] }} level={c.level} lektion={l} onBack={noop} onDone={noop} />;
  const item = buildCheckpoint({ curriculum: c, checkpoint: c.checkpoints[0], pool: [] }).find((i) => i.section === 'lesen');
  return <CheckpointItem item={item} graded onAnswer={noop} />;
}

export function Surface({ mode = modes[0] }) {
  const c = a2EngineCourse();
  if (mode.startsWith('Sprechen')) {
    const l = c.lektionen[Number(mode.at(-1)) - 1];
    return <SpeakingStage stage={{ open: l.sprechen.open, readAloud: [] }} level={c.level} lektion={l} onBack={noop} onDone={noop} />;
  }
  if (mode === 'Intro') return <IntroStage curriculum={c} lektion={c.lektionen[0]} onStart={noop} />;
  if (mode === 'Wortfeld') return <WortfeldStage curriculum={c} lektionId={c.lektionen[0].id} stage={{ words: c.lektionen[0].wortfeld }} onBack={noop} onDone={noop} />;
  const teil = mode.includes('Zuordnung') ? 'Lesen Teil 4' : mode === 'Hören Bilder' ? 'Hören Teil 3' : 'Lesen Teil 1';
  const item = examUnitItem(unitFor(teil), { section: teil.startsWith('Lesen') ? 'lesen' : 'hoeren', level: c.level, lektionId: c.lektionen[0].id });
  return mode.startsWith('Checkpoint')
    ? <CheckpointItem key={mode} item={item} graded onAnswer={noop} />
    : <PracticeItem key={mode} item={item} index={0} total={3} level={c.level} onResult={noop} onNext={noop} />;
}

export default function RenderFixture() {
  const [mode, setMode] = useState(modes[0]);
  return <MemoryRouter><main className="mx-auto max-w-3xl p-5">
    <label htmlFor="surface">Synthetic A2 engine surface</label>
    <select id="surface" className="mb-6 ml-3 border p-2" value={mode} onChange={(e) => setMode(e.target.value)}>{modes.map((m) => <option key={m}>{m}</option>)}</select>
    <Surface key={mode} mode={mode} />
  </main></MemoryRouter>;
}
