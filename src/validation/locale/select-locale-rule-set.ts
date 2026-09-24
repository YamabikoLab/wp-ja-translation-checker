/**
 * 解決済みロケールに対応するルールセットを選択する責任を持つ。
 *
 * ロケールの解析や正規化は行わず、v1 では `ja` への完全一致だけを日本語ルールセットに対応付ける。
 */

import { japaneseRuleSet } from '../rules/ja/rule-set'
import type { RuleSet } from '../rules/rule-set'

/**
 * Locale Rule Selection が後続責務へ公開する結果を表す。
 *
 * 解決済みロケールに対応するルールセットが存在する状態と、未対応の状態を意味上区別する。
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
 * 解決済みロケールに対応するルールセットを選択する。
 *
 * v1 では `ja` だけを日本語ルールセットへ完全一致で対応付け、
 * その他のロケールへ日本語ルールセットを代替適用しない。
 *
 * @param locale Locale Resolution が解決したロケール識別子。
 * @returns 対応するルールセット、または未対応状態。
 */
export function selectLocaleRuleSet(locale: string): LocaleRuleSelectionResult {
  // v1 の対応ロケールは解決済みの `ja` だけとし、接頭辞一致や近似ロケールへの代替適用を行わない。
  if (locale === 'ja') {
    return {
      status: 'supported',
      ruleSet: japaneseRuleSet,
    }
  }

  return { status: 'unsupported' }
}
