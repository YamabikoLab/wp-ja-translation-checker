/**
 * Result Presentation の状態遷移、CheckMessage 単位の表示モデル、長文判定を確認する。
 */

import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/check/check'
import {
  createFindings,
  createRuleFilterOptions,
  filterFindingsByRule,
  getCollapsedText,
  getCompletionFocusTarget,
  presentationReducer,
  summarizeFindings,
  type PresentationState,
} from './presentation-model'

/**
 * Presentation state の identity 確認に利用する File を生成する。
 *
 * @param name ファイル名。
 * @returns テスト用 File。
 */
function createFile(name: string): File {
  return { name } as File
}

/**
 * 正常完了結果を生成する。
 *
 * @param errorCount Error の CheckMessage 数。
 * @param warningCount Warning の CheckMessage 数。
 * @returns 指定件数の Error / Warning を同一 entry に持つ確認結果。
 */
function createSuccessResult(
  errorCount = 2,
  warningCount = 1,
): Extract<CheckResult, { status: 'success' }> {
  return {
    status: 'success',
    entries: [
      {
        entryIndex: 0,
        source: {
          singular: 'Save all settings',
          plural: 'Save all setting groups',
        },
        translations: [{ index: 0, text: '全ての設定を保存して下さい' }],
      },
    ],
    results:
      errorCount === 0 && warningCount === 0
        ? []
        : [
            {
              entryIndex: 0,
              errors: Array.from({ length: errorCount }, (_, index) => ({
                styleGuideItem: `Error guide ${index + 1}`,
                message: `Error message ${index + 1}`,
                matches: [{ start: 0, end: 2 }],
              })),
              warnings: Array.from({ length: warningCount }, (_, index) => ({
                styleGuideItem: `Warning guide ${index + 1}`,
                message: `Warning message ${index + 1}`,
                matches: [],
              })),
            },
          ],
  }
}

