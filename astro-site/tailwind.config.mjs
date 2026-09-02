import { tailwindColors, tailwindFontFamily, tailwindBoxShadow, tailwindEasing, radius } from './src/data/design-tokens.js';

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
      fontFamily: { ...tailwindFontFamily, accent: tailwindFontFamily.data },
      colors: {
        ...tailwindColors,
        'a1-1': { primary: '#F4B99A', secondary: '#D9A8B4', accent: '#41B3A3', background: '#FDF8F5', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
        'a1-2': { primary: '#E8A87C', secondary: '#C38D9E', accent: '#41B3A3', background: '#FDF6F0', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
        'a2-1': { primary: '#7BAF8E', secondary: '#A8D4AC', accent: '#D4A574', background: '#F7FAF8', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
        'a2-2': { primary: '#5B8A72', secondary: '#8FB996', accent: '#D4A574', background: '#F5F9F6', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
        'b1-1': { primary: '#5A7A9A', secondary: '#B0D4E8', accent: '#EE6C4D', background: '#F2F6F9', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
        'b1-2': { primary: '#3D5A80', secondary: '#98C1D9', accent: '#EE6C4D', background: '#F0F4F8', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
        'b2-1': { primary: '#8A7AAF', secondary: '#BDB0D9', accent: '#E8B4BC', background: '#F9F7FB', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
        'b2-2': { primary: '#6B5B95', secondary: '#9D8EC1', accent: '#E8B4BC', background: '#F8F6FA', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
      },
      // `pill` + `clay` only. The rest of `radius` deliberately stays unwired:
      // the token values for sm/md/lg collide with Tailwind's own defaults, and
      // adopting them would silently reshape every `rounded-lg` in the app.
      // Neither `pill` nor `clay` has a default to collide with — and
      // astro-site/src/pages/pricing.astro was already calling `rounded-pill`
      // against a config that never defined it, so its billing toggle rendered
      // square since it shipped.
      borderRadius: { pill: radius.pill, clay: radius.clay },
      boxShadow: { ...tailwindBoxShadow },
      transitionTimingFunction: { ...tailwindEasing },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'pop-in': 'popIn 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'wiggle': 'wiggle 0.5s ease-in-out',
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
  plugins: [],
};
