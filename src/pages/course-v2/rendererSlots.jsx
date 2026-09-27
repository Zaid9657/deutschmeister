import { Component, Suspense, lazy } from 'react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';

// The renderer slots of the v2 player.
//
// StepView and StartView belong to the renderer agent (src/components/course-v2/,
// shared contract: StepView({ unit, step, level, onAttempt, onDone }),
// StartView({ unit, level, onDone })). The player must build and run before they
// exist, so they are resolved through import.meta.glob: a glob over a missing file
// is empty (no build error), and the component is React.lazy-loaded only when it
// is there. Until then — or if a renderer throws — the slot shows a plain fallback
// that never records anything as done.

const STEP_VIEW = import.meta.glob('../../components/course-v2/StepView.jsx');
const START_VIEW = import.meta.glob('../../components/course-v2/StartView.jsx');

const lazyFrom = (table) => {
  const loader = Object.values(table)[0];
  return loader ? lazy(loader) : null;
};

const LazyStepView = lazyFrom(STEP_VIEW);
const LazyStartView = lazyFrom(START_VIEW);

/** True once the renderer agent's StepView / StartView exist in the build. */
export const hasStepRenderer = Boolean(LazyStepView);
export const hasStartRenderer = Boolean(LazyStartView);

export const KIND_LABEL_DE = Object.freeze({
  situation: 'Situation',
  text: 'Text',
  sprache: 'Sprache',
  pruefung: 'Prüfungstraining',
  sprechen: 'Sprechen',
  schreiben: 'Schreiben',
  ueberarbeiten: 'Überarbeiten',
  check: 'Lektions-Check',
});

class SlotBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[course-v2] renderer failed:', error && error.message);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Loading() {
  return <p className="py-16 text-center text-sm italic text-graphite">Übung wird geladen …</p>;
}

function PendingRenderer({ title, kind, onSkip }) {
  return (
    <Card className="p-5">
      <Chip tone="quiet">{KIND_LABEL_DE[kind] || kind}</Chip>
      <h2 className="mt-3 font-display text-xl text-ink">{title}</h2>
      <p className="mt-2 text-sm text-graphite">
        Diese Übungsansicht ist noch nicht verfügbar. Sie können den Schritt später machen – er bleibt offen.
      </p>
      {onSkip && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onSkip}>Zum nächsten Schritt</Button>
        </div>
      )}
    </Card>
  );
}

/** One step through the renderer's StepView, or the fallback. `onSkip` never records completion. */
export function StepViewSlot({ unit, step, level, onAttempt, onDone, onSkip, title }) {
  const fallback = <PendingRenderer title={title} kind={step && step.kind} onSkip={onSkip} />;
  if (!LazyStepView) return fallback;
  return (
    <SlotBoundary resetKey={step && step.id} fallback={fallback}>
      <Suspense fallback={<Loading />}>
        <LazyStepView key={step && step.id} unit={unit} step={step} level={level} onAttempt={onAttempt} onDone={onDone} />
      </Suspense>
    </SlotBoundary>
  );
}

/** The unit's Start through the renderer's StartView; `fallback` is the player's own Start screen. */
export function StartViewSlot({ unit, level, onDone, fallback }) {
  if (!LazyStartView) return fallback;
  return (
    <SlotBoundary resetKey={unit && unit.id} fallback={fallback}>
      <Suspense fallback={<Loading />}>
        <LazyStartView unit={unit} level={level} onDone={onDone} />
      </Suspense>
    </SlotBoundary>
  );
}
