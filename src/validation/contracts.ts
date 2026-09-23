/**
 * 検証コアの責務間で共有する、確認結果と指摘情報の契約を定義する。
 *
 * 個別ルールから最終表示まで同じ意味情報を受け渡し、Presentation が判定結果や
 * 問題箇所を再解釈せずに利用できる境界を提供する。
 */

/**
 * 1件の指摘に設定する重要度を表す。
 */
export type Severity = 'error' | 'warning'

/**
 * 原文または翻訳内で、問題として示す位置を表す。
 *
 * 既存文字を問題箇所として示す場合は開始位置を含み終了位置を含まない文字範囲を使用し、
 * 不足しているスペースなど文字そのものが存在しない問題は文字間境界として表現する。
 */
export type ProblemLocation =
  | {
      side: 'source' | 'translation'
      kind: 'range'
      startOffset: number
      endOffset: number
    }
  | {
      side: 'source' | 'translation'
      kind: 'boundary'
      offset: number
    }

/**
 * 指摘の根拠として利用者が参照できる、WordPress 日本語翻訳スタイルガイドの項目を表す。
 */
export type StyleGuideReference = {
  item: string
  url: string
}

/**
 * 個別ルールが Finding Coordination へ渡す検出結果を表す。
 *
 * 各ルールが所有する重要度、問題概要、判定理由、スタイルガイド根拠、1つ以上の問題箇所を保持し、
 * 後続責務が重複解消や集約を行うための意味情報を失わないことを目的とする。
 */
export type RuleSpecificDetection = {
  ruleId: string
  severity: Severity
  summary: string
  source: string
  translation: string
  locations: readonly [ProblemLocation, ...ProblemLocation[]]
  reason: string
  styleGuide: StyleGuideReference
}

/**
 * Finding Coordination が Presentation へ渡す、利用者向けの最終指摘を表す。
 *
 * Presentation が原文や翻訳を再解析せず、問題概要、重要度、1つ以上の問題箇所、判定理由、
 * スタイルガイド根拠をそのまま表示できる情報を保持する。
 */
export type Finding = {
  ruleId: string
  severity: Severity
  summary: string
  source: string
  translation: string
  locations: readonly [ProblemLocation, ...ProblemLocation[]]
  reason: string
  styleGuide: StyleGuideReference
}

/**
 * 1回の確認要求全体の結果を表す。
 *
 * 正常完了と、入力解析不能・ロケール判定不能・未対応ロケールを意味上別の状態として保持し、
 * 指摘が0件の正常完了と確認不能を混同しないための契約とする。
 */
export type CheckResult =
  | {
      status: 'success'
      findings: readonly Finding[]
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
