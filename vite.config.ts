import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/Deureum.livrable/', // ← doit correspondre exactement au nom du repo
})