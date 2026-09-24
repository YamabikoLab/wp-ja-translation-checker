/**
 * WordPress 日本語ロケールに適用するルールセットの登録点を所有する。
 *
 * 日本語固有の各ルールはこの責務で順序付けて構成し、
 * Locale Rule Selection には個別ルールの条件や説明を持ち込まない。
 */

import type { RuleSet } from '../rule-set'

/**
 * WordPress 日本語ロケールに適用する、読み取り専用の順序付きルール集合。
 *
 * ルール本体が未登録の状態でも、日本語ロケールに対応するルールセットの存在を表せるため空集合を許容する。
 */
export const japaneseRuleSet: RuleSet = []
