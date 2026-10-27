import { useEffect } from 'react';

// A redirect to a page the SPA does not serve. The course pages sent an unknown
// level to /courses/ with a client-side <Navigate>, but /courses/ is an Astro page
// (src/data/navigation.js marks it kind 'static'): the SPA has no route for it,
// so the learner saw the app's "Page Not Found" at /courses/ until a refresh, and
// `replace` had taken the way back too. A 'static' target is ALWAYS a full page
// load (the registry's contract); this is that load, replacing the history entry
// the way <Navigate replace> did. tests/static-redirects.test.mjs keeps every
// redirect to a 'static' path on it.
export default function FullPageRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <div className="min-h-screen bg-paper" aria-busy="true" />;
}
