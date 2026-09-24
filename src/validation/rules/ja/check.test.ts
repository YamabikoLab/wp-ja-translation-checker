/**
 * 日本語 v1 チェックの公開境界が、Design で定義された12ルールと最小結果契約を満たすことを確認する。
 */

import { describe, expect, it } from 'vitest'
import type { TranslationEntry } from '../../po/interpret-po'
import { check } from './check'

function createEntry(
  entryIndex: number,
  source: string,
  translation: string,
): TranslationEntry {
  return {
    entryIndex,
    source: { singular: source },
    translations: [{ index: 0, text: translation }],
  }
}

function getOnlyResult(
  source: string,
  translation: string,
): ReturnType<typeof check>[number] {
  const result = check([createEntry(7, source, translation)])
  expect(result).toHaveLength(1)

  const item = result[0]
  if (item === undefined) {
    throw new Error('指摘が1件以上返る前提のテストで結果がありません。')
  }

  return item
}

describe('Japanese v1 check public interface', () => {
  /**
   * 指摘のない entry は結果へ含めず、入力全体に問題がない場合は空配列になることを確認する。
   */
  it('when all entries are clean, should return an empty result array', () => {
    expect(
      check([
        createEntry(0, 'Save settings', '設定を保存'),
        createEntry(1, 'View posts', '投稿を表示する'),
      ]),
    ).toEqual([])
  })

  /**
   * 問題のある entry だけが entryIndex を保持して返ることを確認する。
   */
  it('when clean and invalid entries are mixed, should return only entries with findings', () => {
    const result = check([
      createEntry(3, 'Save settings', '設定を保存'),
      createEntry(9, 'Save settings', '設定を保存して下さい'),
    ])

    expect(result).toEqual([
      {
        entryIndex: 9,
        errors: [
          {
            styleGuideItem: '3-6 「下さい / 全て / 既に」などの推奨表記',
            message: '「下さい」は「ください」と表記してください',
          },
        ],
        warnings: [],
      },
    ])
  })

  /**
   * 同じ入力を繰り返し確認しても結果が変化しないことを確認する。
   */
  it('when the same entries are checked repeatedly, should return the same result', () => {
    const entries = [
      createEntry(1, 'Sorry, you cannot continue.', '申し訳ありません、続行できません。'),
      createEntry(2, 'Save settings', '全て保存して下さい'),
    ]

    expect(check(entries)).toEqual(check(entries))
  })

  /**
   * 複数の Error と Warning が同じ entry に共存できることを確認する。
   */
  it('when one entry violates multiple rules, should keep multiple errors and warnings together', () => {
    const result = getOnlyResult(
      'Sorry, users are not allowed to View settings',
      '申し訳ありません。全ての設定を閲覧して下さい',
    )

    expect(result.entryIndex).toBe(7)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.warnings.map((item) => item.styleGuideItem)).toContain(
      '3-3 「XX are/is not allowed to...」を「〜する権限がありません」に統一',
    )
    expect(result.warnings.map((item) => item.styleGuideItem)).toContain(
      '3-4 「Sorry, ...」の Sorry を訳さない',
    )
  })
})

