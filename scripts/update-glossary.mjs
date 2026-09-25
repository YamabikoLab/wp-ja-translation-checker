#!/usr/bin/env node
/**
 * WordPress.org 日本語 Glossary の HTML を取得し、製品同梱用 TypeScript データを生成する。
 *
 * 製品実行経路から外れた開発者向けメンテナンス処理であり、取得失敗や HTML 構造変更時は
 * 既存データを書き換えず終了する。
 */

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const GLOSSARY_URL =
  'https://translate.wordpress.org/locale/ja/default/glossary/'
const OUTPUT_URL = new URL(
  '../src/validation/glossary/ja/glossary-data.ts',
  import.meta.url,
)

const decodeHtml = (text) =>
  text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) =>
      String.fromCodePoint(Number.parseInt(value, 16)),
    )
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replace(/\s+/g, ' ')
    .trim()

const parseGlossary = (page) => {
  const table = page.match(/<table[^>]*id=["']glossary["'][\s\S]*?<\/table>/i)?.[0]
  if (table === undefined) return []

  const entries = []
  for (const row of table.matchAll(
    /<tr[^>]*class=["'][^"']*\bview\b[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi,
  )) {
    const cells = Array.from(
      row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
      (match) => decodeHtml(match[1]),
    )
    if (cells.length < 4) continue

    const [original, partOfSpeech, translation, comment] = cells
    entries.push({
      original,
      translation,
      ...(partOfSpeech === '' ? {} : { partOfSpeech }),
      ...(comment === '' ? {} : { comment }),
    })
  }
  return entries
}

const render = (entries) => `/**
 * WordPress.org 日本語 Glossary の静的スナップショットを保持する。
 *
 * ブラウザー実行時の外部通信を避けるため、開発者が \`npm run glossary:update\` を実行したときだけ
 * 公式 Glossary から再生成し、製品コードはこの確定済みデータだけを参照する。
 */

import type { GlossaryEntry } from './glossary'

/** WordPress.org 日本語 Glossary から生成した検証用データ。 */
export const JAPANESE_GLOSSARY: readonly GlossaryEntry[] = ${JSON.stringify(entries, null, 2)}
`

const response = await fetch(GLOSSARY_URL, {
  headers: {
    'user-agent':
      'wp-translation-checker glossary updater (+https://github.com/YamabikoLab/wp-translation-checker)',
  },
})
if (!response.ok) {
  throw new Error(`Glossary の取得に失敗しました: HTTP ${response.status}`)
}

const entries = parseGlossary(await response.text())
if (entries.length === 0) {
  throw new Error(
    'Glossary entry を取得できませんでした。公式ページの HTML 構造を確認してください。',
  )
}

await writeFile(fileURLToPath(OUTPUT_URL), render(entries), 'utf8')
console.log(`Glossary を ${entries.length} 件更新しました。`)
