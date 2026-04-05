/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Cormorant Garamond', 'serif'],
        'body': ['Nunito Sans', 'sans-serif'],
        'accent': ['Fira Code', 'monospace'],
      },
      colors: {
        'a1-1': { primary: '#F4B99A', secondary: '#D9A8B4', accent: '#41B3A3', background: '#FDF8F5', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
        'a1-2': { primary: '#E8A87C', secondary: '#C38D9E', accent: '#41B3A3', background: '#FDF6F0', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
        'a2-1': { primary: '#7BAF8E', secondary: '#A8D4AC', accent: '#D4A574', background: '#F7FAF8', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
        'a2-2': { primary: '#5B8A72', secondary: '#8FB996', accent: '#D4A574', background: '#F5F9F6', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
        'b1-1': { primary: '#5A7A9A', secondary: '#B0D4E8', accent: '#EE6C4D', background: '#F2F6F9', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
        'b1-2': { primary: '#3D5A80', secondary: '#98C1D9', accent: '#EE6C4D', background: '#F0F4F8', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
        'b2-1': { primary: '#8A7AAF', secondary: '#BDB0D9', accent: '#E8B4BC', background: '#F9F7FB', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
        'b2-2': { primary: '#6B5B95', secondary: '#9D8EC1', accent: '#E8B4BC', background: '#F8F6FA', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
