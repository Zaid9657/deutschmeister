// Which app chrome a route gets. Pure, so tests/course-front-door.test.mjs can
// pin it without React.
//
//   'full'   — site Navbar + marketing Footer + BottomNav (every ordinary route).
//   'course' — the course home (/course/:level): Navbar and BottomNav stay (it
//              is the learner's home screen), the marketing Footer goes — the
//              page renders its own one-line footer.
//   'player' — one lesson stage, a checkpoint or the review deck: NO site
//              navbar, NO footer, NO bottom tabs. The only exit is the page's
//              own "← A1.1" link. Before this the player rendered the full
//              marketing footer (grammar hub, exam guides, pricing) under a
//              mostly empty stage screen, and on a phone the fixed navbar plus
//              the bottom tabs took a third of the viewport off a single
//              practice item.
//
// The regexes are the /course/* URL shapes App.jsx routes; /course/:level/:itemId
// (the legacy per-item lesson page) and complete/certificate keep the full
// chrome on purpose — they are reading pages, not a stage.
const PLAYER_ROUTE = /^\/course\/[^/]+\/(l\/[^/]+|checkpoint\/[^/]+|review)\/?$/;
const COURSE_HOME_ROUTE = /^\/course\/[^/]+\/?$/;

export const chromeFor = (pathname) => {
  const p = String(pathname || '');
  if (PLAYER_ROUTE.test(p)) return 'player';
  if (COURSE_HOME_ROUTE.test(p)) return 'course';
  return 'full';
};

// Which GROUND the top of a route stands on ("Die Linie", docs/redesign-2026-10/
// art-direction.md). The Astro Layout takes `tone="nacht"` on pages whose first
// screen is a night ground, so the bar and the hero read as one surface; this is
// the SPA's half of that rule. Add a route here in the same commit that gives
// its first screen `bg-nacht`, or a paper bar sits on a night page.
//
//   'nacht' — Navbar renders on night, and the Footer drops its top margin so
//             no paper band separates the page from the (always night) footer.
//   'paper' — every other route.
const NACHT_ROUTES = new Set(['/subscription/success']);

export const groundFor = (pathname) => {
  const p = String(pathname || '').replace(/\/+$/, '') || '/';
  return NACHT_ROUTES.has(p) ? 'nacht' : 'paper';
};
