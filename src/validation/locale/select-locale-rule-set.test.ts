/**
 * Locale Rule Selection が解決済み locale に対応する rule set を選択し、未対応と区別できることを確認する。
 *
 * v1 の日本語完全一致だけを対応対象とし、prefix 判定や fallback を行わないことをテスト対象とする。
 */

import { describe, expect, it } from 'vitest'
import { japaneseRuleSet } from '../rules/ja/rule-set'
import { selectLocaleRuleSet } from './select-locale-rule-set'

describe('Locale Rule Selection', () => {
  /**
   * 解決済み日本語 locale が渡された場合に、日本語 rule set を選択できることを確認する。
   *
   * 事前条件:
   * - locale が `ja` として解決済みである。
   *
   * 操作:
   * - locale に対応する rule set を選択する。
   *
   * 期待結果:
   * - supported として Japanese rule set が返る。
   * - Phase 3 で Japanese rule set が空でも supported の意味は変わらない。
   */
  it('when locale is ja, should return the Japanese rule set as supported', () => {
    expect(japaneseRuleSet).toEqual([])
    expect(selectLocaleRuleSet('ja')).toEqual({
      status: 'supported',
      ruleSet: japaneseRuleSet,
    })
  })

  /**
   * 日本語以外の解決済み locale が渡された場合に、未対応として扱うことを確認する。
   *
   * 事前条件:
   * - locale は判定済みだが v1 の対応対象ではない。
   *
   * 操作:
   * - locale に対応する rule set を選択する。
   *
   * 期待結果:
   * - unsupported が返り、Japanese rule set は返らない。
   */
  it.each(['de_DE', 'pt_BR', 'fr'])(
    'when locale is not ja, should return unsupported without a fallback rule set',
    (locale) => {
      expect(selectLocaleRuleSet(locale)).toEqual({ status: 'unsupported' })
    },
  )

  /**
   * 日本語に似た locale が渡された場合に、prefix 判定で日本語 rule set を選択しないことを確認する。
   *
   * 事前条件:
   * - Locale Resolution の既知の正規化を経ていない `ja_JP` が直接渡される。
   *
   * 操作:
   * - locale に対応する rule set を選択する。
   *
   * 期待結果:
   * - 完全一致ではないため unsupported が返る。
   */
  it('when locale only shares the ja prefix, should not select the Japanese rule set', () => {
    expect(selectLocaleRuleSet('ja_JP')).toEqual({ status: 'unsupported' })
  })

  /**
   * 同じ日本語 locale を繰り返し選択した場合に、同じ順序付き rule set を返すことを確認する。
   *
   * 操作:
   * - `ja` の rule set を複数回選択する。
   *
   * 期待結果:
   * - いずれも同じ Japanese rule set 登録点を返す。
   */
  it('when ja is selected repeatedly, should return the same deterministic rule set', () => {
    const first = selectLocaleRuleSet('ja')
    const second = selectLocaleRuleSet('ja')

    expect(first).toEqual({
      status: 'supported',
      ruleSet: japaneseRuleSet,
    })
    expect(second).toEqual(first)
  })
})