describe('Presentation state', () => {
  /**
   * ファイル未選択状態では確認を開始できないことを確認する。
   *
   * 事前条件:
   * - ファイルが選択されていない。
   *
   * 操作:
   * - 確認開始を要求する。
   *
   * 期待結果:
   * - ファイル未選択状態のままとなる。
   */
  it('when no file is selected, should keep the no-file state on start', () => {
    const state: PresentationState = { status: 'no-file' }

    expect(presentationReducer(state, { type: 'start-check' })).toBe(state)
  })

  /**
   * ファイル選択後に利用者が確認を開始できることを確認する。
   *
   * 事前条件:
   * - .po ファイルが選択されている。
   *
   * 操作:
   * - 確認開始を要求する。
   *
   * 期待結果:
   * - 選択ファイルを保持した確認中状態となる。
   */
  it('when a selected file starts validation, should enter checking state for that file', () => {
    const file = createFile('ja.po')
    const selected: PresentationState = { status: 'selected', file }

    expect(presentationReducer(selected, { type: 'start-check' })).toEqual({
      status: 'checking',
      file,
    })
  })

  /**
   * 別ファイルを選択した時点で以前の結果を現在入力から外すことを確認する。
   *
   * 事前条件:
   * - 以前のファイルに対する正常結果が表示対象になっている。
   *
   * 操作:
   * - 別のファイルを選択する。
   *
   * 期待結果:
   * - 新しいファイルだけを持つ選択済み状態となり、以前の結果を保持しない。
   */
  it('when a file is selected after a previous result, should replace the current input and clear the old result', () => {
    const oldFile = createFile('old.po')
    const newFile = createFile('new.po')
    const initial: PresentationState = {
      status: 'success',
      file: oldFile,
      result: createSuccessResult(),
    }

    expect(
      presentationReducer(initial, { type: 'select-file', file: newFile }),
    ).toEqual({ status: 'selected', file: newFile })
  })

  /**
   * 確認中の同一入力へ重複した確認開始を適用しないことを確認する。
   *
   * 事前条件:
   * - 選択ファイルの確認が進行中である。
   *
   * 操作:
   * - 再度確認開始を要求する。
   *
   * 期待結果:
   * - 同じ確認中状態を維持する。
   */
  it('when the same check is already running, should keep the checking state', () => {
    const file = createFile('ja.po')
    const state: PresentationState = { status: 'checking', file }

    expect(presentationReducer(state, { type: 'start-check' })).toBe(state)
  })

  /**
   * 入力差し替え後に旧入力の結果が完了しても現在入力へ適用しないことを確認する。
   *
   * 事前条件:
   * - 新しいファイルが現在入力として選択済みである。
   * - 以前のファイルに対する確認が後から完了する。
   *
   * 操作:
   * - 旧ファイルの完了結果を適用する。
   *
   * 期待結果:
   * - 新しいファイルの選択済み状態を維持する。
   */
  it('when an old file completes after the input was replaced, should ignore the stale result', () => {
    const oldFile = createFile('old.po')
    const newFile = createFile('new.po')
    const current: PresentationState = { status: 'selected', file: newFile }

    expect(
      presentationReducer(current, {
        type: 'check-completed',
        file: oldFile,
        result: createSuccessResult(),
      }),
    ).toBe(current)
  })

  /**
   * File の読み取り失敗を正常結果と区別できることを確認する。
   *
   * 事前条件:
   * - 対象ファイルの確認が進行中である。
   *
   * 操作:
   * - File の読み取り失敗を通知する。
   *
   * 期待結果:
   * - file-read-failure の確認不能状態となる。
   */
  it('when file reading fails for the active check, should enter feedback state', () => {
    const file = createFile('broken.po')
    const checking: PresentationState = { status: 'checking', file }

    expect(
      presentationReducer(checking, {
        type: 'file-read-failure',
        file,
      }),
    ).toEqual({
      status: 'feedback',
      file,
      reason: 'file-read-failure',
    })
  })

  /**
   * PO として解釈できない結果を確認不能として扱うことを確認する。
   *
   * 事前条件:
   * - 対象ファイルの確認が進行中である。
   *
   * 操作:
   * - invalid-po の確認結果を適用する。
   *
   * 期待結果:
   * - invalid-po の確認不能状態となる。
   */
  it('when validation returns invalid-po, should enter invalid-po feedback state', () => {
    const file = createFile('invalid.po')
    const checking: PresentationState = { status: 'checking', file }

    expect(
      presentationReducer(checking, {
        type: 'check-completed',
        file,
        result: { status: 'invalid-po' },
      }),
    ).toEqual({
      status: 'feedback',
      file,
      reason: 'invalid-po',
    })
  })

  /**
   * ロケール判定不能を未対応ロケールとは別の確認不能状態として扱うことを確認する。
   *
   * 事前条件:
   * - 対象ファイルの確認が進行中である。
   *
   * 操作:
   * - unresolved-locale の確認結果を適用する。
   *
   * 期待結果:
   * - unresolved-locale の確認不能状態となる。
   */
  it('when validation returns unresolved-locale, should enter unresolved-locale feedback state', () => {
    const file = createFile('unknown.po')
    const checking: PresentationState = { status: 'checking', file }

    expect(
      presentationReducer(checking, {
        type: 'check-completed',
        file,
        result: { status: 'unresolved-locale' },
      }),
    ).toEqual({
      status: 'feedback',
      file,
      reason: 'unresolved-locale',
    })
  })

  /**
   * 未対応ロケールで判定済み locale を失わないことを確認する。
   *
   * 事前条件:
   * - 対象ファイルの確認が進行中である。
   *
   * 操作:
   * - 判定済み locale を持つ unsupported-locale の結果を適用する。
   *
   * 期待結果:
   * - 未対応ロケール状態に locale が保持される。
   */
  it('when an unsupported locale result completes, should preserve the resolved locale in feedback state', () => {
    const file = createFile('fr.po')
    const checking: PresentationState = { status: 'checking', file }

    expect(
      presentationReducer(checking, {
        type: 'check-completed',
        file,
        result: { status: 'unsupported-locale', locale: 'fr_FR' },
      }),
    ).toEqual({
      status: 'feedback',
      file,
      reason: 'unsupported-locale',
      locale: 'fr_FR',
    })
  })

  /**
   * 正常完了時に結果概要をフォーカス先として選ぶことを確認する。
   *
   * 事前条件:
   * - 確認が正常完了している。
   *
   * 操作:
   * - 完了後のフォーカス先を取得する。
   *
   * 期待結果:
   * - 結果概要が選ばれる。
   */
  it('when validation succeeds, should identify the result summary as the focus target', () => {
    const state: PresentationState = {
      status: 'success',
      file: createFile('ja.po'),
      result: createSuccessResult(),
    }

    expect(getCompletionFocusTarget(state)).toBe('summary')
  })

  /**
   * 確認不能時に重要なフィードバックをフォーカス先として選ぶことを確認する。
   *
   * 事前条件:
   * - 確認不能状態である。
   *
   * 操作:
   * - 完了後のフォーカス先を取得する。
   *
   * 期待結果:
   * - 重要なフィードバック領域が選ばれる。
   */
  it('when validation cannot complete, should identify important feedback as the focus target', () => {
    const state: PresentationState = {
      status: 'feedback',
      file: createFile('broken.po'),
      reason: 'invalid-po',
    }

    expect(getCompletionFocusTarget(state)).toBe('feedback')
  })

  /**
   * ファイル選択だけではフォーカス移動を要求しないことを確認する。
   *
   * 事前条件:
   * - 新しいファイルが選択済みで、まだ確認していない。
   *
   * 操作:
   * - 完了後のフォーカス先を取得する。
   *
   * 期待結果:
   * - フォーカス移動先を返さない。
   */
  it('when only the selected file changes, should not request a completion focus move', () => {
    const state: PresentationState = {
      status: 'selected',
      file: createFile('new.po'),
    }

    expect(getCompletionFocusTarget(state)).toBeNull()
  })
})

