/**
 * @vitest-environment jsdom
 */

/**
 * Glossary Warning 専用カードが、判断に必要な候補情報と公式参照先を表示することを確認する。
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { GlossaryFinding } from './presentation-model'
import { GlossaryFindingCard } from './GlossaryFindingCard'

afterEach(() => {
  cleanup()
})

const finding: GlossaryFinding = {
  key: '0-glossary-0-0',
  entry: {
    entryIndex: 0,
    source: { singular: 'Choose the default' },
    translations: [{ index: 0, text: '標準を選択' }],
  },
  result: {
    entryIndex: 0,
    translationFormIndex: 0,
    originalTerm: 'default',
    candidates: [
      {
        original: 'default',
        translation: 'デフォルト',
        partOfSpeech: 'noun',
      },
      {
        original: 'default',
        translation: '初期設定',
        partOfSpeech: 'noun',
        comment: '設定の初期状態を表す場合。',
      },
    ],
    currentTranslation: '標準を選択',
    sourceMatches: [{ source: 'singular', start: 11, end: 18 }],
  },
}

describe('GlossaryFindingCard', () => {
  /**
   * 複数候補と補足がある Warning で、利用者が公式 Glossary と照合できる情報を失わないことを確認する。
   */
  it('when glossary warning has multiple candidates and a comment, should show candidates, context, current translation, and the official glossary link', () => {
    render(<GlossaryFindingCard finding={finding} />)

    expect(screen.getByText('Glossary の訳語を確認してください')).toBeTruthy()
    expect(screen.getByText('default')).toBeTruthy()
    expect(screen.getByText('デフォルト')).toBeTruthy()
    expect(screen.getByText('初期設定')).toBeTruthy()
    expect(screen.getByText('設定の初期状態を表す場合。')).toBeTruthy()
    expect(screen.getByText('標準を選択')).toBeTruthy()

    const link = screen.getByRole('link', {
      name: 'WordPress.org 日本語 Glossary を確認',
    })

    expect(link.getAttribute('href')).toBe(
      'https://translate.wordpress.org/locale/ja/default/glossary/',
    )
  })
})
