/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Cormorant Garamond', 'serif'],
        'body': ['Nunito Sans', 'sans-serif'],
        'accent': ['Fira Code', 'monospace'],
      },
      colors: {
        'a1': {
          primary: '#E8A87C',
          secondary: '#C38D9E',
          accent: '#41B3A3',
          background: '#FDF6F0',
          surface: '#FFFFFF',
          text: '#2D3436',
          muted: '#636E72',
        },
        'a2': {
          primary: '#5B8A72',
          secondary: '#8FB996',
          accent: '#D4A574',
          background: '#F5F9F6',
          surface: '#FFFFFF',
          text: '#1E3A2F',
          muted: '#4A6B5D',
        },
        'b1': {
          primary: '#3D5A80',
          secondary: '#98C1D9',
          accent: '#EE6C4D',
          background: '#F0F4F8',
          surface: '#FFFFFF',
          text: '#1B2838',
          muted: '#5C7A99',
        },
        'b2': {
          primary: '#6B5B95',
          secondary: '#9D8EC1',
          accent: '#E8B4BC',
          background: '#F8F6FA',
          surface: '#FFFFFF',
          text: '#2D2640',
          muted: '#7A6F8F',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
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
      },
    },
  },
  plugins: [],
}