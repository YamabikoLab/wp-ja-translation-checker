/**
 * ルールセットが、ルールの適用順を保持する読み取り専用の集合として公開されることを確認する。
 *
 * 個別ルールの評価契約には踏み込まず、Locale Rule Selection と Rule Evaluation の間で共有する
 * 最小の型契約だけをテスト対象とする。
 */

import { expectTypeOf, it } from 'vitest'
import type { Rule, RuleSet } from './rule-set'

/**
 * ルールセットの公開契約が、順序を持つ読み取り専用配列であることを確認する。
 *
 * 事前条件:
 * - Locale Rule Selection と Rule Evaluation は、同じルール順を共有する必要がある。
 *
 * 操作:
 * - `RuleSet` の型契約を確認する。
 *
 * 期待結果:
 * - `Rule` の読み取り専用配列として表現される。
 * - 空集合を含む任意件数のルールを表現できる。
 */
it('when a rule set is exposed, should represent an ordered readonly collection of rules', () => {
  expectTypeOf<RuleSet>().toEqualTypeOf<readonly Rule[]>()
})
