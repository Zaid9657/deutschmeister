import {
  legacyLevelColors, tailwindTypeSizes, tailwindColors, tailwindFontFamily, tailwindBoxShadow, tailwindEasing, radius, fontFaces, fontFacesItalic,
  // v3 "Die Linie" — additive: the sign face, the line/night palette, motion tiers.
  signFontFaces, tailwindSignFont, tailwindLinieColors, tailwindLinieShadow, tailwindLinieEasing, tailwindLinieDuration,
} from './src/data/design-tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  // `hover:` only on devices that can hover — a tap on a phone left hover styles stuck on.
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // This script emits real user-facing HTML (the 8 prerendered SPA routes —
    // the first paint and the only thing a crawler sees), so its classes must
    // be scanned like any component's. Until it was listed here its styling
    // survived purely by coincidence — every class it used happened to also be
    // used somewhere under src/ — and the design sweep ended the coincidence.
    "./scripts/prerender-spa-routes.mjs",
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
      // Rule 3 (v2): depth is an affordance. Raised/pressed shadows come from
      // the tokens (`shadow-raise`, `shadow-raise-siegel`, …), never from an
      // arbitrary value at a call site.
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
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 420ms ease-out',
        'fade-in': 'fadeIn 800ms ease-out',
        'pop-in': 'popIn 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'wiggle': 'wiggle 420ms ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,0,0,0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0,0,0,0.15)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-4deg)' },
          '75%': { transform: 'rotate(4deg)' },
        },
      },
    },
  },
  // The self-hosted faces and their metric-matched fallbacks (design-tokens.js,
  // "SELF-HOSTED FACES"). The SPA keeps the true italic it always loaded. The
  // sign face (Archivo) is declared too; a browser fetches it only when a
  // `font-sign` element renders.
  plugins: [({ addBase }) => addBase([...fontFaces, ...fontFacesItalic, ...signFontFaces])],
}