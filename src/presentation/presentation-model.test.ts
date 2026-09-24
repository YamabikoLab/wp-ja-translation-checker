/**
 * Result Presentation の状態遷移、CheckMessage 単位の表示モデル、長文判定を確認する。
 */

import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/check/check'
import {
  createFindings,
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
 * @returns Error と Warning を同一 entry に持つ確認結果。
 */
function createSuccessResult(): Extract<CheckResult, { status: 'success' }> {
  return {
    status: 'success',
    entries: [
      {
        entryIndex: 7,
        source: {
          singular: 'Save all settings',
          plural: 'Save all setting groups',
        },
        translations: [{ index: 0, text: '全ての設定を保存して下さい' }],
      },
    ],
    results: [
      {
        entryIndex: 7,
        errors: [
          {
            styleGuideItem: '3-6 推奨表記',
            message: '「全て」は「すべて」と表記してください',
          },
          {
            styleGuideItem: '3-6 推奨表記',
            message: '「下さい」は「ください」と表記してください',
          },
        ],
        warnings: [
          {
            styleGuideItem: '3-2 View',
            message: '原文との対応を確認してください',
          },
        ],
      },
    ],
  }
}

describe('Presentation state', () => {
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

  it('when the same check is already running, should keep the checking state', () => {
    const file = createFile('ja.po')
    const state: PresentationState = { status: 'checking', file }

    expect(presentationReducer(state, { type: 'start-check' })).toBe(state)
  })

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

  it('when validation succeeds, should identify the result summary as the focus target', () => {
    const state: PresentationState = {
      status: 'success',
      file: createFile('ja.po'),
      result: createSuccessResult(),
    }

    expect(getCompletionFocusTarget(state)).toBe('summary')
  })

  it('when validation cannot complete, should identify important feedback as the focus target', () => {
    const state: PresentationState = {
      status: 'feedback',
      file: createFile('broken.po'),
      reason: 'invalid-po',
    }

    expect(getCompletionFocusTarget(state)).toBe('feedback')
  })

  it('when only the selected file changes, should not request a completion focus move', () => {
    const state: PresentationState = {
      status: 'selected',
      file: createFile('new.po'),
    }

    expect(getCompletionFocusTarget(state)).toBeNull()
  })
})

describe('Presentation result model', () => {
  it('when one entry has multiple messages, should expose each CheckMessage as one finding with the same entry content', () => {
    const findings = createFindings(createSuccessResult())

    expect(findings).toHaveLength(3)
    expect(findings.map((finding) => finding.message)).toEqual([
      '「全て」は「すべて」と表記してください',
      '「下さい」は「ください」と表記してください',
      '原文との対応を確認してください',
    ])
    expect(findings.every((finding) => finding.source === 'Save all settings')).toBe(
      true,
    )
    expect(
      findings.every(
        (finding) => finding.translation === '全ての設定を保存して下さい',
      ),
    ).toBe(true)
    expect(findings[0]?.pluralSource).toBe('Save all setting groups')
  })

  it('when Error and Warning findings are mixed, should count CheckMessages by severity', () => {
    expect(summarizeFindings(createFindings(createSuccessResult()))).toEqual({
      errorCount: 2,
      warningCount: 1,
      totalCount: 3,
    })
  })
})

describe('Long text presentation', () => {
  it('when text has 200 characters, should not collapse it', () => {
    const text = 'あ'.repeat(200)

    expect(getCollapsedText(text)).toEqual({
      isLong: false,
      collapsed: text,
    })
  })

  it('when text has more than 200 characters, should collapse only the displayed preview', () => {
    const text = 'あ'.repeat(201)

    const result = getCollapsedText(text)

    expect(result.isLong).toBe(true)
    expect(Array.from(result.collapsed)).toHaveLength(201)
    expect(result.collapsed.endsWith('…')).toBe(true)
  })
})
