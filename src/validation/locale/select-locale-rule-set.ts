/**
 * 解決済み locale に対応する rule set を選択する責任を持つ。
 *
 * locale の解析や正規化は行わず、v1 では `ja` への完全一致だけを日本語 rule set に対応付ける。
 */

import { japaneseRuleSet } from '../rules/ja/rule-set'
import type { RuleSet } from '../rules/rule-set'

/**
 * Locale Rule Selection が後続責務へ公開する結果を表す。
 *
 * 解決済み locale に対応する rule set が存在する状態と、未対応の状態を意味上区別する。
 */
export type LocaleRuleSelectionResult =
  | {
      status: 'supported'
      ruleSet: RuleSet
    }
  | {
      status: 'unsupported'
    }

/**
 * 解決済み locale に対応する rule set を選択する。
 *
 * v1 では `ja` だけを Japanese rule set へ完全一致で対応付け、その他の locale へ fallback しない。
 *
 * @param locale Locale Resolution が解決した locale identifier。
 * @returns 対応する rule set、または未対応状態。
 */
export function selectLocaleRuleSet(
  locale: string,
): LocaleRuleSelectionResult {
  if (locale === 'ja') {
    return {
      status: 'supported',
      ruleSet: japaneseRuleSet,
    }
  }

  return { status: 'unsupported' }
}
