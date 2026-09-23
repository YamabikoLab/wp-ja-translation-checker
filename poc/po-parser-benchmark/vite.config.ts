import { defineConfig } from 'vite'

export default defineConfig({
  root: 'poc/po-parser-benchmark',
  build: {
    outDir: '../../dist/po-parser-benchmark',
    emptyOutDir: true,
  },
})
