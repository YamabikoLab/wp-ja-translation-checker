import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/wp-ja-translation-checker/',
  plugins: [react()],
})
