import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // The three.js/@react-three/drei scene is already isolated into its own
    // async chunk (see the React.lazy() import in Hero.tsx) and never blocks
    // first paint, so Vite's default 500kB warning for that one chunk is a
    // known, accepted tradeoff rather than something to keep silencing by
    // re-reading this comment on every build.
    chunkSizeWarningLimit: 900,
  },
})
