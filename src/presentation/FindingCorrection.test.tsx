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
 * 修正案の再チェックテスト用の Error 指摘を生成する。
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

/**
 * 修正案の再チェックテスト用の Warning 指摘を生成する。
 *
 * @returns 原文条件を伴う Warning のテストデータ。
 */
function createWarningFinding(): Finding {
  return {
    key: '0-warning-0',
    severity: 'Warning',
    styleGuideItem: '3-4 「Sorry, ...」の Sorry を訳さない',
    message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
    matches: [{ start: 0, end: 9 }],
    entry: {
      entryIndex: 0,
      source: {
        singular: 'Sorry, your order was unsuccessful',
      },
      translations: [
        {
          index: 0,
          text: '申し訳ございませんが、ご注文は失敗しました',
        },
      ],
    },
  }
}

afterEach(() => {
  cleanup()
})

describe('FindingCorrection', () => {
  /**
   * 修正操作を開始したとき、現在の翻訳をそのまま修正案として編集できることを確認する。
   *
   * 事前条件:
   * - 1件の Error 指摘が表示されている。
   *
   * 操作:
   * - 「修正して再チェック」を押す。
   *
   * 期待結果:
   * - 翻訳入力欄に現在の翻訳が初期値として表示される。
   */
  it('when correction starts, should show the current translation as the editable draft', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))

    expect(
      (screen.getByRole('textbox', { name: '翻訳' }) as HTMLTextAreaElement)
        .value,
    ).toBe('WordPressのテーブル')
  })

  /**
   * 問題を解消した修正案を再チェックしたとき、問題なしとして確認できることを確認する。
   *
   * 操作:
   * - 修正案へ必要な半角スペースを追加して再チェックする。
   *
   * 期待結果:
   * - 修正案では問題が見つからなかったことが表示される。
   */
  it('when a corrected translation is rechecked, should report that no issue was found', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))
    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: 'WordPress のテーブル' },
    })
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))

    expect(
      screen.getByText('この翻訳では問題は見つかりませんでした。'),
    ).toBeTruthy()
  })

  /**
   * 問題が残る修正案を再チェックしたとき、既存ルールの Error と根拠を確認できることを確認する。
   *
   * 操作:
   * - 元の問題を残したまま再チェックする。
   *
   * 期待結果:
   * - 既存ルールが返す指摘メッセージとスタイルガイド項目が表示される。
   */
  it('when an invalid translation is rechecked, should show the issue returned by the existing rules', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))

    expect(
      screen.getByText('「s」と「の」の間に半角スペースを入れてください'),
    ).toBeTruthy()
    expect(
      screen.getByText('スタイルガイド: 1-4 半角文字と全角文字の間のスペース'),
    ).toBeTruthy()
  })

  /**
   * 原文条件を伴う Warning が残る修正案を再チェックしたとき、Warning として確認できることを確認する。
   *
   * 事前条件:
   * - 原文が `Sorry, ...` で始まり、翻訳にも対象の謝罪表現が残っている。
   *
   * 操作:
   * - 修正せず再チェックする。
   *
   * 期待結果:
   * - Warning ラベルと 3-4 の指摘内容が表示される。
   */
  it('when a warning condition remains after recheck, should show the warning result', () => {
    render(<FindingCorrection finding={createWarningFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))
    fireEvent.click(screen.getByRole('button', { name: '再チェック' }))

    expect(screen.getByText('Warning')).toBeTruthy()
    expect(
      screen.getByText('先頭の「Sorry,」に対応する謝罪表現を削除してください'),
    ).toBeTruthy()
    expect(
      screen.getByText('スタイルガイド: 3-4 「Sorry, ...」の Sorry を訳さない'),
    ).toBeTruthy()
  })

  /**
   * 修正をキャンセルしたとき、一時入力を破棄して元の翻訳からやり直せることを確認する。
   *
   * 操作:
   * - 翻訳を変更してからキャンセルし、再び修正操作を開始する。
   *
   * 期待結果:
   * - 編集状態を終了する。
   * - 再度開いた入力欄には、一時入力ではなく元の翻訳が表示される。
   */
  it('when editing is cancelled, should discard the draft and restore the original translation on the next edit', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))
    fireEvent.change(screen.getByRole('textbox', { name: '翻訳' }), {
      target: { value: '一時的な修正案' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(
      screen.getByRole('button', { name: '修正して再チェック' }),
    ).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '翻訳' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))

    expect(
      (screen.getByRole('textbox', { name: '翻訳' }) as HTMLTextAreaElement)
        .value,
    ).toBe('WordPressのテーブル')
  })

  /**
   * 再チェック済みの修正案をさらに変更したとき、古い結果を現在の修正案の結果として残さないことを確認する。
   *
   * 事前条件:
   * - 問題なしの再チェック結果が表示されている。
   *
   * 操作:
   * - 翻訳入力を再び変更する。
   *
   * 期待結果:
   * - 以前の「問題なし」結果が消え、次の再チェックまで結果を表示しない。
   */
  it('when a checked draft is edited again, should clear the previous result until rechecked', () => {
    render(<FindingCorrection finding={createFinding()} />)

    fireEvent.click(screen.getByRole('button', { name: '修正して再チェック' }))
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
