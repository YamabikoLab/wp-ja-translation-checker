/**
 * @vitest-environment jsdom
 */

/**
 * 1件の翻訳修正案について、編集、既存ルールによる再チェック、結果確認、キャンセルを React の利用者操作から確認する。
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Finding } from './presentation-model'
import { FindingCorrection } from './FindingCorrection'

/**
 * 修正案の再チェックテスト用の指摘を生成する。
 *
 * @param translation 元の確認結果に含まれる翻訳。
 * @returns 修正案 UI が利用する Finding と同じ形のテストデータ。
 */
function createFinding(translation = 'WordPressのテーブル'): Finding {
  return {
    key: '0-error-0',
    severity: 'Error',
    styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
    message: '「s」と「の」の間に半角スペースを入れてください',
    matches: [{ start: 8, end: 10 }],
    entry: {
      entryIndex: 0,
      source: {
        singular: 'WordPress Table',
      },
      translations: [
        {
          index: 0,
          text: translation,
        },
      ],
    },
  }
}

afterEach(() => {
  cleanup()
})

describe('FindingCorrection', () => {
  it('when correction starts, should show the current translation as the editable draft', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(
      screen.getByRole('button', { name: '修正して再チェック' }),
    )

    expect(
      (screen.getByRole('textbox', { name: '翻訳' }) as HTMLTextAreaElement)
        .value,
    ).toBe('WordPressのテーブル')
  })

  it('when a corrected translation is rechecked, should report that no issue was found', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(
      screen.getByRole('button', { name: '修正して再チェック' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: 'WordPress のテーブル' },
    })
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))

    expect(
      screen.getByText('この翻訳では問題は見つかりませんでした。'),
    ).toBeTruthy()
  })

  it('when an invalid translation is rechecked, should show the issue returned by the existing rules', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(
      screen.getByRole('button', { name: '修正して再チェック' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))

    expect(
      screen.getByText('「s」と「の」の間に半角スペースを入れてください'),
    ).toBeTruthy()
    expect(
      screen.getByText('スタイルガイド: 1-4 半角文字と全角文字の間のスペース'),
    ).toBeTruthy()
  })

  it('when editing is cancelled, should discard the draft and return to the original card action', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(
      screen.getByRole('button', { name: '修正して再チェック' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: '一時的な修正案' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(
      screen.getByRole('button', { name: '修正して再チェック' }),
    ).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '翻訳' })).toBeNull()
  })

  it('when a checked draft is edited again, should clear the previous result until rechecked', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(
      screen.getByRole('button', { name: '修正して再チェック' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: 'WordPress のテーブル' },
    })
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))
    expect(
      screen.getByText('この翻訳では問題は見つかりませんでした。'),
    ).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: 'WordPressのテーブル' },
    })

    expect(
      screen.queryByText('この翻訳では問題は見つかりませんでした。'),
    ).toBeNull()
  })
})
