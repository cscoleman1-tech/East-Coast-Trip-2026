import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/East-Coast-Trip-2026/',
  build: {
    rollupOptions: {
      input: './vite-entry.html',
    },
  },
})