describe('Presentation result model', () => {
  /**
   * 1つの entry に複数の CheckMessage がある場合の指摘単位を確認する。
   *
   * 事前条件:
   * - 同一 entry に Error 2件、Warning 1件がある。
   *
   * 操作:
   * - 正常完了結果を表示用の指摘一覧へ変換する。
   *
   * 期待結果:
   * - 3件の独立した指摘になる。
   * - 各指摘が同じ entry の原文・翻訳・複数形原文を参照する。
   */
  it('when one entry has multiple messages, should expose each CheckMessage as one finding with the same entry content', () => {
    const findings = createFindings(createSuccessResult())

    expect(findings).toHaveLength(3)
    expect(findings.map((finding) => finding.message)).toEqual([
      'Error message 1',
      'Error message 2',
      'Warning message 1',
    ])
    expect(
      findings.every(
        (finding) => finding.entry.source.singular === 'Save all settings',
      ),
    ).toBe(true)
    expect(
      findings.every(
        (finding) =>
          finding.entry.translations[0]?.text === '全ての設定を保存して下さい',
      ),
    ).toBe(true)
    expect(findings[0]?.entry.source.plural).toBe('Save all setting groups')
    expect(findings[0]?.matches).toEqual([{ start: 0, end: 2 }])
  })

  /**
   * entryIndex と配列位置の契約が崩れた結果を誤表示しないことを確認する。
   *
   * 事前条件:
   * - 確認結果の entryIndex と entries の配列位置が一致していない。
   *
   * 操作:
   * - 正常完了結果を表示用の指摘一覧へ変換する。
   *
   * 期待結果:
   * - 対応しない entry を指摘へ結び付けず、契約不整合として失敗する。
   */
  it('when entry index does not match the entries position, should reject the inconsistent result', () => {
    const result = createSuccessResult()
    const inconsistentResult = {
      ...result,
      entries: [{ ...result.entries[0]!, entryIndex: 1 }],
    }

    expect(() => createFindings(inconsistentResult)).toThrow(
      '確認結果の entryIndex 0 に対応する翻訳 entry がありません。',
    )
  })

  /**
   * Error だけを含む正常結果の件数を確認する。
   *
   * 事前条件:
   * - Error 2件、Warning 0件の正常結果がある。
   *
   * 操作:
   * - 指摘一覧を集計する。
   *
   * 期待結果:
   * - Error 2件、Warning 0件、全体2件となる。
   */
  it('when success has only errors, should count each Error CheckMessage', () => {
    expect(
      summarizeFindings(createFindings(createSuccessResult(2, 0))),
    ).toEqual({
      errorCount: 2,
      warningCount: 0,
      totalCount: 2,
    })
  })

  /**
   * Warning だけを含む正常結果の件数を確認する。
   *
   * 事前条件:
   * - Error 0件、Warning 2件の正常結果がある。
   *
   * 操作:
   * - 指摘一覧を集計する。
   *
   * 期待結果:
   * - Error 0件、Warning 2件、全体2件となる。
   */
  it('when success has only warnings, should count each Warning CheckMessage', () => {
    expect(
      summarizeFindings(createFindings(createSuccessResult(0, 2))),
    ).toEqual({
      errorCount: 0,
      warningCount: 2,
      totalCount: 2,
    })
  })

  /**
   * Error と Warning が混在する正常結果の件数を確認する。
   *
   * 事前条件:
   * - Error 2件、Warning 1件の正常結果がある。
   *
   * 操作:
   * - 指摘一覧を集計する。
   *
   * 期待結果:
   * - 各 Severity を CheckMessage 単位で集計し、全体3件となる。
   */
  it('when Error and Warning findings are mixed, should count CheckMessages by severity', () => {
    expect(summarizeFindings(createFindings(createSuccessResult()))).toEqual({
      errorCount: 2,
      warningCount: 1,
      totalCount: 3,
    })
  })

  /**
   * 指摘なしの正常完了を0件の結果として扱うことを確認する。
   *
   * 事前条件:
   * - Validation Core が正常完了し、results が空である。
   *
   * 操作:
   * - 表示用の指摘一覧を生成し集計する。
   *
   * 期待結果:
   * - 指摘一覧が空で、Error / Warning / 全体件数がすべて0件となる。
   */
  it('when success has no findings, should keep all finding counts at zero', () => {
    const findings = createFindings(createSuccessResult(0, 0))

    expect(findings).toEqual([])
    expect(summarizeFindings(findings)).toEqual({
      errorCount: 0,
      warningCount: 0,
      totalCount: 0,
    })
  })
})

