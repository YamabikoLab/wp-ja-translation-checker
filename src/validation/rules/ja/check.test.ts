/**
 * 日本語 v1 チェックの公開境界が、結果の絞り込み・集約・順序に関する契約を満たすことを確認する。
 */

import { describe, expect, it } from 'vitest'
import type { TranslationEntry } from '@/po/interpret-po'
import { check } from './check'

/**
 * 公開境界テスト用の翻訳 entry を生成する。
 *
 * @param entryIndex PO Interpretation が付与する entry の識別位置。
 * @param source 原文。
 * @param translation 日本語訳。
 * @returns 日本語 v1 チェックへ渡す翻訳 entry。
 */
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

/**
 * 1件の entry で指摘が返る公開結果を取得する。
 *
 * @param source 原文。
 * @param translation 日本語訳。
 * @returns 対象 entry の確認結果。
 */
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
   * 問題のない複数 entry を確認した場合の公開結果を確認する。
   *
   * 事前条件:
   * - すべての翻訳が日本語 v1 の対象ルールを満たしている。
   *
   * 操作:
   * - 複数 entry をまとめて日本語 v1 チェックへ渡す。
   *
   * 期待結果:
   * - 問題のない entry は結果に含まれず、空配列が返る。
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
   * 正常な entry と指摘対象 entry が混在する場合の結果を確認する。
   *
   * 事前条件:
   * - 一方は正常で、もう一方は 3-6 の対象表記を含む。
   *
   * 操作:
   * - 両方の entry をまとめて確認する。
   *
   * 期待結果:
   * - 指摘対象 entry だけが元の entryIndex と Error を保持して返る。
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
   * 同じ入力に対する日本語 v1 チェックの決定性を確認する。
   *
   * 事前条件:
   * - Error と Warning を含み得る同一の entry 一覧がある。
   *
   * 操作:
   * - 同じ entry 一覧を繰り返し確認する。
   *
   * 期待結果:
   * - 毎回同じ内容・順序の結果が返る。
   */
  it('when the same entries are checked repeatedly, should return the same result', () => {
    const entries = [
      createEntry(
        1,
        'Sorry, you cannot continue.',
        '申し訳ありません、続行できません。',
      ),
      createEntry(2, 'Save settings', '全て保存して下さい'),
    ]

    expect(check(entries)).toEqual(check(entries))
  })

  /**
   * 日本語 v1 チェックが入力 entry を変更しないことを確認する。
   *
   * 事前条件:
   * - 正常な翻訳と指摘対象の翻訳を含む entry 一覧がある。
   *
   * 操作:
   * - entry 一覧を確認する。
   *
   * 期待結果:
   * - 確認後も入力 entry の内容が確認前と同一である。
   */
  it('when entries are checked, should not modify the input entries', () => {
    const entries = [
      createEntry(4, 'Save settings', '全て保存して下さい'),
      createEntry(5, 'View posts', '投稿を表示する'),
    ]
    const before = structuredClone(entries)

    check(entries)

    expect(entries).toEqual(before)
  })

  /**
   * 1つの entry が複数ルールに該当する場合の結果集約を確認する。
   *
   * 事前条件:
   * - 同じ翻訳に複数の Error と Warning の原因が存在する。
   *
   * 操作:
   * - 対象 entry を確認する。
   *
   * 期待結果:
   * - 同じ entryIndex の結果に複数の Error と Warning が共存する。
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
