/**
 * 確認結果を CSV / JSON / Markdown へ変換する出力仕様を確認する。
 */

import { describe, expect, it } from 'vitest'
import type { Finding } from './presentation-model'
import { serializeCsv, serializeJson, serializeMarkdown } from './result-export'

/**
 * 出力テスト用の1指摘を生成する。
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
    styleGuideItem: overrides.styleGuideItem ?? '1-1',
    message: overrides.message ?? '句読点を確認してください。',
    matches: overrides.matches ?? [{ start: 5, end: 6 }],
    entry: {
      entryIndex: 0,
      source: {
        singular: overrides.source ?? 'Hello, world',
      },
      translations: [
        {
          index: 0,
          text: overrides.translation ?? 'こんにちは, 世界',
        },
      ],
    },
  }
}

describe('CSV result export', () => {
  /**
   * 事前条件:
   * - Error と Warning の指摘がある。
   *
   * 操作:
   * - CSV へ変換する。
   *
   * 期待結果:
   * - UTF-8 BOM とヘッダーを持ち、1指摘が1行として元の順序で出力される。
   */
  it('when findings contain errors and warnings, should export each finding as one CSV row in result order', () => {
    const csv = serializeCsv([
      createFinding(),
      createFinding({
        key: '1-warning-0',
        severity: 'Warning',
        styleGuideItem: '3-4',
        message: '文脈を確認してください。',
      }),
    ])

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'severity,styleGuideItem,message,source,translation',
      'Error,1-1,句読点を確認してください。,"Hello, world","こんにちは, 世界"',
      'Warning,3-4,文脈を確認してください。,"Hello, world","こんにちは, 世界"',
    ])
  })

  /**
   * 事前条件:
   * - 出力値にカンマ、引用符、改行が含まれる。
   *
   * 操作:
   * - CSV へ変換する。
   *
   * 期待結果:
   * - 対象フィールドを引用符で囲み、内部の引用符を二重化する。
   */
  it('when CSV fields contain delimiters, quotes, or line breaks, should apply standard CSV escaping', () => {
    const csv = serializeCsv([
      createFinding({
        message: '「a,b」と "c" を確認\nしてください。',
        source: 'Save "all", now',
        translation: 'すべてを\n保存',
      }),
    ])

    expect(csv).toContain(
      '"「a,b」と ""c"" を確認\nしてください。","Save ""all"", now","すべてを\n保存"',
    )
  })

  /**
   * 事前条件:
   * - 正常完了した結果に指摘がない。
   *
   * 操作:
   * - CSV へ変換する。
   *
   * 期待結果:
   * - UTF-8 BOM とヘッダーだけを出力する。
   */
  it('when successful result has no findings, should export only the CSV header', () => {
    expect(serializeCsv([])).toBe(
      '\uFEFFseverity,styleGuideItem,message,source,translation',
    )
  })
})

describe('JSON result export', () => {
  /**
   * 事前条件:
   * - Error と Warning が混在している。
   *
   * 操作:
   * - JSON へ変換する。
   *
   * 期待結果:
   * - ファイル名、Severity ごとの件数、全指摘の主要情報を出力する。
   */
  it('when findings are mixed, should export file summary and all findings', () => {
    const json = JSON.parse(
      serializeJson('plugin-ja.po', [
        createFinding(),
        createFinding({
          key: '1-warning-0',
          severity: 'Warning',
          styleGuideItem: '3-4',
        }),
      ]),
    )

    expect(json).toEqual({
      file: 'plugin-ja.po',
      summary: {
        errors: 1,
        warnings: 1,
      },
      findings: [
        {
          severity: 'error',
          styleGuideItem: '1-1',
          message: '句読点を確認してください。',
          source: 'Hello, world',
          translation: 'こんにちは, 世界',
          matches: [{ start: 5, end: 6 }],
        },
        {
          severity: 'warning',
          styleGuideItem: '3-4',
          message: '句読点を確認してください。',
          source: 'Hello, world',
          translation: 'こんにちは, 世界',
          matches: [{ start: 5, end: 6 }],
        },
      ],
    })
  })

  /**
   * 事前条件:
   * - 正常完了した結果に指摘がない。
   *
   * 操作:
   * - JSON へ変換する。
   *
   * 期待結果:
   * - Error / Warning が0で findings が空の正常結果を出力する。
   */
  it('when successful result has no findings, should export zero summary and empty findings', () => {
    expect(JSON.parse(serializeJson('clean.po', []))).toEqual({
      file: 'clean.po',
      summary: {
        errors: 0,
        warnings: 0,
      },
      findings: [],
    })
  })
})

describe('Markdown result export', () => {
  /**
   * 事前条件:
   * - 同じ entry に複数の CheckMessage に相当する指摘がある。
   *
   * 操作:
   * - Markdown へ変換する。
   *
   * 期待結果:
   * - 各指摘を独立して出力し、共通する原文・翻訳をそれぞれに含める。
   */
  it('when one entry has multiple findings, should export each finding with its source and translation', () => {
    const markdown = serializeMarkdown('plugin-ja.po', [
      createFinding(),
      createFinding({
        key: '0-error-1',
        styleGuideItem: '1-4',
        message: 'スペースを確認してください。',
      }),
    ])

    expect(markdown).toContain('- Error: 2')
    expect(markdown).toContain('- Warning: 0')
    expect(markdown).toContain('### Error: 1-1')
    expect(markdown).toContain('### Error: 1-4')
    expect(markdown.match(/Hello, world/g)).toHaveLength(2)
    expect(markdown.match(/こんにちは, 世界/g)).toHaveLength(2)
  })

  /**
   * 複数の一致箇所を Markdown だけで強調することを確認する。
   *
   * 事前条件:
   * - 1つの指摘に複数の一致範囲がある。
   *
   * 操作:
   * - Markdown / CSV / JSON へ変換する。
   *
   * 期待結果:
   * - Markdown の翻訳だけが太字になり、CSV / JSON の翻訳文字列は元のままとなる。
   */
  it('when one finding has multiple matches, should decorate only the Markdown translation', () => {
    const finding = createFinding({
      translation: '全て保存して全て確認',
      matches: [
        { start: 0, end: 2 },
        { start: 6, end: 8 },
      ],
    })

    expect(serializeMarkdown('plugin-ja.po', [finding])).toContain(
      '**全て**保存して**全て**確認',
    )
    expect(serializeCsv([finding])).toContain('全て保存して全て確認')
    expect(
      JSON.parse(serializeJson('plugin-ja.po', [finding])).findings[0],
    ).toMatchObject({
      translation: '全て保存して全て確認',
      matches: [
        { start: 0, end: 2 },
        { start: 7, end: 9 },
      ],
    })
  })

  /**
   * 事前条件:
   * - 正常完了した結果に指摘がない。
   *
   * 操作:
   * - Markdown へ変換する。
   *
   * 期待結果:
   * - 正常完了と指摘なしを示し、翻訳全体の正しさを保証する表現は使用しない。
   */
  it('when successful result has no findings, should state that v1 target rules found no findings', () => {
    const markdown = serializeMarkdown('clean.po', [])

    expect(markdown).toContain('- Error: 0')
    expect(markdown).toContain('- Warning: 0')
    expect(markdown).toContain(
      '正常に確認が完了し、v1 の対象ルールでは指摘がありませんでした。',
    )
  })
})
