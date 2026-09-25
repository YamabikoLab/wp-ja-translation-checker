/**
 * @vitest-environment jsdom
 */

/**
 * WTC のチェック範囲案内が、初期状態を邪魔せず必要な情報へ到達できることを React の表示境界から確認する。
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CheckScopeGuide } from './CheckScopeGuide'

afterEach(() => {
  cleanup()
})

describe('CheckScopeGuide', () => {
  /**
   * 事前条件:
   * - チェック範囲案内を結果概要に表示する。
   *
   * 操作:
   * - 初期表示を確認する。
   *
   * 期待結果:
   * - 案内は閉じた状態で表示され、12項目をチェックすることを確認できる。
   */
  it('when first rendered, should keep the guidance collapsed and show the checked-rule count', () => {
    render(<CheckScopeGuide />)

    const summary = screen.getByText('WTC のチェック範囲').closest('summary')
    const details = summary?.closest('details')

    expect(details?.open).toBe(false)
    expect(screen.getByText('12項目をチェック')).toBeTruthy()
  })

  /**
   * 事前条件:
   * - チェック範囲案内が表示されている。
   *
   * 操作:
   * - 案内内容を確認する。
   *
   * 期待結果:
   * - 自動チェック・一部チェック・手動確認の区分と、詳細資料への導線を利用できる。
   */
  it('when guidance content is inspected, should expose the three check categories and detail links', () => {
    render(<CheckScopeGuide />)

    expect(screen.getByText('✅ 自動チェック')).toBeTruthy()
    expect(screen.getByText('△ 一部チェック')).toBeTruthy()
    expect(screen.getByText('👀 手動確認')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: '詳しい対応状況を見る' })
        .getAttribute('href'),
    ).toBe('https://github.com/YamabikoLab/wp-translation-checker#check-scope')
    expect(
      screen
        .getByRole('link', {
          name: 'WordPress 日本語翻訳スタイルガイドを見る',
        })
        .getAttribute('href'),
    ).toBe(
      'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/',
    )
  })
})
