/**
 * Locale Rule Selection と後続の Rule Evaluation の間で受け渡す、ルール集合の最小契約を定義する。
 *
 * Phase 3 ではルール集合が順序付き readonly collection であることだけを確定し、
 * 個別 Rule の評価契約は実際の日本語ルールを実装する段階で必要になった範囲を定義する。
 */

/**
 * RuleSet に含まれる個別ルールを表す暫定的な型境界。
 *
 * Phase 3 では個別ルールの具体的な入力や評価操作を確定しない。
 */
export type Rule = unknown

/**
 * Rule Evaluation が rule set order を保持して利用する、順序付きの readonly collection を表す。
 */
export type RuleSet = readonly Rule[]
