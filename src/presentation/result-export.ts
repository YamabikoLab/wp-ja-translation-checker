/**
 * 正常完了した確認結果を、共有・保存用の CSV / JSON / Markdown 文字列へ変換する責任を持つ。
 *
 * Presentation が確定済みの指摘と entry の対応を入力として渡し、
 * ルール判定、Severity 決定、locale 判定は行わない。
 */

import type { Finding } from './presentation-model'

const CSV_BOM = '\uFEFF'

/**
 * 翻訳内の一致範囲を、重複や隣接による文字列の欠落・重複が起きない順序へ正規化する。
 *
 * @param text 対象の翻訳。
 * @param matches Validation Core が返した一致範囲。
 * @returns 対象文字列内に収まる、開始位置順で重複しない範囲。
 */
function normalizeMatches(
  text: string,
  matches: Finding['matches'],
): readonly Finding['matches'][number][] {
  const validMatches = [...matches]
    .filter(
      ({ start, end }) =>
        Number.isInteger(start) &&
        Number.isInteger(end) &&
        start >= 0 &&
        start < end &&
        end <= text.length,
    )
    .sort((left, right) => left.start - right.start || left.end - right.end)

  const normalized: Array<Finding['matches'][number]> = []

  // 同一箇所・重複・隣接する一致範囲は1つへまとめ、出力時に同じ文字を二重化しない。
  for (const match of validMatches) {
    const previous = normalized[normalized.length - 1]

    if (previous !== undefined && match.start <= previous.end) {
      normalized[normalized.length - 1] = {
        start: previous.start,
        end: Math.max(previous.end, match.end),
      }
    } else {
      normalized.push(match)
    }
  }

  return normalized
}

/**
 * Markdown の太字として成立するよう、一致文字列の前後空白を装飾の外へ出す。
 *
 * 空白だけの一致範囲は装飾せず、元の文字列をそのまま保持する。
 *
 * @param matchedText 一致範囲から取得した翻訳文字列。
 * @returns 前後空白を保持しつつ、実文字部分だけを太字にした Markdown 文字列。
 */
function formatMarkdownMatch(matchedText: string): string {
  const leadingWhitespace = matchedText.match(/^\s*/u)?.[0] ?? ''
  const trailingWhitespace = matchedText.match(/\s*$/u)?.[0] ?? ''
  const contentStart = leadingWhitespace.length
  const contentEnd = matchedText.length - trailingWhitespace.length

  if (contentStart >= contentEnd) {
    return matchedText
  }

  return (
    leadingWhitespace +
    `**${matchedText.slice(contentStart, contentEnd)}**` +
    trailingWhitespace
  )
}

/**
 * Markdown で確認しやすいよう、翻訳の一致範囲だけを太字で表現する。
 *
 * @param text 出力対象の翻訳。
 * @param matches Validation Core が返した一致範囲。
 * @returns 一致範囲を Markdown の太字記法で囲んだ翻訳。
 */
function formatMarkdownTranslation(
  text: string,
  matches: Finding['matches'],
): string {
  const normalized = normalizeMatches(text, matches)

  if (normalized.length === 0) {
    return text
  }

  const parts: string[] = []
  let cursor = 0

  // 元文字列の順序を維持したまま、一致範囲だけに表示用の Markdown 記法を付与する。
  for (const match of normalized) {
    parts.push(text.slice(cursor, match.start))
    parts.push(formatMarkdownMatch(text.slice(match.start, match.end)))
    cursor = match.end
  }

  parts.push(text.slice(cursor))
  return parts.join('')
}

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
      matches: finding.matches,
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
    const highlightedTranslation = formatMarkdownTranslation(
      translation,
      finding.matches,
    )

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
      highlightedTranslation,
      '',
    )
  }

  return lines.join('\n').trimEnd()
}
