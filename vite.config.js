import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vendor chunks by PACKAGE PATH, not by name. The object form this replaced
// (`'vendor-ui': ['framer-motion', 'lucide-react']`) loads each named package
// as a chunk entry, and an entry keeps every export: all ~1,300 lucide icons
// (~625 KB of the 757 KB vendor-ui chunk) shipped to every SPA page, and
// modulepreloaded ahead of the stylesheet, to draw the ~100 the app imports.
// The function form assigns only modules that survive tree-shaking. Icons are
// deliberately left out, so each one lands with the code that draws it.
// Measured 2026-09-27: docs/SCORECARD.md work order #9.
const VENDOR_CHUNKS = [
  ['vendor-react', /\/node_modules\/(react|react-dom|react-router|react-router-dom|@remix-run\/router|scheduler)\//],
  ['vendor-supabase', /\/node_modules\/@supabase\//],
  ['vendor-ui', /\/node_modules\/framer-motion\//],
]

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          return VENDOR_CHUNKS.find(([, pattern]) => pattern.test(id))?.[0]
        },
      },
    },
  },
})
