/**
 * Locale Resolution が PO メタデータからロケールを解決し、判定不能と区別できることを確認する。
 *
 * 既知の日本語表現だけを解決し、その他の値を先回りして検証・一般化しない責務境界をテスト対象とする。
 */

import { describe, expect, it } from 'vitest'
import { resolveLocale } from './resolve-locale'

describe('Locale Resolution', () => {
  /**
   * WordPress の日本語ロケールがそのまま渡された場合に、日本語ロケールとして解決できることを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `ja` である。
   *
   * 操作:
   * - ロケールを解決する。
   *
   * 期待結果:
   * - `resolved` として `ja` が返る。
   */
  it('when language is ja, should resolve it as ja', () => {
    expect(resolveLocale({ language: 'ja' })).toEqual({
      status: 'resolved',
      locale: 'ja',
    })
  })

  /**
   * GlotPress 由来で現れ得る日本語表現が渡された場合に、WordPress の日本語ロケールへ解決できることを確認する。
   *
   * 事前条件:
   * - PO メタデータの language が `ja_JP` である。
   *
   * 操作:
   * - ロケールを解決する。
   *
   * 期待結果:
   * - `resolved` として `ja` が返る。
   */
  it('when language is ja_JP, should resolve it as ja', () => {
    expect(resolveLocale({ language: 'ja_JP' })).toEqual({
      status: 'resolved',
      locale: 'ja',
    })
  })

  /**
   * 既知の日本語表現以外の非空値が渡された場合に、汎用的な正規化や形式検証を行わないことを確認する。
   *
   * 事前条件:
   * - language が地域付きロケール、別表記の日本語ロケール、またはロケール形式ではない非空値である。
   *
   * 操作:
   * - ロケールを解決する。
   *
   * 期待結果:
   * - 入力値が変更されず `resolved` として返る。
   */
  it.each(['de_DE', 'ja-JP', '???'])(
    'when language is outside the known mapping, should preserve it without generic locale validation',
    (language) => {
      expect(resolveLocale({ language })).toEqual({
        status: 'resolved',
        locale: language,
      })
    },
  )

  /**
   * language が存在しない場合に、ロケール判定不能として扱うことを確認する。
   *
   * 操作:
   * - language を持たないメタデータからロケールを解決する。
   *
   * 期待結果:
   * - `unresolved` が返る。
   */
  it('when language is missing, should return unresolved', () => {
    expect(resolveLocale({})).toEqual({ status: 'unresolved' })
  })

  /**
   * language に利用可能な値がない場合に、ロケール判定不能として扱うことを確認する。
   *
   * 事前条件:
   * - language が空文字列または空白だけである。
   *
   * 操作:
   * - ロケールを解決する。
   *
   * 期待結果:
   * - `unresolved` が返る。
   */
  it.each(['', '   '])(
    'when language has no usable locale value, should return unresolved',
    (language) => {
      expect(resolveLocale({ language })).toEqual({ status: 'unresolved' })
    },
  )
})
