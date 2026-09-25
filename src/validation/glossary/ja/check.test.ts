/**
 * 日本語 Glossary Check の語検出、候補照合、plural form の公開契約を確認する。
 */

import { describe, expect, it } from 'vitest'
import type { TranslationEntry } from '@/po/interpret-po'
import { checkJapaneseGlossary } from './check'
import type { GlossaryEntry } from './glossary'

const glossary: readonly GlossaryEntry[] = [
  { original: 'post', translation: '投稿', partOfSpeech: 'noun' },
  { original: 'post', translation: '投稿する', partOfSpeech: 'verb' },
  { original: 'single post', translation: '個別投稿', comment: '投稿文脈' },
  { original: 'website', translation: 'サイト' },
]

const createEntry = (
  source: TranslationEntry['source'],
  translations: TranslationEntry['translations'],
): TranslationEntry => ({ entryIndex: 0, source, translations })

describe('Japanese glossary check', () => {
  it('when source has no glossary term, should return no warning', () => {
    expect(
      checkJapaneseGlossary(
        [createEntry({ singular: 'Save settings' }, [{ index: 0, text: '設定を保存' }])],
        glossary,
      ),
    ).toEqual([])
  })

  it('when glossary term differs only by ASCII case, should detect it without matching inside another alphanumeric word', () => {
    expect(
      checkJapaneseGlossary(
        [createEntry({ singular: 'POST and poster' }, [{ index: 0, text: '投稿を表示' }])],
        glossary,
      ),
    ).toEqual([])
  })

  it('when a longer phrase overlaps a shorter term, should report only the longer phrase for that range', () => {
    const result = checkJapaneseGlossary(
      [createEntry({ singular: 'Open the single post' }, [{ index: 0, text: '投稿を開く' }])],
      glossary,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.originalTerm).toBe('single post')
    expect(result[0]?.candidates[0]?.comment).toBe('投稿文脈')
  })

  it('when any registered translation candidate exists, should not warn', () => {
    expect(
      checkJapaneseGlossary(
        [createEntry({ singular: 'Publish post' }, [{ index: 0, text: '投稿する操作' }])],
        glossary,
      ),
    ).toEqual([])
  })

  it('when singular and plural contain the same term, should deduplicate the term and check every translation form independently', () => {
    const result = checkJapaneseGlossary(
      [
        createEntry(
          { singular: 'website', plural: 'websites for website' },
          [
            { index: 0, text: 'サイト' },
            { index: 1, text: 'Web ページ' },
          ],
        ),
      ],
      glossary,
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      entryIndex: 0,
      translationFormIndex: 1,
      originalTerm: 'website',
      currentTranslation: 'Web ページ',
    })
    expect(result[0]?.sourceMatches.map((match) => match.source)).toEqual([
      'singular',
      'plural',
    ])
  })
})
