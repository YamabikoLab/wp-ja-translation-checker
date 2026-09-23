import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const gettextBrowserBundlePath = fileURLToPath(
  new URL('../../node_modules/gettext-converter/gettext.js', import.meta.url),
)
const gettextBrowserBundle = readFileSync(gettextBrowserBundlePath, 'utf8')

const serveGettextBrowserBundle = (): Plugin => ({
  name: 'serve-gettext-converter-browser-bundle',
  configureServer(server) {
    server.middlewares.use('/gettext-converter.js', (_request, response) => {
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
      response.end(gettextBrowserBundle)
    })
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'gettext-converter.js',
      source: gettextBrowserBundle,
    })
  },
})

export default defineConfig({
  root: 'poc/po-parser-benchmark',
  plugins: [serveGettextBrowserBundle()],
  build: {
    outDir: '../../dist/po-parser-benchmark',
    emptyOutDir: true,
  },
})
