import {
  legacyLevelColors, tailwindTypeSizes, tailwindColors, tailwindFontFamily, tailwindBoxShadow, tailwindEasing, radius, fontFaces,
  // v3 "Die Linie" — additive: the sign face, the line/night palette, motion tiers.
  signFontFaces, tailwindSignFont, tailwindLinieColors, tailwindLinieShadow, tailwindLinieEasing, tailwindLinieDuration,
} from './src/data/design-tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Faces and palette come from src/data/design-tokens.js — the one place
      // a hex value or font stack is written. `accent` is kept as an alias of
      // the data face so the legacy `font-accent` call sites keep working.
      fontFamily: { ...tailwindFontFamily, ...tailwindSignFont, accent: tailwindFontFamily.data },
      colors: {
        ...tailwindColors,
        ...tailwindLinieColors,
        ...legacyLevelColors,
      },
      // `pill` + `clay` only. The rest of `radius` deliberately stays unwired:
      // the token values for sm/md/lg collide with Tailwind's own defaults, and
      // adopting them would silently reshape every `rounded-lg` in the app.
      // Neither `pill` nor `clay` has a default to collide with — and
      // astro-site/src/pages/pricing.astro was already calling `rounded-pill`
      // against a config that never defined it, so its billing toggle rendered
      // square since it shipped.
      borderRadius: { pill: radius.pill, clay: radius.clay, control: radius.control, window: radius.window },
      fontSize: { ...tailwindTypeSizes },
      boxShadow: { ...tailwindBoxShadow, ...tailwindLinieShadow },
      transitionTimingFunction: { ...tailwindEasing, ...tailwindLinieEasing },
      transitionDuration: { ...tailwindLinieDuration },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 420ms ease-out',
        'fade-in': 'fadeIn 800ms ease-out',
        'pop-in': 'popIn 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'wiggle': 'wiggle 420ms ease-in-out',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        popIn: { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        wiggle: { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-4deg)' }, '75%': { transform: 'rotate(4deg)' } },
      },
    },
  },
  // The self-hosted faces and their metric-matched fallbacks (design-tokens.js,
  // "SELF-HOSTED FACES"). Upright only: the static pages never loaded the
  // italic cut, and their few italic lines stay synthesised as before.
  plugins: [({ addBase }) => addBase([...fontFaces, ...signFontFaces])],
};
