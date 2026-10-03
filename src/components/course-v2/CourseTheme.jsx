import { coursePalettes, COURSE_PALETTE } from '../../data/design-tokens.js';
import { safeGet, safeSet } from '../../utils/safeStorage.js';

// The course theme (design-tokens.js, "THE COURSE THEME"): every v2 course screen
// renders inside it, and it sets the live palette as CSS variables, so the
// Tailwind `course-*` colours (bg-course, text-course-ink, shadow-course …)
// resolve to one palette everywhere. The palette is COURSE_PALETTE unless a
// preview asks for another: `?palette=himbeere` on any course URL switches it
// for this browser tab (sessionStorage), so the owner can compare the three
// candidates on the real screens before one is chosen.

const PREVIEW_KEY = 'dm_course_palette_preview';

export function previewPalette() {
  if (typeof window === 'undefined') return COURSE_PALETTE;
  try {
    const asked = new URLSearchParams(window.location.search).get('palette');
    if (asked && coursePalettes[asked]) {
      safeSet(PREVIEW_KEY, asked, { session: true });
      return asked;
    }
  } catch {
    // no URL API → the default palette
  }
  const kept = safeGet(PREVIEW_KEY, { session: true });
  return kept && coursePalettes[kept] ? kept : COURSE_PALETTE;
}

/** The CSS variables of a palette (default: the live one). */
export function paletteVars(name = COURSE_PALETTE) {
  const p = coursePalettes[name] || coursePalettes[COURSE_PALETTE];
  return {
    '--c-primary': p.primary,
    '--c-edge': p.edge,
    '--c-wash': p.wash,
    '--c-soft': p.soft,
    '--c-ink': p.ink,
    '--c-ground': p.ground,
  };
}

export default function CourseTheme({ className = '', children }) {
  return (
    <div className={`min-h-screen bg-course-ground font-body text-game-text ${className}`} style={paletteVars(previewPalette())}>
      {children}
    </div>
  );
}
