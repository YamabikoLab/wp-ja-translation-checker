/**
 * 1件の指摘表示に、個別 Markdown コピー操作が利用者向けに提供されることを確認する。
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Finding } from './presentation-model'
import { FindingCard } from './FindingCard'

/**
 * 指摘カード表示テスト用の Finding を生成する。
 *
 * @param severity 表示する Severity。
 * @returns 指摘カードが利用する Finding と同じ形のテストデータ。
 */
function createFinding(severity: 'Error' | 'Warning'): Finding {
  return {
    key: `0-${severity.toLowerCase()}-0`,
    severity,
    styleGuideItem: '1-9 半角数字前後の不要スペース',
    message: '半角数字と日本語の間のスペースは削除してください。',
    matches: [{ start: 2, end: 5 }],
    entry: {
      entryIndex: 0,
      source: {
        singular: 'Item 1',
      },
      translations: [
        {
          index: 0,
          text: '項目 1',
        },
      ],
    },
  }
}

describe('FindingCard Markdown copy action', () => {
  /**
   * 事前条件:
   * - Error / Warning の指摘カードを表示する。
   *
   * 操作:
   * - 指摘カードを描画する。
   *
   * 期待結果:
   * - Severity に関係なく、1件単位の「Markdownをコピー」ボタンが表示される。
   */
  it.each(['Error', 'Warning'] as const)(
    'when a %s finding is rendered, should show its Markdown copy button',
    (severity) => {
      const markup = renderToStaticMarkup(
        <FindingCard finding={createFinding(severity)} />,
      )

      expect(markup).toContain('Markdownをコピー')
      expect(markup).toContain('<button')
    },
  )
})
