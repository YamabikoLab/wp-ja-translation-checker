/**
 * 正常完了した確認結果を、共有・保存用の CSV / JSON / Markdown 文字列へ変換する責任を持つ。
 *
 * Presentation が確定済みの指摘と entry の対応を入力として渡し、
 * ルール判定、Severity 決定、locale 判定は行わない。
 */

import type { Finding } from './presentation-model'

const CSV_BOM = '\uFEFF'
const CSV_HEADERS = [
  'severity',
  'styleGuideItem',
  'message',
  'source',
  'translation',
] as const

/**
 * CSV の1フィールドとして安全に扱える文字列へ変換する。
 *
 * @param value CSV へ出力する値。
 * @returns カンマ、引用符、改行を含む場合に引用符で囲み、内部の引用符を二重化した値。
 */
function escapeCsvField(value: string): string {
  if (!/[",\r\n]/.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

/**
 * 1指摘から出力形式で共通して利用する原文と翻訳を取得する。
 *
 * @param finding 出力対象の1指摘。
 * @returns 指摘に対応する原文と翻訳。
 */
function getFindingText(finding: Finding): {
  source: string
  translation: string
} {
  return {
    source: finding.entry.source.singular,
    translation: finding.entry.translations[0]?.text ?? '',
  }
}

/**
 * 現在の確認結果全体を UTF-8 BOM 付き CSV へ変換する。
 *
 * @param findings 正常完了した現在の確認結果全体。
 * @returns 1指摘を1行とした CSV 文字列。指摘0件の場合はヘッダーだけを返す。
 */
export function serializeCsv(findings: readonly Finding[]): string {
  const rows = [CSV_HEADERS.join(',')]

  // 利用者向けの1指摘を1行として、表示と同じ順序で CSV へ出力する。
  for (const finding of findings) {
    const { source, translation } = getFindingText(finding)
    rows.push(
      [
        finding.severity,
        finding.styleGuideItem,
        finding.message,
        source,
        translation,
      ]
        .map(escapeCsvField)
        .join(','),
    )
  }

  return CSV_BOM + rows.join('\r\n')
}

/**
 * 現在の確認結果全体を機械利用向け JSON へ変換する。
 *
 * @param fileName 確認対象の PO ファイル名。
 * @param findings 正常完了した現在の確認結果全体。
 * @returns file、summary、findings を持つ整形済み JSON 文字列。
 */
export function serializeJson(
  fileName: string,
  findings: readonly Finding[],
): string {
  let errors = 0
  let warnings = 0

  const exportedFindings = findings.map((finding) => {
    if (finding.severity === 'Error') {
      errors += 1
    } else {
      warnings += 1
    }

    const { source, translation } = getFindingText(finding)

    return {
      severity: finding.severity.toLowerCase(),
      styleGuideItem: finding.styleGuideItem,
      message: finding.message,
      source,
      translation,
    }
  })

  return JSON.stringify(
    {
      file: fileName,
      summary: { errors, warnings },
      findings: exportedFindings,
    },
    null,
    2,
  )
}

/**
 * 現在の確認結果全体を人が共有して読める Markdown へ変換する。
 *
 * @param fileName 確認対象の PO ファイル名。
 * @param findings 正常完了した現在の確認結果全体。
 * @returns ファイル名、件数、各指摘を含む Markdown 文字列。
 */
export function serializeMarkdown(
  fileName: string,
  findings: readonly Finding[],
): string {
  const errorCount = findings.filter(
    (finding) => finding.severity === 'Error',
  ).length
  const warningCount = findings.length - errorCount
  const lines = [
    '## WTC チェック結果',
    '',
    `- File: ${fileName}`,
    `- Error: ${errorCount}`,
    `- Warning: ${warningCount}`,
    '',
  ]

  if (findings.length === 0) {
    lines.push(
      '正常に確認が完了し、v1 の対象ルールでは指摘がありませんでした。',
    )
    return lines.join('\n')
  }

  // 共有先でも1指摘ごとの情報を追えるよう、表示と同じ順序で原文・翻訳を付ける。
  for (const finding of findings) {
    const { source, translation } = getFindingText(finding)

    lines.push(
      `### ${finding.severity}: ${finding.styleGuideItem}`,
      '',
      finding.message,
      '',
      '**原文**',
      '',
      source,
      '',
      '**翻訳**',
      '',
      translation,
      '',
    )
  }

  return lines.join('\n').trimEnd()
}
