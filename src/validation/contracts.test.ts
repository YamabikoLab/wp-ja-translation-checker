/**
 * 検証コアの最小契約が、確認結果と問題箇所に必要な意味を表現できることを確認する。
 *
 * 実装方法ではなく、後続フェーズが依存する責務間契約の成立条件をテスト対象とする。
 */

import { describe, expect, expectTypeOf, it } from 'vitest'
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
   * - `ProblemLocation` として翻訳側の文字範囲を表現する。
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
   * - `ProblemLocation` として原文側の文字間境界を表現する。
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
   * ルール固有の検出結果と最終指摘が、少なくとも1つの問題箇所を必要とすることを確認する。
   *
   * 事前条件:
   * - 個別ルールの検出結果と最終指摘は、利用者が対象箇所を特定できる契約を持つ。
   *
   * 操作:
   * - `RuleSpecificDetection` と `Finding` の問題箇所型を確認する。
   *
   * 期待結果:
   * - どちらも先頭の問題箇所が必須で、追加の問題箇所を保持できる型になっている。
   */
  it('when a problem is represented, should require at least one problem location', () => {
    expectTypeOf<RuleSpecificDetection['locations']>().toEqualTypeOf<
      readonly [ProblemLocation, ...ProblemLocation[]]
    >()
    expectTypeOf<Finding['locations']>().toEqualTypeOf<
      readonly [ProblemLocation, ...ProblemLocation[]]
    >()
  })

  /**
   * 個別ルールで問題が検出された場合に、Finding Coordination に必要な情報を保持できることを確認する。
   *
   * 事前条件:
   * - ルール固有の検出結果に重要度、問題概要、原文、翻訳、問題箇所、理由、スタイルガイド根拠がある。
   *
   * 操作:
   * - `RuleSpecificDetection` として検出結果を表現する。
   *
   * 期待結果:
   * - 問題箇所とスタイルガイド項目を含む、後続責務に必要な情報が保持される。
   */
  it('when a rule-specific problem is detected, should preserve the data needed for finding coordination', () => {
    const detection: RuleSpecificDetection = {
      entryIndex: 3,
      translationFormIndex: 0,
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

    expect(detection.entryIndex).toBe(3)
    expect(detection.translationFormIndex).toBe(0)
    expect(detection.locations).toHaveLength(1)
    expect(detection.styleGuide.item).toBe('1-4')
  })

  /**
   * 確認が正常完了した場合に、確認不能状態と区別できる結果を保持することを確認する。
   *
   * 事前条件:
   * - 確認が正常完了し、1件の `Finding` がある。
   *
   * 操作:
   * - `CheckResult` として正常完了結果を表現する。
   *
   * 期待結果:
   * - status が success となり、`Finding` が保持される。
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
   * - 各確認不能状態を `CheckResult` として表現する。
   *
   * 期待結果:
   * - いずれの結果も success として扱われない。
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
