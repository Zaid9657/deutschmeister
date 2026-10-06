import { Youtube, Instagram, Facebook } from 'lucide-react';

// One lucide glyph per SOCIAL_LINKS key (src/data/navigation.js). The Astro
// footer draws the same three glyphs inline; tests/navigation.test.mjs checks
// that every registry key has an icon on both sides.
export const SOCIAL_ICONS = { youtube: Youtube, instagram: Instagram, facebook: Facebook };
