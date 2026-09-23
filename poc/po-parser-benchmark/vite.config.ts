import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const gettextBrowserBundle = fileURLToPath(
  new URL('../../node_modules/gettext-converter/gettext.js', import.meta.url),
)

export default defineConfig({
  root: 'poc/po-parser-benchmark',
  resolve: {
    alias: {
      'gettext-converter-browser': gettextBrowserBundle,
    },
  },
  build: {
    outDir: '../../dist/po-parser-benchmark',
    emptyOutDir: true,
  },
})
