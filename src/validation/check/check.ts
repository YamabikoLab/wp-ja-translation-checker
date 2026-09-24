/**
 * 1回の翻訳確認について、PO Interpretation、Locale Resolution、日本語 v1 Check を順に接続する責任を持つ。
 *
 * 正常完了と、入力解析不能・ロケール判定不能・未対応ロケールを意味上区別し、
 * Presentation が1つの公開入口から確認全体の結果を受け取れるようにする。
 */

import { resolveLocale } from '../locale/resolve-locale'
import { interpretPo } from '../po/interpret-po'
import type { TranslationEntry } from '../po/interpret-po'
import { check } from '../rules/ja/check'
import type { TranslationCheckResult } from '../rules/ja/check'

/**
 * Check Orchestration が Presentation へ返す1回の確認結果を表す。
 *
 * 正常完了では解釈済み entry と日本語チェック結果を返し、
 * 確認を正常完了できない状態は原因ごとの status で区別する。
 */
export type CheckResult =
  | {
      status: 'success'
      entries: readonly TranslationEntry[]
      results: readonly TranslationCheckResult[]
    }
  | {
      status: 'invalid-po'
    }
  | {
      status: 'unresolved-locale'
    }
  | {
      status: 'unsupported-locale'
      locale: string
    }

/**
 * PO 文字列を1回の確認要求として処理し、確認全体の結果を返す。
 *
 * @param source 確認対象となる PO ファイル内容の文字列。
 * @returns 正常完了、入力解析不能、ロケール判定不能、未対応ロケールのいずれかを表す結果。
 */
export function checkPo(source: string): CheckResult {
  const interpretation = interpretPo(source)

  // PO として確認可能な入力でない場合は、後続の責務を適用せず確認不能として終了する。
  if (interpretation.status === 'invalid-po') {
    return { status: 'invalid-po' }
  }

  const { document } = interpretation
  const localeResolution = resolveLocale(document.metadata)

  // 対象ロケールを判定できない場合は、日本語チェックを適用せず確認不能として終了する。
  if (localeResolution.status === 'unresolved') {
    return { status: 'unresolved-locale' }
  }

  // v1 で対応しないロケールには日本語ルールを代替適用せず、解決済みロケールをそのまま返す。
  if (localeResolution.locale !== 'ja') {
    return {
      status: 'unsupported-locale',
      locale: localeResolution.locale,
    }
  }

  return {
    status: 'success',
    entries: document.entries,
    results: check(document.entries),
  }
}
