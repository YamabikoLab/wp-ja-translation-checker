/**
 * Vite のアプリケーション配信と、PO Interpretation が利用する parser の browser bundle 配信を構成する。
 *
 * gettext-converter の ESM 経路は browser 向けではない依存を含むため、公式 browser bundle を
 * 開発サーバーと production build の両方で同じ URL から提供する責任をこの境界が持つ。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const validationSourcePath = fileURLToPath(
  new URL('./src/validation', import.meta.url),
)
const gettextBrowserBundlePath = fileURLToPath(
  new URL('./node_modules/gettext-converter/gettext.min.js', import.meta.url),
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
  resolve: {
    alias: {
      '@': validationSourcePath,
    },
  },
  plugins: [react(), serveGettextBrowserBundle()],
})
