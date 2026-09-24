/**
 * WordPress 日本語 locale に適用する rule set の登録点を所有する。
 *
 * Phase 3 では選択経路だけを成立させ、日本語固有の判定ルールは後続フェーズでこの配列へ追加する。
 */

import type { RuleSet } from '../rule-set'

/**
 * WordPress 日本語 locale に適用する、順序付きのルール集合。
 *
 * Phase 3 ではルール本体をまだ実装しないため空配列を許容する。
 */
export const japaneseRuleSet: RuleSet = []
