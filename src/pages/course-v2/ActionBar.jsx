import { useLocation } from 'react-router-dom';
import { chromeFor } from '../../lib/chrome.js';
import { useAuth } from '../../contexts/AuthContext';

// The one primary action of a v2 screen, pinned in the thumb zone (BLUEPRINT §7.1:
// full width, ≥ 48 px, bottom). Which app chrome surrounds the page is decided by
// src/lib/chrome.js: on a focused 'player' route there is nothing below the bar;
// on every other route the mobile BottomNav (fixed, h-16, below lg) is, so the bar
// sits on top of it instead of underneath. Reading chromeFor keeps this right
// whichever mode the v2 routes are given there. BottomNav renders only for a
// signed-in learner (src/components/BottomNav.jsx), so a signed-out visitor — the
// free level's course home — gets the bar at the very bottom, not over a 64 px gap.
export default function ActionBar({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const lifted = chromeFor(pathname) !== 'player' && Boolean(user);
  return (
    <div
      className={`fixed inset-x-0 z-40 border-t border-rule bg-paper px-4 pt-3 ${
        lifted ? 'bottom-16 pb-3 lg:bottom-0' : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-2">{children}</div>
    </div>
  );
}
