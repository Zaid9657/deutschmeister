// Pure route model for the City Conversation Map — no React, no network.
// tests/speaking-route-model.test.mjs pins every rule:
//
//   * stations open strictly in order: the first station without a PASSED
//     attempt is `current`; everything after it is `locked`;
//   * a passed station stays `complete` and replayable forever;
//   * `access: 'preview'` (no course, no subscription) course-locks stations
//     4–12 whatever the progress says — the paywall never yields to progress;
//   * `canOpenStation` is the URL-boundary twin of the map rendering, so a
//     typed URL can never skip a locked station.
//
// The preview window matches the course preview (guidedCourseAccess.js):
// three lessons, three stations.
import { A11_PREVIEW_LESSONS } from '../../lib/guidedCourseAccess.js';

export const PREVIEW_STATIONS = A11_PREVIEW_LESSONS;

const passedOrders = (attempts) => new Set(
  (attempts || []).filter((a) => a?.passed === true).map((a) => Number(a.missionOrder)),
);

/**
 * buildA11Route({ missions, attempts, access }) → Station[]
 * access: 'owner' (course or subscription) | 'preview'. Defaults to 'owner'
 * so callers that already gate access upstream get pure progress states.
 * States: 'complete' | 'current' | 'locked' | 'course-locked'.
 */
export function buildA11Route({ missions, attempts, access = 'owner' }) {
  const passed = passedOrders(attempts);
  const sorted = [...(missions || [])].sort((a, b) => a.order - b.order);
  let currentAssigned = false;
  return sorted.map((mission) => {
    const previewLocked = access === 'preview' && mission.order > PREVIEW_STATIONS;
    if (previewLocked) {
      return { ...mission, state: 'course-locked', action: 'unlock-course' };
    }
    if (passed.has(mission.order)) {
      return { ...mission, state: 'complete', action: 'replay' };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...mission, state: 'current', action: 'start' };
    }
    return { ...mission, state: 'locked', action: null };
  });
}

/** The URL-boundary check: may this learner open station `order` right now? */
export function canOpenStation({ missions, attempts, order, access = 'owner' }) {
  const station = buildA11Route({ missions, attempts, access })
    .find((s) => s.order === Number(order));
  if (!station) return false;
  return station.state === 'complete' || station.state === 'current';
}
