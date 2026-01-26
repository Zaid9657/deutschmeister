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
        // A1.1 - Sunrise Warmth I (Lighter)
        'a1-1': {
          primary: '#F4B99A',
          secondary: '#D9A8B4',
          accent: '#41B3A3',
          background: '#FDF8F5',
          surface: '#FFFFFF',
          text: '#2D3436',
          muted: '#636E72',
        },
        // A1.2 - Sunrise Warmth II (Deeper)
        'a1-2': {
          primary: '#E8A87C',
          secondary: '#C38D9E',
          accent: '#41B3A3',
          background: '#FDF6F0',
          surface: '#FFFFFF',
          text: '#2D3436',
          muted: '#636E72',
        },
        // A2.1 - Forest Calm I (Lighter)
        'a2-1': {
          primary: '#7BAF8E',
          secondary: '#A8D4AC',
          accent: '#D4A574',
          background: '#F7FAF8',
          surface: '#FFFFFF',
          text: '#1E3A2F',
          muted: '#4A6B5D',
        },
        // A2.2 - Forest Calm II (Deeper)
        'a2-2': {
          primary: '#5B8A72',
          secondary: '#8FB996',
          accent: '#D4A574',
          background: '#F5F9F6',
          surface: '#FFFFFF',
          text: '#1E3A2F',
          muted: '#4A6B5D',
        },
        // B1.1 - Ocean Depth I (Lighter)
        'b1-1': {
          primary: '#5A7A9A',
          secondary: '#B0D4E8',
          accent: '#EE6C4D',
          background: '#F2F6F9',
          surface: '#FFFFFF',
          text: '#1B2838',
          muted: '#5C7A99',
        },
        // B1.2 - Ocean Depth II (Deeper)
        'b1-2': {
          primary: '#3D5A80',
          secondary: '#98C1D9',
          accent: '#EE6C4D',
          background: '#F0F4F8',
          surface: '#FFFFFF',
          text: '#1B2838',
          muted: '#5C7A99',
        },
        // B2.1 - Twilight Elegance I (Lighter)
        'b2-1': {
          primary: '#8A7AAF',
          secondary: '#BDB0D9',
          accent: '#E8B4BC',
          background: '#F9F7FB',
          surface: '#FFFFFF',
          text: '#2D2640',
          muted: '#7A6F8F',
        },
        // B2.2 - Twilight Elegance II (Deeper)
        'b2-2': {
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