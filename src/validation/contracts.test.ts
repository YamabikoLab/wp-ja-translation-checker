import { describe, expect, it } from 'vitest'
import type {
  CheckResult,
  Finding,
  ProblemLocation,
  RuleSpecificDetection,
} from './contracts'

describe('validation contracts', () => {
  /**
   * 問題箇所が既存文字の範囲である場合に、対象側と文字範囲を保持できることを確認する。
   *
   * 事前条件:
   * - 翻訳側に既存文字の範囲として表現する問題箇所がある。
   *
   * 操作:
   * - Problem Locationとして翻訳側の文字範囲を表現する。
   *
   * 期待結果:
   * - 翻訳側であることと、範囲の開始位置・終了位置が保持される。
   */
  it('when a problem is an existing character range, should preserve its side and range', () => {
    const location: ProblemLocation = {
      side: 'translation',
      kind: 'range',
      startOffset: 2,
      endOffset: 5,
    }

    expect(location).toEqual({
      side: 'translation',
      kind: 'range',
      startOffset: 2,
      endOffset: 5,
    })
  })

  /**
   * 問題箇所が文字間境界である場合に、対象側と境界位置を保持できることを確認する。
   *
   * 事前条件:
   * - 原文側に文字間境界として表現する問題箇所がある。
   *
   * 操作:
   * - Problem Locationとして原文側の文字間境界を表現する。
   *
   * 期待結果:
   * - 原文側であることと、境界位置が保持される。
   */
  it('when a problem is between characters, should preserve its side and boundary offset', () => {
    const location: ProblemLocation = {
      side: 'source',
      kind: 'boundary',
      offset: 3,
    }

    expect(location).toEqual({
      side: 'source',
      kind: 'boundary',
      offset: 3,
    })
  })

  /**
   * 個別ルールで問題が検出された場合に、Finding Coordinationに必要な情報を保持できることを確認する。
   *
   * 事前条件:
   * - ルール固有の検出結果にSeverity、問題概要、原文、翻訳、問題箇所、理由、スタイルガイド根拠がある。
   *
   * 操作:
   * - Rule-specific detectionとして検出結果を表現する。
   *
   * 期待結果:
   * - 問題箇所とスタイルガイド項目を含む、後続責務に必要な情報が保持される。
   */
  it('when a rule-specific problem is detected, should preserve the data needed for finding coordination', () => {
    const detection: RuleSpecificDetection = {
      ruleId: '1-4',
      severity: 'error',
      summary: '半角文字と全角文字の間に不要なスペースがあります。',
      source: 'Hello 世界',
      translation: 'Hello 世界',
      locations: [
        {
          side: 'translation',
          kind: 'range',
          startOffset: 5,
          endOffset: 6,
        },
      ],
      reason: '半角文字と全角文字の間には原則としてスペースを入れません。',
      styleGuide: {
        item: '1-4',
        url: 'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/',
      },
    }

    expect(detection.locations).toHaveLength(1)
    expect(detection.styleGuide.item).toBe('1-4')
  })

  /**
   * 確認が正常完了した場合に、確認不能状態と区別できる結果を保持することを確認する。
   *
   * 事前条件:
   * - 確認が正常完了し、1件のFindingがある。
   *
   * 操作:
   * - Check Resultとして正常完了結果を表現する。
   *
   * 期待結果:
   * - statusがsuccessとなり、Findingが保持される。
   */
  it('when validation succeeds, should distinguish success from non-checkable results', () => {
    const finding: Finding = {
      ruleId: '1-4',
      severity: 'error',
      summary: '半角文字と全角文字の間に不要なスペースがあります。',
      source: 'Hello 世界',
      translation: 'Hello 世界',
      locations: [
        {
          side: 'translation',
          kind: 'range',
          startOffset: 5,
          endOffset: 6,
        },
      ],
      reason: '半角文字と全角文字の間には原則としてスペースを入れません。',
      styleGuide: {
        item: '1-4',
        url: 'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/',
      },
    }
    const result: CheckResult = {
      status: 'success',
      findings: [finding],
    }

    expect(result.status).toBe('success')
    expect(result.findings).toEqual([finding])
  })

  /**
   * 確認を正常完了できない場合に、成功結果とは異なる状態として保持されることを確認する。
   *
   * 事前条件:
   * - 入力解析不能、ロケール判定不能、または未対応ロケールのいずれかで確認を正常完了できない。
   *
   * 操作:
   * - 各確認不能状態をCheck Resultとして表現する。
   *
   * 期待結果:
   * - いずれの結果もsuccessとして扱われない。
   */
  it.each<CheckResult>([
    { status: 'invalid-po' },
    { status: 'unresolved-locale' },
    { status: 'unsupported-locale', locale: 'fr' },
  ])(
    'when validation cannot complete with $status, should preserve that result as distinct from success',
    (result) => {
      expect(result.status).not.toBe('success')
    },
  )
})
