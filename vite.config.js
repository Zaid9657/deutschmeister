import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // framer-motion and lucide-react used to share one 'vendor-ui' chunk,
          // which meant the app shell's handful of icons dragged the whole
          // animation library into the critical path of every route — including
          // /level-test and /speaking, which never animate anything. Split, so
          // motion loads only for the routes that actually use it.
          'vendor-icons': ['lucide-react'],
          'vendor-motion': ['framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
