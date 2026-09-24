/**
 * Result Presentation が所有する画面状態、確認結果の表示モデル、長文表示の判定を定義する。
 *
 * Validation Core の結果を再判定せず、利用者から見える1回の確認状態と表示に必要な導出値だけを扱う。
 */

import type { CheckResult } from '@/check/check'

type SuccessfulCheckResult = Extract<CheckResult, { status: 'success' }>

type FeedbackState =
  | {
      status: 'feedback'
      file: File
      reason: 'file-read-failure' | 'invalid-po' | 'unresolved-locale'
    }
  | {
      status: 'feedback'
      file: File
      reason: 'unsupported-locale'
      locale: string
    }

/**
 * Presentation が保持する、利用者から見た現在の確認状態を表す。
 */
export type PresentationState =
  | { status: 'no-file' }
  | { status: 'selected'; file: File }
  | { status: 'checking'; file: File }
  | FeedbackState
  | {
      status: 'success'
      file: File
      result: SuccessfulCheckResult
    }

/**
 * 画面状態へ適用できる利用者操作または確認完了イベントを表す。
 */
export type PresentationAction =
  | { type: 'select-file'; file: File }
  | { type: 'start-check' }
  | { type: 'file-read-failure'; file: File }
  | { type: 'check-completed'; file: File; result: CheckResult }

/**
 * 利用者向けに表示する1件の指摘を表す。
 */
export type Finding = {
  key: string
  severity: 'Error' | 'Warning'
  message: string
  styleGuideItem: string
  entry: SuccessfulCheckResult['entries'][number]
}

/**
 * 確認結果概要で表示する Severity ごとの件数を表す。
 */
export type FindingSummary = {
  errorCount: number
  warningCount: number
  totalCount: number
}

/**
 * 完了後にフォーカスを移す Presentation 上の意味領域を表す。
 */
export type CompletionFocusTarget = 'feedback' | 'summary' | null

/** v1 で長文として扱う文字数の上限。 */
const COLLAPSED_CHARACTER_LIMIT = 200

/**
 * 画面状態を次の有効な状態へ遷移させる。
 *
 * 確認開始時点の File と完了イベントの File が一致しない場合は、入力差し替え後の古い結果として無視する。
 *
 * @param state 現在の画面状態。
 * @param action 利用者操作または確認完了イベント。
 * @returns 次の画面状態。
 */
export function presentationReducer(
  state: PresentationState,
  action: PresentationAction,
): PresentationState {
  if (action.type === 'select-file') {
    return { status: 'selected', file: action.file }
  }

  if (action.type === 'start-check') {
    if (state.status === 'no-file' || state.status === 'checking') {
      return state
    }

    return { status: 'checking', file: state.file }
  }

  if (state.status !== 'checking' || state.file !== action.file) {
    return state
  }

  if (action.type === 'file-read-failure') {
    return {
      status: 'feedback',
      file: action.file,
      reason: 'file-read-failure',
    }
  }

  if (action.result.status === 'success') {
    return {
      status: 'success',
      file: action.file,
      result: action.result,
    }
  }

  if (action.result.status === 'unsupported-locale') {
    return {
      status: 'feedback',
      file: action.file,
      reason: 'unsupported-locale',
      locale: action.result.locale,
    }
  }

  return {
    status: 'feedback',
    file: action.file,
    reason: action.result.status,
  }
}

/**
 * 正常完了した Validation Core の結果を、CheckMessage 単位の表示一覧へ変換する。
 *
 * @param result Check Orchestration が返した正常完了結果。
 * @returns entryIndex から原文・翻訳を参照した指摘一覧。
 */
export function createFindings(
  result: SuccessfulCheckResult,
): readonly Finding[] {
  const findings: Finding[] = []

  for (const checkedEntry of result.results) {
    const entry = result.entries[checkedEntry.entryIndex]

    // PO Interpretation が保証する配列位置と entryIndex の対応が崩れている場合は、誤った翻訳を指摘へ結び付けない。
    if (entry === undefined || entry.entryIndex !== checkedEntry.entryIndex) {
      throw new Error(
        `確認結果の entryIndex ${checkedEntry.entryIndex} に対応する翻訳 entry がありません。`,
      )
    }

    // 1つの Error CheckMessage を利用者向けの1指摘として、元 entry の内容と結び付ける。
    for (const [messageIndex, message] of checkedEntry.errors.entries()) {
      findings.push({
        key: `${checkedEntry.entryIndex}-error-${messageIndex}`,
        severity: 'Error',
        message: message.message,
        styleGuideItem: message.styleGuideItem,
        entry,
      })
    }

    // 1つの Warning CheckMessage を利用者向けの1指摘として、元 entry の内容と結び付ける。
    for (const [messageIndex, message] of checkedEntry.warnings.entries()) {
      findings.push({
        key: `${checkedEntry.entryIndex}-warning-${messageIndex}`,
        severity: 'Warning',
        message: message.message,
        styleGuideItem: message.styleGuideItem,
        entry,
      })
    }
  }

  return findings
}

/**
 * CheckMessage 単位の指摘一覧から結果概要の件数を導出する。
 *
 * @param findings 表示対象の指摘一覧。
 * @returns Error、Warning、全指摘の件数。
 */
export function summarizeFindings(
  findings: readonly Finding[],
): FindingSummary {
  let errorCount = 0
  let warningCount = 0

  // 利用者向けの1指摘を単位として Severity ごとの件数を集計する。
  for (const finding of findings) {
    if (finding.severity === 'Error') {
      errorCount += 1
    } else {
      warningCount += 1
    }
  }

  return {
    errorCount,
    warningCount,
    totalCount: errorCount + warningCount,
  }
}

/**
 * 長文表示に利用する文字数判定と省略文字列を返す。
 *
 * DOM の overflow は計測せず、Unicode code point の数が200文字を超える場合だけ省略する。
 *
 * @param text 表示対象の原文または翻訳。
 * @returns 長文かどうかと、折りたたみ時に表示する文字列。
 */
export function getCollapsedText(text: string): {
  isLong: boolean
  collapsed: string
} {
  const characters = Array.from(text)

  if (characters.length <= COLLAPSED_CHARACTER_LIMIT) {
    return { isLong: false, collapsed: text }
  }

  return {
    isLong: true,
    collapsed: `${characters.slice(0, COLLAPSED_CHARACTER_LIMIT).join('')}…`,
  }
}

/**
 * 確認完了後に移動するフォーカス先を画面状態から決定する。
 *
 * @param state 現在の画面状態。
 * @returns 確認不能時は feedback、正常完了時は summary、それ以外は null。
 */
export function getCompletionFocusTarget(
  state: PresentationState,
): CompletionFocusTarget {
  if (state.status === 'feedback') {
    return 'feedback'
  }

  if (state.status === 'success') {
    return 'summary'
  }

  return null
}
