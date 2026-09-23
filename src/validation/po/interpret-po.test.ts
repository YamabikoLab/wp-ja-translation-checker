/**
 * PO Interpretation の公開境界が、parser 固有表現を漏らさず Validation Core 用の意味データを返すことを確認する。
 *
 * production で採用する gettext-converter を直接利用し、parser の test double は使用しない。
 */

import po2js from 'gettext-converter/po2js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { interpretPo } from './interpret-po'

const originalGettext = (
  globalThis as typeof globalThis & {
    gettext?: { po2js: (source: string) => unknown }
  }
).gettext

beforeAll(() => {
  ;(
    globalThis as typeof globalThis & {
      gettext?: { po2js: (source: string) => unknown }
    }
  ).gettext = { po2js }
})

afterAll(() => {
  const target = globalThis as typeof globalThis & {
    gettext?: { po2js: (source: string) => unknown }
  }

  if (originalGettext === undefined) {
    delete target.gettext
  } else {
    target.gettext = originalGettext
  }
})

describe('interpretPo', () => {
  /**
   * 正常な PO を解釈した場合に、locale 判定と Rule Evaluation に必要な意味データだけを返すことを確認する。
   *
   * 事前条件:
   * - Language header と singular entry を持つ正常な PO がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - Language の値、原文、翻訳、entry identity が正規化される。
   */
  it('when a valid singular PO is interpreted, should expose normalized metadata and entry data', () => {
    const source = `msgid ""
msgstr ""
"Language: ja_JP\\n"

msgid "Hello"
msgstr "こんにちは"
`

    expect(interpretPo(source)).toEqual({
      status: 'success',
      document: {
        metadata: { language: 'ja_JP' },
        entries: [
          {
            entryIndex: 0,
            source: { singular: 'Hello' },
            translations: [{ index: 0, text: 'こんにちは' }],
          },
        ],
      },
    })
  })

  /**
   * plural entry を解釈した場合に、原文の singular / plural と元の form index を保持することを確認する。
   *
   * 事前条件:
   * - 一部の plural form だけが翻訳済みの PO entry がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - 空 form は除外され、残る form は元の msgstr[n] の index を保持する。
   */
  it('when a plural entry has an empty form, should preserve source plural meaning and original form indexes', () => {
    const source = `msgid ""
msgstr ""
"Language: ja\\n"

msgid "One file"
msgid_plural "Many files"
msgstr[0] ""
msgstr[1] "複数のファイル"
`

    const result = interpretPo(source)

    expect(result).toEqual({
      status: 'success',
      document: {
        metadata: { language: 'ja' },
        entries: [
          {
            entryIndex: 0,
            source: {
              singular: 'One file',
              plural: 'Many files',
            },
            translations: [{ index: 1, text: '複数のファイル' }],
          },
        ],
      },
    })
  })

  /**
   * 未翻訳 entry を解釈した場合に、Rule Evaluation の対象へ流さないことを確認する。
   *
   * 事前条件:
   * - translation が厳密な空文字列の entry だけを持つ正常な PO がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - PO 自体は success で、validation entry は空になる。
   */
  it('when all translation forms are empty strings, should return success with no validation entries', () => {
    const source = `msgid ""
msgstr ""

msgid "Hello"
msgstr ""
`

    expect(interpretPo(source)).toEqual({
      status: 'success',
      document: {
        metadata: {},
        entries: [],
      },
    })
  })

  /**
   * whitespace-only translation を解釈した場合に、未翻訳として除外しないことを確認する。
   *
   * 事前条件:
   * - 半角空白だけを内容とする translation がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - 空白は変更されず validation 対象として保持される。
   */
  it('when a translation contains only whitespace, should preserve it as a validation target', () => {
    const source = `msgid ""
msgstr ""

msgid "Hello"
msgstr " "
`

    const result = interpretPo(source)

    expect(result).toEqual({
      status: 'success',
      document: {
        metadata: {},
        entries: [
          {
            entryIndex: 0,
            source: { singular: 'Hello' },
            translations: [{ index: 0, text: ' ' }],
          },
        ],
      },
    })
  })

  /**
   * parser が復元した論理文字列を解釈した場合に、Validation Core 側で追加の文字列正規化を行わないことを確認する。
   *
   * 事前条件:
   * - 前後空白、連続空白、改行を含む翻訳がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - parser が返す論理文字列がそのまま保持される。
   */
  it('when logical strings contain significant whitespace, should preserve the parser result without normalization', () => {
    const source = `msgid ""
msgstr ""

msgid "Source"
msgstr ""
"  前半  \\n"
"後半 "
`

    const result = interpretPo(source)

    expect(result.status).toBe('success')
    if (result.status !== 'success') {
      throw new Error('正常な PO が解析不能として扱われました。')
    }

    expect(result.document.entries[0]?.translations[0]?.text).toBe(
      '  前半  \n後半 ',
    )
  })

  /**
   * context が異なる同一内容の entry を解釈した場合に、別 entry identity を維持することを確認する。
   *
   * 事前条件:
   * - msgctxt だけが異なり、原文と翻訳が同じ2 entry がある。
   *
   * 操作:
   * - PO 文字列を解釈する。
   *
   * 期待結果:
   * - 値が同じでも統合されず、別の entryIndex を持つ。
   */
  it('when equal source and translation values belong to different contexts, should keep separate entry identities', () => {
    const source = `msgid ""
msgstr ""

msgctxt "button"
msgid "Open"
msgstr "開く"

msgctxt "menu"
msgid "Open"
msgstr "開く"
`

    const result = interpretPo(source)

    expect(result.status).toBe('success')
    if (result.status !== 'success') {
      throw new Error('正常な PO が解析不能として扱われました。')
    }

    expect(result.document.entries).toEqual([
      {
        entryIndex: 0,
        source: { singular: 'Open' },
        translations: [{ index: 0, text: '開く' }],
      },
      {
        entryIndex: 1,
        source: { singular: 'Open' },
        translations: [{ index: 0, text: '開く' }],
      },
    ])
  })

  /**
   * 同じ PO を繰り返し解釈した場合に、interpreted entry order と identity が安定することを確認する。
   *
   * 操作:
   * - 同じ入力を2回解釈する。
   *
   * 期待結果:
   * - 正規化結果が完全に一致する。
   */
  it('when the same PO is interpreted repeatedly, should produce deterministic entry order and indexes', () => {
    const source = `msgid ""
msgstr ""

msgid "A"
msgstr "甲"

msgid "B"
msgstr "乙"
`

    expect(interpretPo(source)).toEqual(interpretPo(source))
  })

  /**
   * malformed PO を解釈した場合に、正常な空 entry 集合と区別することを確認する。
   *
   * 事前条件:
   * - gettext の key として成立しない入力がある。
   *
   * 操作:
   * - malformed input を解釈する。
   *
   * 期待結果:
   * - invalid-po を返す。
   */
  it('when malformed PO is interpreted, should return invalid-po', () => {
    expect(
      interpretPo(`msgidx "broken"
msgstr "壊れた"`),
    ).toEqual({ status: 'invalid-po' })
  })

  /**
   * PO Interpretation の実装・構成異常がある場合に、入力不正として扱わないことを確認する。
   *
   * 事前条件:
   * - parser browser bundle が利用できない。
   *
   * 操作:
   * - 正常な PO を解釈する。
   *
   * 期待結果:
   * - invalid-po へ変換せず、構成異常として例外になる。
   */
  it('when the parser browser bundle is unavailable, should not convert the configuration error to invalid-po', () => {
    const target = globalThis as typeof globalThis & {
      gettext?: { po2js: (source: string) => unknown }
    }
    const current = target.gettext
    delete target.gettext

    try {
      expect(() =>
        interpretPo(`msgid ""
msgstr ""`),
      ).toThrow('gettext-converter の browser bundle を読み込めませんでした。')
    } finally {
      target.gettext = current
    }
  })

  /**
   * 入力文字列を解釈した場合に、呼び出し元が保持する文字列内容を変更しないことを確認する。
   *
   * 操作:
   * - 入力値を保存した上で解釈する。
   *
   * 期待結果:
   * - 解釈前後で入力値が一致する。
   */
  it('when PO source is interpreted, should not change the input string', () => {
    const source = `msgid ""
msgstr ""

msgid "Hello"
msgstr "こんにちは"
`
    const original = source

    interpretPo(source)

    expect(source).toBe(original)
  })
})
