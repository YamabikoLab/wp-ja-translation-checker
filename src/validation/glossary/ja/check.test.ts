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

/**
 * Glossary Check の公開入力となる1件の翻訳 entry を生成する。
 *
 * @param source singular / plural の原文。
 * @param translations 確認対象の翻訳フォーム。
 * @returns entryIndex 0 の翻訳 entry。
 */
const createEntry = (
  source: TranslationEntry['source'],
  translations: TranslationEntry['translations'],
): TranslationEntry => ({ entryIndex: 0, source, translations })

describe('Japanese glossary check', () => {
  /**
   * 原文に Glossary 登録語がない場合は、翻訳内容にかかわらず Glossary Warning を生成しないことを確認する。
   *
   * 事前条件:
   * - 原文に Glossary 登録語が含まれない。
   *
   * 操作:
   * - Glossary Check を実行する。
   *
   * 期待結果:
   * - Warning を返さない。
   */
  it('when source has no glossary term, should return no warning', () => {
    expect(
      checkJapaneseGlossary(
        [
          createEntry({ singular: 'Save settings' }, [
            { index: 0, text: '設定を保存' },
          ]),
        ],
        glossary,
      ),
    ).toEqual([])
  })

  /**
   * Glossary term は ASCII の大文字小文字を区別せず検出する一方、
   * より長い英数字語の一部として現れる文字列は対象にしないことを確認する。
   *
   * 事前条件:
   * - 原文に大文字表記の Glossary term が独立語としてある。
   * - 別の原文には同じ文字列が英数字語の途中にだけ含まれる。
   *
   * 操作:
   * - それぞれ Glossary Check を実行する。
   *
   * 期待結果:
   * - 独立語は Glossary 訳語で成立する。
   * - 英数字語の途中一致だけでは Warning を返さない。
   */
  it('when glossary term differs only by ASCII case or appears inside another alphanumeric word, should match only the standalone term', () => {
    expect(
      checkJapaneseGlossary(
        [createEntry({ singular: 'POST' }, [{ index: 0, text: '投稿' }])],
        glossary,
      ),
    ).toEqual([])

    expect(
      checkJapaneseGlossary(
        [createEntry({ singular: 'poster' }, [{ index: 0, text: 'ポスター' }])],
        glossary,
      ),
    ).toEqual([])
  })

  /**
   * 長い Glossary 語句とその部分語が同じ原文範囲で重なる場合は、長い語句だけを確認対象にすることを確認する。
   *
   * 事前条件:
   * - 原文に `single post` があり、`post` と範囲が重なる。
   * - 翻訳は短い語句の候補だけを含み、長い語句の候補は含まない。
   *
   * 操作:
   * - Glossary Check を実行する。
   *
   * 期待結果:
   * - `single post` の Warning だけを返す。
   */
  it('when a longer phrase overlaps a shorter term, should report only the longer phrase for that range', () => {
    const result = checkJapaneseGlossary(
      [
        createEntry({ singular: 'Open the single post' }, [
          { index: 0, text: '投稿を開く' },
        ]),
      ],
      glossary,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.originalTerm).toBe('single post')
    expect(result[0]?.candidates[0]?.comment).toBe('投稿文脈')
  })

  /**
   * 同一原語に複数の登録訳語がある場合は、そのいずれかを満たせば Warning にしないことを確認する。
   *
   * 事前条件:
   * - `post` に複数の登録訳語がある。
   * - 翻訳がそのうち1候補を含む。
   *
   * 操作:
   * - Glossary Check を実行する。
   *
   * 期待結果:
   * - Warning を返さない。
   */
  it('when any registered translation candidate exists, should not warn', () => {
    expect(
      checkJapaneseGlossary(
        [
          createEntry({ singular: 'Publish post' }, [
            { index: 0, text: '投稿する操作' },
          ]),
        ],
        glossary,
      ),
    ).toEqual([])
  })

  /**
   * 空訳語だけの Glossary entry は、空文字列が常に一致することを利用した誤判定にも、
   * 自動的な不一致 Warning にもしてはならないことを確認する。
   *
   * 事前条件:
   * - 原文に Glossary 登録語がある。
   * - その登録語の訳語が空文字列だけである。
   *
   * 操作:
   * - Glossary Check を実行する。
   *
   * 期待結果:
   * - 自動判定できないため Warning を返さない。
   */
  it('when a glossary term has only an empty translation, should leave it out of automatic warnings', () => {
    const glossaryWithEmptyTranslation: readonly GlossaryEntry[] = [
      {
        original: 'Sorry,',
        translation: '',
        partOfSpeech: 'expression',
        comment: 'この部分は翻訳しません。',
      },
    ]

    expect(
      checkJapaneseGlossary(
        [
          createEntry({ singular: 'Sorry, something went wrong.' }, [
            { index: 0, text: '問題が発生しました。' },
          ]),
        ],
        glossaryWithEmptyTranslation,
      ),
    ).toEqual([])
  })

  /**
   * singular / plural の双方で同じ Glossary term が見つかっても term 自体は重複させず、
   * 各翻訳フォームは独立して成立判定することを確認する。
   *
   * 事前条件:
   * - singular と plural の双方に `website` がある。
   * - 1つ目の翻訳フォームは登録訳語を含み、2つ目は含まない。
   *
   * 操作:
   * - Glossary Check を実行する。
   *
   * 期待結果:
   * - 不一致の翻訳フォームだけ1件の Warning になる。
   * - Warning は singular / plural 双方の一致位置を保持する。
   */
  it('when singular and plural contain the same term, should deduplicate the term and check every translation form independently', () => {
    const result = checkJapaneseGlossary(
      [
        createEntry({ singular: 'website', plural: 'websites for website' }, [
          { index: 0, text: 'サイト' },
          { index: 1, text: 'Web ページ' },
        ]),
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
