/**
 * Locale Resolution が PO メタデータから locale を解決し、判定不能と区別できることを確認する。
 *
 * v1 の既知の日本語対応だけを正規化し、その他の locale を先回りして一般化しないことをテスト対象とする。
 */

import { describe, expect, it } from 'vitest'
import { resolveLocale } from './resolve-locale'

describe('Locale Resolution', () => {
  /**
   * WordPress の日本語 locale がそのまま渡された場合に、日本語 locale として解決できることを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `ja` である。
   *
   * 操作:
   * - locale を解決する。
   *
   * 期待結果:
   * - resolved として `ja` が返る。
   */
  it('when language is ja, should resolve it as ja', () => {
    expect(resolveLocale({ language: 'ja' })).toEqual({
      status: 'resolved',
      locale: 'ja',
    })
  })

  /**
   * GlotPress 由来で現れ得る日本語 locale が渡された場合に、WordPress の日本語 locale へ解決できることを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `ja_JP` である。
   *
   * 操作:
   * - locale を解決する。
   *
   * 期待結果:
   * - resolved として `ja` が返る。
   */
  it('when language is ja_JP, should resolve it as ja', () => {
    expect(resolveLocale({ language: 'ja_JP' })).toEqual({
      status: 'resolved',
      locale: 'ja',
    })
  })

  /**
   * 日本語以外の地域付き locale が渡された場合に、language-only へ縮約しないことを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `de_DE` である。
   *
   * 操作:
   * - locale を解決する。
   *
   * 期待結果:
   * - `de_DE` のまま resolved として返る。
   */
  it('when language is a non-ja regional locale, should preserve the locale value', () => {
    expect(resolveLocale({ language: 'de_DE' })).toEqual({
      status: 'resolved',
      locale: 'de_DE',
    })
  })

  /**
   * 日本語以外の非空 locale が渡された場合に、Locale Resolution 側で unsupported と判断しないことを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `fr` である。
   *
   * 操作:
   * - locale を解決する。
   *
   * 期待結果:
   * - `fr` のまま resolved として返る。
   */
  it('when language is another non-empty locale, should resolve it without checking support', () => {
    expect(resolveLocale({ language: 'fr' })).toEqual({
      status: 'resolved',
      locale: 'fr',
    })
  })

  /**
   * language が存在しない場合に、locale 判定不能として扱うことを確認する。
   *
   * 操作:
   * - language を持たないメタデータから locale を解決する。
   *
   * 期待結果:
   * - unresolved が返る。
   */
  it('when language is missing, should return unresolved', () => {
    expect(resolveLocale({})).toEqual({ status: 'unresolved' })
  })

  /**
   * language に利用可能な値がない場合に、locale 判定不能として扱うことを確認する。
   *
   * 事前条件:
   * - language が空文字列または空白だけである。
   *
   * 操作:
   * - locale を解決する。
   *
   * 期待結果:
   * - unresolved が返る。
   */
  it.each(['', '   '])(
    'when language has no usable locale value, should return unresolved',
    (language) => {
      expect(resolveLocale({ language })).toEqual({ status: 'unresolved' })
    },
  )
})
