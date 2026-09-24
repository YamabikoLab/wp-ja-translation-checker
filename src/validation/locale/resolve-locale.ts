/**
 * PO Interpretation が公開したメタデータから、後続責務が利用する locale を解決する責任を持つ。
 *
 * locale 自体を判定できない状態だけを unresolved とし、rule set の対応有無は判断しない。
 */

import type { PoMetadata } from '../po/interpret-po'

/**
 * Locale Resolution が後続責務へ公開する結果を表す。
 *
 * locale を解決できた状態と、locale 自体を特定できない状態を意味上区別する。
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
 * PO メタデータから、Locale Rule Selection が利用する locale identifier を解決する。
 *
 * v1 では WordPress の日本語 locale として扱うために `ja_JP` を `ja` へ解決する。
 * その他の非空 locale は形式を一般化せず、その値を保持して後続の対応可否判定へ渡す。
 *
 * @param metadata PO Interpretation が公開したメタデータ。
 * @returns 解決済み locale、または locale を判定できない状態。
 */
export function resolveLocale(metadata: PoMetadata): LocaleResolutionResult {
  const language = metadata.language

  if (language === undefined || language.trim() === '') {
    return { status: 'unresolved' }
  }

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