describe('Japanese v1 error rules', () => {
  it('when Japanese punctuation uses an ASCII comma, should report rule 1-1', () => {
    expect(getOnlyResult('Message', '設定,保存').errors).toContainEqual({
      styleGuideItem: '1-1 日本語の句読点',
      message: '日本語の句読点は「、」「。」を使用してください',
    })
  })

  it('when a decimal point is part of a number, should not report rule 1-1', () => {
    expect(check([createEntry(0, 'Version', '1.2')])).toEqual([])
  })

  it('when full-width ASCII is used, should report rule 1-2 with the expected half-width character', () => {
    expect(getOnlyResult('Name', 'Ａです').errors).toContainEqual({
      styleGuideItem: '1-2 英数字・記号の半角表記',
      message: '「Ａ」は半角の「A」で表記してください',
    })
  })

  it('when full-width parentheses are used, should leave them to rule 1-5 instead of rule 1-2', () => {
    const result = getOnlyResult('Label', '設定（詳細）')

    expect(result.errors.map((item) => item.styleGuideItem)).not.toContain(
      '1-2 英数字・記号の半角表記',
    )
    expect(result.errors.map((item) => item.styleGuideItem)).toContain(
      '1-5 半角丸括弧と前後スペース',
    )
  })

  it('when half-width letters touch Japanese text, should report rule 1-4', () => {
    expect(getOnlyResult('WordPress setting', 'WordPress設定').errors).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間に半角スペースを入れてください',
    })
  })

  it('when a Japanese punctuation mark has an adjacent space, should report rule 1-4', () => {
    expect(getOnlyResult('Message', '設定 、保存').errors).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「、」の前後のスペースは不要です',
    })
  })

  it('when a colon has a leading space or lacks one trailing space, should report rule 1-4', () => {
    const result = getOnlyResult('Status', '状態 :有効')

    expect(result.errors).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の前のスペースは不要です',
    })
    expect(result.errors).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の後に半角スペースを入れてください',
    })
  })

  it('when parentheses are full-width or outer spacing is invalid, should report rule 1-5', () => {
    const result = getOnlyResult('Label', '設定(詳細)項目')

    expect(result.errors).toContainEqual({
      styleGuideItem: '1-5 半角丸括弧と前後スペース',
      message: '丸括弧の外側は半角スペース1つにしてください',
    })
  })

  it('when parentheses are at string boundaries or next to Japanese punctuation, should not require outside spaces', () => {
    expect(
      check([createEntry(0, 'Label', '(詳細)、設定。')]),
    ).toEqual([])
  })

  it('when spaces exist just inside parentheses, should report rule 1-6', () => {
    expect(getOnlyResult('Label', '設定 ( 詳細 )').errors).toContainEqual({
      styleGuideItem: '1-6 丸括弧内側の不要スペース',
      message: '丸括弧の内側のスペースは削除してください',
    })
  })

  it('when a period appears before a closing parenthesis inside a larger sentence, should report rule 1-7', () => {
    expect(
      getOnlyResult('Message', '設定 (詳細。) を保存').errors,
    ).toContainEqual({
      styleGuideItem: '1-7 括弧内末尾の句点',
      message: '丸括弧内の末尾の句点は削除してください',
    })
  })

  it('when the whole translation ends with period then closing parenthesis, should report only rule 1-8 for that cause', () => {
    const result = getOnlyResult('Message', '設定 (詳細。)')

    expect(result.errors).toContainEqual({
      styleGuideItem: '1-8 文末括弧と句点の位置',
      message: '文末の句点は丸括弧の外に置いてください',
    })
    expect(result.errors.map((item) => item.styleGuideItem)).not.toContain(
      '1-7 括弧内末尾の句点',
    )
  })

  it('when a translation merely ends with a closing parenthesis, should not infer a missing period', () => {
    expect(check([createEntry(0, 'Label', '(詳細)')])).toEqual([])
  })

  it('when a half-width number is separated from Japanese by a space, should report rule 1-9', () => {
    expect(getOnlyResult('Count', '3 件').errors).toContainEqual({
      styleGuideItem: '1-9 半角数字前後の不要スペース',
      message: '半角数字と日本語の間のスペースは削除してください',
    })
  })

  it('when a numeric placeholder is separated from Japanese by a space, should report rule 1-9', () => {
    expect(getOnlyResult('%d items', '%1$d 件').errors).toContainEqual({
      styleGuideItem: '1-9 半角数字前後の不要スペース',
      message: '半角数字と日本語の間のスペースは削除してください',
    })
  })

  it('when spacing is between half-width tokens such as a time expression, should not report rule 1-9', () => {
    expect(check([createEntry(0, 'Time', '2:00 AM')])).toEqual([])
  })

  it('when recommended expressions are used, should report each rule 3-6 message', () => {
    const result = getOnlyResult('Message', '全て既に確認して下さい')

    expect(result.errors).toEqual(
      expect.arrayContaining([
        {
          styleGuideItem: '3-6 「下さい / 全て / 既に」などの推奨表記',
          message: '「下さい」は「ください」と表記してください',
        },
        {
          styleGuideItem: '3-6 「下さい / 全て / 既に」などの推奨表記',
          message: '「全て」は「すべて」と表記してください',
        },
        {
          styleGuideItem: '3-6 「下さい / 全て / 既に」などの推奨表記',
          message: '「既に」は「すでに」と表記してください',
        },
      ]),
    )
  })
})

describe('Japanese v1 warning rules', () => {
  it('when View XX is translated using 閲覧, should report rule 3-2', () => {
    expect(getOnlyResult('View posts', '投稿を閲覧').warnings).toContainEqual({
      styleGuideItem: '3-2 「View XX」を「〜を表示 (する)」に統一',
      message: '「View XX」の訳し方を確認してください',
    })
  })

  it('when View XX is translated as an action using 表示, should not report rule 3-2', () => {
    expect(check([createEntry(0, 'View posts', '投稿を表示する')])).toEqual([])
  })

  it('when the source is Preview instead of View XX, should not report rule 3-2', () => {
    expect(check([createEntry(0, 'Preview post', '投稿を閲覧')])).toEqual([])
  })

  it('when not allowed to is translated without the permission expression, should report rule 3-3', () => {
    expect(
      getOnlyResult('Users are not allowed to edit this.', 'ユーザーは編集できません。')
        .warnings,
    ).toContainEqual({
      styleGuideItem:
        '3-3 「XX are/is not allowed to...」を「〜する権限がありません」に統一',
      message: '「not allowed to ...」の訳し方を確認してください',
    })
  })

  it('when not allowed to uses the permission expression, should not report rule 3-3', () => {
    expect(
      check([
        createEntry(
          0,
          'User is not allowed to edit this.',
          '編集する権限がありません。',
        ),
      ]),
    ).toEqual([])
  })

  it('when Sorry starts the source and an explicit apology remains in translation, should report rule 3-4', () => {
    expect(
      getOnlyResult(
        'Sorry, you cannot continue.',
        '申し訳ございません。続行できません。',
      ).warnings,
    ).toContainEqual({
      styleGuideItem: '3-4 「Sorry, ...」の Sorry を訳さない',
      message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
    })
  })

  it('when Sorry is not at the source start or the translation has no listed apology prefix, should not report rule 3-4', () => {
    expect(
      check([
        createEntry(0, 'We are sorry, try again.', 'すみません、再試行してください。'),
        createEntry(1, 'Sorry, try again.', '再試行してください。'),
      ]),
    ).toEqual([])
  })
})

describe('technical strings', () => {
  it('when punctuation appears inside a URL or email address, should not treat it as Japanese punctuation', () => {
    expect(
      check([
        createEntry(
          0,
          'Contact',
          'https://example.com または user@example.com を確認',
        ),
      ]),
    ).toEqual([])
  })
})