describe('Long text presentation', () => {
  /**
   * 200文字ちょうどの原文・翻訳を長文扱いしない境界を確認する。
   *
   * 事前条件:
   * - 表示対象が200文字である。
   *
   * 操作:
   * - 長文表示判定を行う。
   *
   * 期待結果:
   * - 省略せず全文を表示対象とする。
   */
  it('when text has 200 characters, should not collapse it', () => {
    const text = 'あ'.repeat(200)

    expect(getCollapsedText(text)).toEqual({
      isLong: false,
      collapsed: text,
    })
  })

  /**
   * 200文字を超える原文・翻訳を決定的な文字数基準で省略することを確認する。
   *
   * 事前条件:
   * - 表示対象が201文字である。
   *
   * 操作:
   * - 長文表示判定を行う。
   *
   * 期待結果:
   * - 長文として扱い、先頭200文字と省略記号を折りたたみ表示へ使用する。
   */
  it('when text has more than 200 characters, should collapse only the displayed preview', () => {
    const text = 'あ'.repeat(201)

    const result = getCollapsedText(text)

    expect(result.isLong).toBe(true)
    expect(Array.from(result.collapsed)).toHaveLength(201)
    expect(result.collapsed.endsWith('…')).toBe(true)
  })
})

describe('Rule filtering', () => {
  /**
   * 現在の確認結果に存在するルールだけを重複なく件数付きで提示できることを確認する。
   *
   * 事前条件:
   * - Error / Warning に同じルールの指摘が含まれる。
   * - 別ルールの指摘も含まれる。
   *
   * 操作:
   * - ルール選択肢を導出する。
   *
   * 期待結果:
   * - 同じルールは1つの選択肢となる。
   * - Error / Warning を区別せず、1つの CheckMessage を1件として集計する。
   * - 最初に現れたルール順を維持する。
   */
  it('when findings contain repeated rules across severities, should create unique rule options with message counts', () => {
    const entry = createSuccessResult().entries[0]
    const findings = [
      {
        key: '0-error-0',
        severity: 'Error' as const,
        message: 'Error 1',
        styleGuideItem: '1-1 日本語の句読点',
        matches: [],
        entry,
      },
      {
        key: '0-warning-0',
        severity: 'Warning' as const,
        message: 'Warning 1',
        styleGuideItem: '3-2 View XX',
        matches: [],
        entry,
      },
      {
        key: '0-warning-1',
        severity: 'Warning' as const,
        message: 'Warning 2',
        styleGuideItem: '1-1 日本語の句読点',
        matches: [],
        entry,
      },
    ]

    expect(createRuleFilterOptions(findings)).toEqual([
      { styleGuideItem: '1-1 日本語の句読点', count: 2 },
      { styleGuideItem: '3-2 View XX', count: 1 },
    ])
  })

  /**
   * 単一ルール選択では Error / Warning の両方を同じ条件で絞り込むことを確認する。
   *
   * 事前条件:
   * - 同じルールに Error と Warning が存在する。
   * - 別ルールの指摘も存在する。
   *
   * 操作:
   * - 1つのルールを選択する。
   *
   * 期待結果:
   * - 選択したルールの Error / Warning だけを返す。
   * - 元の指摘一覧は変更しない。
   */
  it('when one rule is selected, should filter both error and warning findings without changing the source list', () => {
    const entry = createSuccessResult().entries[0]
    const findings = [
      {
        key: '0-error-0',
        severity: 'Error' as const,
        message: 'Error 1',
        styleGuideItem: '1-1 日本語の句読点',
        matches: [],
        entry,
      },
      {
        key: '0-warning-0',
        severity: 'Warning' as const,
        message: 'Warning 1',
        styleGuideItem: '1-1 日本語の句読点',
        matches: [],
        entry,
      },
      {
        key: '0-error-1',
        severity: 'Error' as const,
        message: 'Error 2',
        styleGuideItem: '1-2 英数字・記号の半角表記',
        matches: [],
        entry,
      },
    ]

    const filtered = filterFindingsByRule(findings, '1-1 日本語の句読点')

    expect(filtered.map((finding) => finding.key)).toEqual([
      '0-error-0',
      '0-warning-0',
    ])
    expect(findings).toHaveLength(3)
  })

  /**
   * 「すべてのルール」では元の確認結果全体を表示対象とすることを確認する。
   *
   * 事前条件:
   * - 複数ルールの指摘が存在する。
   *
   * 操作:
   * - 「すべてのルール」を表す null を指定する。
   *
   * 期待結果:
   * - 元の指摘一覧全体をそのまま返す。
   */
  it('when all rules are selected, should return the complete finding list', () => {
    const findings = createFindings(createSuccessResult())

    expect(filterFindingsByRule(findings, null)).toBe(findings)
  })

  /**
   * 結果概要はフィルター後の件数ではなく確認結果全体の件数を維持できることを確認する。
   *
   * 事前条件:
   * - 複数ルールに Error / Warning が存在する。
   *
   * 操作:
   * - 全指摘から概要を集計し、別に1ルールの表示対象を導出する。
   *
   * 期待結果:
   * - 概要は全指摘の件数を保持する。
   * - フィルター後の指摘件数だけが選択ルールの件数となる。
   */
  it('when a rule filter is applied, should keep the summary based on all findings while narrowing the visible count', () => {
    const findings = createFindings(createSuccessResult(2, 1))
    const selectedRule = findings[0]?.styleGuideItem ?? null
    const summary = summarizeFindings(findings)
    const filtered = filterFindingsByRule(findings, selectedRule)

    expect(summary).toEqual({
      errorCount: 2,
      warningCount: 1,
      totalCount: 3,
    })
    expect(filtered).toHaveLength(1)
  })
})
