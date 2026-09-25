/**
 * 1件単位の Markdown コピーが、対象指摘の内容と Clipboard API の結果を正しく結び付けることを確認する。
 *
 * Vitest の Node 環境にはブラウザーの Clipboard API がないため、この外部境界だけをテストダブルで置き換える。
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Finding } from './presentation-model'
import { copyFindingMarkdown } from './finding-markdown-copy'

/**
 * コピー操作テスト用の Finding を生成する。
 *
 * @param overrides 指摘ごとに差し替える値。
 * @returns Presentation が利用する Finding と同じ形のテストデータ。
 */
function createFinding(
  overrides: Partial<{
    key: string
    severity: 'Error' | 'Warning'
    styleGuideItem: string
    message: string
    source: string
    translation: string
    matches: Finding['matches']
  }> = {},
): Finding {
  return {
    key: overrides.key ?? '0-error-0',
    severity: overrides.severity ?? 'Error',
    styleGuideItem:
      overrides.styleGuideItem ?? '1-9 半角数字前後の不要スペース',
    message:
      overrides.message ?? '半角数字と日本語の間のスペースは削除してください。',
    matches: overrides.matches ?? [{ start: 2, end: 4 }],
    entry: {
      entryIndex: 0,
      source: {
        singular: overrides.source ?? 'Item 1',
      },
      translations: [
        {
          index: 0,
          text: overrides.translation ?? '項目 1',
        },
      ],
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('finding Markdown copy', () => {
  /**
   * 事前条件:
   * - Clipboard API が利用できる。
   * - コピー対象の指摘に NG 箇所がある。
   *
   * 操作:
   * - 1件の指摘をコピーする。
   *
   * 期待結果:
   * - 対象 Finding の Markdown が Clipboard API へ渡され、成功結果を返す。
   */
  it('when clipboard write succeeds, should copy the target finding Markdown and return success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const finding = createFinding()

    await expect(copyFindingMarkdown(finding)).resolves.toBe('success')
    expect(writeText).toHaveBeenCalledWith(
      [
        '### Error: 1-9 半角数字前後の不要スペース',
        '',
        '半角数字と日本語の間のスペースは削除してください。',
        '',
        '**原文**',
        '',
        'Item 1',
        '',
        '**翻訳**',
        '',
        '項目 **1**',
      ].join('\n'),
    )
  })

  /**
   * 事前条件:
   * - 異なる2件の指摘がある。
   *
   * 操作:
   * - それぞれを順番にコピーする。
   *
   * 期待結果:
   * - 各操作ではその対象 Finding の内容だけが Clipboard API へ渡される。
   */
  it('when different findings are copied, should keep each copied Markdown independent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const first = createFinding()
    const second = createFinding({
      key: '1-warning-0',
      severity: 'Warning',
      styleGuideItem: '3-4 「Sorry, ...」の Sorry を訳さない',
      message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
      source: 'Sorry, your order was unsuccessful',
      translation: '申し訳ございませんが、ご注文は失敗しました',
      matches: [{ start: 0, end: 9 }],
    })

    await copyFindingMarkdown(first)
    await copyFindingMarkdown(second)

    expect(writeText).toHaveBeenCalledTimes(2)
    expect(writeText.mock.calls[0]?.[0]).toContain(
      '### Error: 1-9 半角数字前後の不要スペース',
    )
    expect(writeText.mock.calls[1]?.[0]).toContain(
      '### Warning: 3-4 「Sorry, ...」の Sorry を訳さない',
    )
    expect(writeText.mock.calls[1]?.[0]).not.toContain(
      '1-9 半角数字前後の不要スペース',
    )
  })

  /**
   * 事前条件:
   * - Clipboard API を利用できない環境である。
   *
   * 操作:
   * - 1件の指摘をコピーする。
   *
   * 期待結果:
   * - 例外を発生させず、失敗結果を返す。
   */
  it('when clipboard API is unavailable, should return failure without throwing', async () => {
    vi.stubGlobal('navigator', {})

    await expect(copyFindingMarkdown(createFinding())).resolves.toBe('failure')
  })

  /**
   * 事前条件:
   * - Clipboard API の書き込みが失敗する。
   *
   * 操作:
   * - 1件の指摘をコピーする。
   *
   * 期待結果:
   * - 例外を外へ漏らさず、失敗結果を返す。
   */
  it('when clipboard write fails, should return failure without throwing', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyFindingMarkdown(createFinding())).resolves.toBe('failure')
  })
})
