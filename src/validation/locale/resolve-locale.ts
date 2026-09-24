/**
 * PO Interpretation が公開したメタデータから、後続責務が利用するロケールを解決する責任を持つ。
 *
 * ロケール自体を判定できない状態だけを `unresolved` とし、
 * 対応するルールセットが存在するかどうかは判断しない。
 */

import type { PoMetadata } from '@/po/interpret-po'

/**
 * Locale Resolution が後続責務へ公開する結果を表す。
 *
 * ロケールを解決できた状態と、ロケール自体を特定できない状態を意味上区別する。
 */
export type LocaleResolutionResult =
  | {
      status: 'resolved'
      locale: string
    }
  | {
      status: 'unresolved'
    }

/**
 * PO メタデータから、Locale Rule Selection が利用するロケール識別子を解決する。
 *
 * WordPress の日本語ロケールとして扱うため、既知の表現である `ja_JP` だけを `ja` へ解決する。
 * その他の非空値は形式を検証・一般化せず、その値を保持して後続の対応可否判定へ渡す。
 *
 * @param metadata PO Interpretation が公開したメタデータ。
 * @returns 解決済みロケール、またはロケールを判定できない状態。
 */
export function resolveLocale(metadata: PoMetadata): LocaleResolutionResult {
  const language = metadata.language

  // ロケールを表す値が存在しない場合だけを判定不能とし、対応可否の判断とは分離する。
  if (language === undefined || language.trim() === '') {
    return { status: 'unresolved' }
  }

  // 日本語について合意済みの既知表現だけを統一し、他ロケールへ一般化した変換規則を適用しない。
  if (language === 'ja_JP') {
    return {
      status: 'resolved',
      locale: 'ja',
    }
  }

  return {
    status: 'resolved',
    locale: language,
  }
}
