/**
 * 1件の翻訳チェック指摘を、共有用 Markdown としてブラウザーのクリップボードへ渡す責任を持つ。
 *
 * Markdown の書式決定は出力責務へ委ね、この境界では Clipboard API の利用可否と書き込み結果だけを扱う。
 */

import type { Finding } from './presentation-model'
import { serializeFindingMarkdown } from './result-export'

/**
 * 対象の1指摘を既存の Finding 単位 Markdown 形式でクリップボードへコピーする。
 *
 * @param finding コピー対象の1指摘。
 * @returns コピーできた場合は `success`、Clipboard API を利用できない場合または書き込みに失敗した場合は `failure`。
 */
export async function copyFindingMarkdown(
  finding: Finding,
): Promise<'success' | 'failure'> {
  // Clipboard API を利用できない環境では、指摘表示を壊さず失敗結果だけを呼び出し側へ返す。
  if (navigator.clipboard?.writeText === undefined) {
    return 'failure'
  }

  try {
    await navigator.clipboard.writeText(serializeFindingMarkdown(finding))
    return 'success'
  } catch {
    return 'failure'
  }
}
