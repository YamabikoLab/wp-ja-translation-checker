/**
 * WordPress 日本語翻訳スタイルガイド v1 の確認入口と結果集約を所有する。
 *
 * 翻訳 entry 一覧へ日本語 v1 の個別ルールを適用し、Error / Warning を entry ごとにまとめる。
 * 問題のない entry は結果に含めず、同じ入力からは同じ順序の結果を返す。
 */

import type { TranslationEntry } from '@/po/interpret-po'
import {
  checkHalfWidthCharacters,
  checkInnerParenthesesSpacing,
  checkJapanesePunctuation,
  checkNotAllowedExpression,
  checkNumberSpacing,
  checkParenthesesSpacing,
  checkPeriodInsideParentheses,
  checkRecommendedExpressions,
  checkSentenceEndingParentheses,
  checkSorryPrefix,
  checkSpacingBetweenHalfAndFullWidth,
  checkViewExpression,
} from './rule-checks'
import type { CheckMessage } from './rule-checks'

/**
 * 1つの翻訳 entry で検出された Error / Warning を表す。
 */
export type TranslationCheckResult = {
  /** PO Interpretation が付与した対象 entry の識別位置。 */
  entryIndex: number
  /** 機械的に高い確度で問題と判断できる指摘。 */
  errors: readonly CheckMessage[]
  /** 文脈によって正しい可能性があり、人による確認が必要な指摘。 */
  warnings: readonly CheckMessage[]
}

/**
 * 日本語 v1 の各チェックをすべて実行する。
 *
 * @param entries PO Interpretation が生成した翻訳 entry 一覧。
 * @returns Error または Warning が存在する entry だけを含む確認結果。
 */
export function check(
  entries: readonly TranslationEntry[],
): readonly TranslationCheckResult[] {
  const results: TranslationCheckResult[] = []

  // 各 entry は独立して評価し、指摘が存在する entry だけを公開結果へ含める。
  for (const entry of entries) {
    const errors = [
      ...checkJapanesePunctuation(entry),
      ...checkHalfWidthCharacters(entry),
      ...checkSpacingBetweenHalfAndFullWidth(entry),
      ...checkParenthesesSpacing(entry),
      ...checkInnerParenthesesSpacing(entry),
      ...checkPeriodInsideParentheses(entry),
      ...checkSentenceEndingParentheses(entry),
      ...checkNumberSpacing(entry),
      ...checkRecommendedExpressions(entry),
    ]
    const warnings = [
      ...checkViewExpression(entry),
      ...checkNotAllowedExpression(entry),
      ...checkSorryPrefix(entry),
    ]

    // 問題のない entry は公開結果へ含めず、1件以上の指摘がある場合だけ結果を生成する。
    if (errors.length > 0 || warnings.length > 0) {
      results.push({
        entryIndex: entry.entryIndex,
        errors,
        warnings,
      })
    }
  }

  return results
}
