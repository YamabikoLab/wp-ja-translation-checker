/**
 * Locale Rule Selection が解決済みロケールに対応するルールセットを選択し、未対応と区別できることを確認する。
 *
 * v1 の日本語完全一致だけを対応対象とし、接頭辞判定や代替適用を行わない責務境界をテスト対象とする。
 */

import { describe, expect, it } from 'vitest'
import { japaneseRuleSet } from '../rules/ja/rule-set'
import { selectLocaleRuleSet } from './select-locale-rule-set'

describe('Locale Rule Selection', () => {
  /**
   * 解決済み日本語ロケールが渡された場合に、日本語ルールセットを選択できることを確認する。
   *
   * 事前条件:
   * - ロケールが `ja` として解決済みである。
   *
   * 操作:
   * - ロケールに対応するルールセットを選択する。
   *
   * 期待結果:
   * - `supported` として日本語ルールセットが返る。
   * - 日本語ルールセットが空でも対応済みという意味は変わらない。
   */
  it('when locale is ja, should return the Japanese rule set as supported', () => {
    expect(japaneseRuleSet).toEqual([])
    expect(selectLocaleRuleSet('ja')).toEqual({
      status: 'supported',
      ruleSet: japaneseRuleSet,
    })
  })

  /**
   * 日本語以外の解決済みロケールが渡された場合に、未対応として扱うことを確認する。
   *
   * 事前条件:
   * - ロケールは判定済みだが v1 の対応対象ではない。
   *
   * 操作:
   * - ロケールに対応するルールセットを選択する。
   *
   * 期待結果:
   * - `unsupported` が返り、日本語ルールセットは返らない。
   */
  it.each(['de_DE', 'pt_BR', 'fr'])(
    'when locale is not ja, should return unsupported without a fallback rule set',
    (locale) => {
      expect(selectLocaleRuleSet(locale)).toEqual({ status: 'unsupported' })
    },
  )

  /**
   * 日本語に似たロケールが渡された場合に、接頭辞一致で日本語ルールセットを選択しないことを確認する。
   *
   * 事前条件:
   * - Locale Resolution の既知の解決を経ていない `ja_JP` が直接渡される。
   *
   * 操作:
   * - ロケールに対応するルールセットを選択する。
   *
   * 期待結果:
   * - 完全一致ではないため `unsupported` が返る。
   */
  it('when locale only shares the ja prefix, should not select the Japanese rule set', () => {
    expect(selectLocaleRuleSet('ja_JP')).toEqual({ status: 'unsupported' })
  })
})
