/**
 * 日本語 v1 の個別ルールが、それぞれの判定責務を独立して満たすことを確認する。
 *
 * 個別ルールのテストでは他ルールを実行せず、対象ルール固有の正常系・異常系・除外条件を確認する。
 */

import { describe, expect, it } from 'vitest'
import type { TranslationEntry } from '@/po/interpret-po'
import {
  checkHalfWidthCharacters,
  checkInnerParenthesesSpacing,
  checkJapanesePunctuation,
  checkNotAllowedExpression,
  checkNumberSpacing,
  checkParenthesesSpacing,
  checkPeriodInsideParentheses,
  checkRecommendedExpressions,
  checkSentenceEndingParentheses,
  checkSorryPrefix,
  checkSpacingBetweenHalfAndFullWidth,
  checkViewExpression,
} from './rule-checks'
import type { CheckMessage } from './rule-checks'

type RuleCheck = (entry: TranslationEntry) => readonly CheckMessage[]
type MessageWithoutMatches = Omit<CheckMessage, 'matches'>

/**
 * 個別ルールテスト用の翻訳 entry を生成する。
 *
 * @param entryIndex PO Interpretation が付与する entry の識別位置。
 * @param source 原文。
 * @param translation 日本語訳。
 * @returns 個別ルールへ渡す翻訳 entry。
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
 * 複数 entry を同じ個別ルールだけで確認する。
 *
 * @param rule 確認対象の個別ルール。
 * @param entries 確認対象 entry 一覧。
 * @returns 各 entry から得られた指摘。
 */
function checkEntries(
  rule: RuleCheck,
  entries: readonly TranslationEntry[],
): readonly MessageWithoutMatches[] {
  return entries.flatMap((entry) =>
    rule(entry).map(({ styleGuideItem, message }) => ({
      styleGuideItem,
      message,
    })),
  )
}

/**
 * 1件の entry を指定した個別ルールだけで確認する。
 *
 * @param rule 確認対象の個別ルール。
 * @param source 原文。
 * @param translation 日本語訳。
 * @returns 対象ルールから得られた指摘。
 */
function getRuleMessages(
  rule: RuleCheck,
  source: string,
  translation: string,
): readonly MessageWithoutMatches[] {
  return rule(createEntry(7, source, translation)).map(
    ({ styleGuideItem, message }) => ({
      styleGuideItem,
      message,
    }),
  )
}

describe('Japanese v1 rule 1-1', () => {
  /**
   * 日本語の句読点として明確に不適切な代替文字を検出することを確認する。
   *
   * 操作:
   * - 全角カンマを含む日本語翻訳を確認する。
   *
   * 期待結果:
   * - 1-1 の Error と対応する表示メッセージが返る。
   */
  it('when Japanese punctuation uses an unambiguous alternative character, should report rule 1-1', () => {
    expect(
      getRuleMessages(checkJapanesePunctuation, 'Message', '設定，保存'),
    ).toContainEqual({
      styleGuideItem: '1-1 日本語の句読点',
      message: '日本語の句読点は「、」「。」を使用してください',
    })
  })

  /**
   * ASCII のカンマとピリオドを、周囲の日本語だけを理由に句読点と断定しないことを確認する。
   *
   * 操作:
   * - 日本語に隣接する略語のピリオド、文末のピリオド、本文中のカンマを確認する。
   *
   * 期待結果:
   * - 用途を機械的に特定できないため、1-1 の指摘は返らない。
   */
  it('when ASCII comma or period usage is ambiguous, should not report rule 1-1', () => {
    expect(
      checkEntries(checkJapanesePunctuation, [
        createEntry(0, 'N. Revenue', 'N.収益'),
        createEntry(1, 'Notice', '通知が届きます.'),
        createEntry(2, 'Message', '設定,保存'),
      ]),
    ).toEqual([])
  })

  /**
   * 数値内のピリオドを日本語の句点として誤検出しないことを確認する。
   *
   * 操作:
   * - 小数表記を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-1 の指摘は返らない。
   */
  it('when a decimal point is part of a number, should not report rule 1-1', () => {
    expect(
      checkEntries(checkJapanesePunctuation, [
        createEntry(0, 'Version', '1.2'),
      ]),
    ).toEqual([])
  })

  /**
   * 数値内の全角カンマ・ピリオドを、日本語の句読点として扱わないことを確認する。
   *
   * 操作:
   * - 数字に挟まれた全角ピリオドと全角カンマを 1-1 で確認する。
   *
   * 期待結果:
   * - 1-1 の指摘は返らない。
   */
  it('when full-width punctuation is part of a number, should not report rule 1-1', () => {
    expect(
      checkEntries(checkJapanesePunctuation, [
        createEntry(0, 'Version', '1．2'),
        createEntry(1, 'Number', '1，000'),
      ]),
    ).toEqual([])
  })

  /**
   * 連続するピリオドを日本語の句点と断定しないことを確認する。
   *
   * 操作:
   * - 日本語本文の末尾に連続ピリオドを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-1 の指摘は返らない。
   */
  it('when periods form an ellipsis-like sequence, should not report rule 1-1', () => {
    expect(
      checkEntries(checkJapanesePunctuation, [
        createEntry(0, 'Searching...', '検索...'),
      ]),
    ).toEqual([])
  })

  /**
   * URL やメールアドレス内部の句読点記号を日本語本文の 1-1 対象として扱わないことを確認する。
   *
   * 操作:
   * - URL とメールアドレスを含む日本語翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部のピリオド等を理由とする 1-1 の指摘は返らない。
   */
  it('when punctuation appears inside a URL or email address, should not treat it as Japanese punctuation', () => {
    expect(
      checkEntries(checkJapanesePunctuation, [
        createEntry(
          0,
          'Contact',
          'https://example.com または user@example.com を確認',
        ),
      ]),
    ).toEqual([])
  })

  /**
   * 同一指摘に複数の該当箇所がある場合の位置情報を確認する。
   *
   * 操作:
   * - UTF-16 で2 code unit の絵文字に続けて、同じ不適切な句読点を2箇所含む翻訳を確認する。
   *
   * 期待結果:
   * - 1件の CheckMessage に2箇所の [start, end) が UTF-16 code unit offset で保持される。
   */
  it('when the same punctuation finding occurs multiple times, should keep every UTF-16 match range in one message', () => {
    expect(
      checkJapanesePunctuation(createEntry(7, 'Message', '😀設定，保存，完了')),
    ).toEqual([
      {
        styleGuideItem: '1-1 日本語の句読点',
        message: '日本語の句読点は「、」「。」を使用してください',
        matches: [
          { start: 4, end: 5 },
          { start: 7, end: 8 },
        ],
      },
    ])
  })
})

describe('Japanese v1 rule 1-2', () => {
  /**
   * 半角表記すべき全角 ASCII 文字の 1-2 判定を確認する。
   *
   * 操作:
   * - 全角英字を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-2 の Error が返り、対応する半角文字が案内される。
   */
  it('when full-width ASCII is used, should report rule 1-2 with the expected half-width character', () => {
    expect(
      getRuleMessages(checkHalfWidthCharacters, 'Name', 'Ａです'),
    ).toContainEqual({
      styleGuideItem: '1-2 英数字・記号の半角表記',
      message: '「Ａ」は半角の「A」で表記してください',
    })
  })

  /**
   * 数値表記内の全角カンマ・ピリオドを、1-2 の半角表記として案内することを確認する。
   *
   * 操作:
   * - 数字に挟まれた全角ピリオドと全角カンマを 1-2 で確認する。
   *
   * 期待結果:
   * - それぞれ対応する半角のピリオドとカンマが案内される。
   */
  it('when full-width punctuation is part of a number, should report rule 1-2', () => {
    expect(
      getRuleMessages(checkHalfWidthCharacters, 'Version', '1．2'),
    ).toContainEqual({
      styleGuideItem: '1-2 英数字・記号の半角表記',
      message: '「．」は半角の「.」で表記してください',
    })
    expect(
      getRuleMessages(checkHalfWidthCharacters, 'Number', '1，000'),
    ).toContainEqual({
      styleGuideItem: '1-2 英数字・記号の半角表記',
      message: '「，」は半角の「,」で表記してください',
    })
  })

  /**
   * 全角丸括弧を 1-2 の全角 ASCII 文字として重複指摘しないことを確認する。
   *
   * 操作:
   * - 全角丸括弧を含む翻訳を 1-2 で確認する。
   *
   * 期待結果:
   * - 1-2 の指摘は返らない。
   */
  it('when full-width parentheses are checked by rule 1-2, should not report them as full-width ASCII', () => {
    expect(
      checkHalfWidthCharacters(createEntry(0, 'Label', '設定（詳細）')),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 1-4', () => {
  /**
   * 数字以外の半角文字と日本語文字が直接接する場合の 1-4 判定を確認する。
   *
   * 操作:
   * - 半角英字と日本語文字の間にスペースがない翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、半角スペースを入れるべき境界が示される。
   */
  it('when half-width letters touch Japanese text, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'WordPress setting',
        'WordPress設定',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間に半角スペースを入れてください',
    })
  })

  /**
   * 数字以外の半角文字と日本語文字の間に半角スペースが2個以上ある場合の 1-4 判定を確認する。
   *
   * 操作:
   * - 半角英字と日本語文字の間に半角スペースを2個含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、境界の半角スペースを1つにするよう案内される。
   */
  it('when multiple spaces separate half-width and Japanese text, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'WordPress setting',
        'WordPress  設定',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間の半角スペースは1つにしてください',
    })
  })

  /**
   * 数字以外の半角文字と日本語文字の間に全角スペースがある場合の 1-4 判定を確認する。
   *
   * 操作:
   * - 半角英字と日本語文字の間に全角スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、境界を半角スペース1つにするよう案内される。
   */
  it('when a full-width space separates half-width and Japanese text, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'WordPress setting',
        'WordPress　設定',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間の半角スペースは1つにしてください',
    })
  })

  /**
   * 数字以外の半角文字と日本語文字の間が半角スペース1つなら 1-4 を満たすことを確認する。
   *
   * 操作:
   * - 半角英字と日本語文字の間を半角スペース1つで区切った翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の指摘は返らない。
   */
  it('when one space separates half-width and Japanese text, should not report rule 1-4', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(0, 'WordPress setting', 'WordPress 設定'),
      ]),
    ).toEqual([])
  })

  /**
   * NBSP は通常の半角・全角境界で正しい半角スペースとして扱わないことを確認する。
   *
   * 操作:
   * - 半角英字と日本語文字の間に NBSP を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、境界を半角スペース1つにするよう案内される。
   */
  it('when NBSP separates half-width and Japanese text, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'WordPress setting',
        'WordPress\u00a0設定',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間の半角スペースは1つにしてください',
    })
  })

  /**
   * 文字列プレースホルダーと日本語の境界を 1-4 として断定しないことを確認する。
   *
   * 操作:
   * - %s が日本語文字へ直接接する翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の指摘は返らない。
   */
  it('when a string placeholder touches Japanese text, should not infer rule 1-4 spacing', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(0, '%s items', '%s件'),
      ]),
    ).toEqual([])
  })

  /**
   * 名前付き文字列プレースホルダーを本文の半角文字として誤検出しないことを確認する。
   *
   * 操作:
   * - 名前付きプレースホルダーが日本語へ接する翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の指摘は返らない。
   */
  it('when a named string placeholder touches Japanese text, should not infer rule 1-4 spacing', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(0, 'Field', '%(field)sの範囲'),
      ]),
    ).toEqual([])
  })

  /**
   * テンプレートマークアップの区切り記号を 1-4 の本文文字として扱わないことを確認する。
   *
   * 操作:
   * - テンプレートマークアップが日本語へ接する翻訳を確認する。
   *
   * 期待結果:
   * - マークアップ境界を理由とする 1-4 の指摘は返らない。
   */
  it('when template markup touches Japanese text, should not treat the markup delimiter as rule 1-4 text', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(
          0,
          'Link',
          '{{Link}}WooCommerce マーケットプレイス{{/Link}}にアクセス',
        ),
      ]),
    ).toEqual([])
  })

  /**
   * コロン前後の個別スペース規則を確認する。
   *
   * 事前条件:
   * - コロンの前に不要なスペースがあり、後ろに必要なスペースがない。
   *
   * 操作:
   * - 対象翻訳を確認する。
   *
   * 期待結果:
   * - コロン前の不要スペースと後ろのスペース不足がそれぞれ 1-4 として返る。
   */
  it('when a colon has a leading space or lacks one trailing space, should report rule 1-4', () => {
    const result = getRuleMessages(
      checkSpacingBetweenHalfAndFullWidth,
      'Status',
      '状態 :有効',
    )

    expect(result).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の前のスペースは不要です',
    })
    expect(result).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の後にスペースを1つ入れてください',
    })
  })

  /**
   * コロン前の全角スペースも不要なスペースとして 1-4 で検出することを確認する。
   *
   * 操作:
   * - コロンの直前に全角スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、コロン前のスペース不要が案内される。
   */
  it('when a colon has a leading full-width space, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'Status',
        'ユーザー ID　: username',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の前のスペースは不要です',
    })
  })

  /**
   * NBSP もスペースとして扱い、コロン前の不要スペースを検出することを確認する。
   *
   * 操作:
   * - コロンの直前に NBSP を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、コロン前のスペース不要が案内される。
   */
  it('when a colon has a leading NBSP, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'User ID',
        'ユーザー ID\u00a0: username',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「:」の前のスペースは不要です',
    })
  })

  /**
   * NBSP もスペースとして扱い、日本語句読点直後の不要スペースを検出することを確認する。
   *
   * 操作:
   * - 読点の直後に NBSP を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、句読点前後のスペース不要が案内される。
   */
  it('when Japanese punctuation has an adjacent NBSP, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'Message',
        'こんにちは、\u00a0username さん。',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「、」の前後のスペースは不要です',
    })
  })

  /**
   * 疑問符の前に半角スペース1つがある通常の半角・全角境界を正常とすることを確認する。
   *
   * 操作:
   * - 日本語文末と半角疑問符の間を半角スペース1つで区切った翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の指摘は返らない。
   */
  it('when one regular space separates Japanese text and a half-width question mark, should not report rule 1-4', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(0, 'Ready?', '準備ができましたか ?'),
      ]),
    ).toEqual([])
  })

  /**
   * コロン後は半角・全角を問わずスペース1つであれば 1-4 を満たすことを確認する。
   *
   * 操作:
   * - コロンの直後に全角スペースを1つ含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の指摘は返らない。
   */
  it('when a colon has one trailing full-width space, should not report rule 1-4', () => {
    expect(
      checkEntries(checkSpacingBetweenHalfAndFullWidth, [
        createEntry(0, 'User ID', 'ユーザー ID:　username'),
      ]),
    ).toEqual([])
  })

  /**
   * 日本語の句読点前後に不要なスペースがある場合の 1-4 判定を確認する。
   *
   * 操作:
   * - 読点の前に半角スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、句読点前後のスペース不要が案内される。
   */
  it('when a Japanese punctuation mark has an adjacent space, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'Message',
        '設定 、保存',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「、」の前後のスペースは不要です',
    })
  })

  /**
   * 日本語の句読点前後では全角スペースも不要なスペースとして扱うことを確認する。
   *
   * 操作:
   * - 読点の直後に全角スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-4 の Error が返り、句読点前後のスペース不要が案内される。
   */
  it('when Japanese punctuation has an adjacent full-width space, should report rule 1-4', () => {
    expect(
      getRuleMessages(
        checkSpacingBetweenHalfAndFullWidth,
        'Message',
        'こんにちは、　username さん。',
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「、」の前後のスペースは不要です',
    })
  })
})

describe('Japanese v1 rule 1-5', () => {
  /**
   * 本文中の半角丸括弧で外側スペースが不足する場合の 1-5 判定を確認する。
   *
   * 操作:
   * - 丸括弧が前後の本文へ直接接する翻訳を確認する。
   *
   * 期待結果:
   * - 1-5 の Error が返り、外側を半角スペース1つにするよう案内される。
   */
  it('when parentheses are full-width or outer spacing is invalid, should report rule 1-5', () => {
    const result = getRuleMessages(
      checkParenthesesSpacing,
      'Label',
      '設定(詳細)項目',
    )

    expect(result).toContainEqual({
      styleGuideItem: '1-5 半角丸括弧と前後スペース',
      message: '丸括弧の外側は半角スペース1つにしてください',
    })
  })

  /**
   * 1-5 が日本語文字の有無ではなく、本文中の丸括弧と外側スペースを対象とすることを確認する。
   *
   * 操作:
   * - 半角英字と丸括弧が直接接する翻訳を確認する。
   *
   * 期待結果:
   * - 1-5 の外側スペース不足として指摘される。
   */
  it('when half-width parentheses touch non-Japanese text, should report rule 1-5', () => {
    expect(
      getRuleMessages(checkParenthesesSpacing, 'Version', 'WordPress(6.0)'),
    ).toContainEqual({
      styleGuideItem: '1-5 半角丸括弧と前後スペース',
      message: '丸括弧の外側は半角スペース1つにしてください',
    })
  })

  /**
   * コードとして明示された技術文字列内部の丸括弧を 1-5 の対象外にすることを確認する。
   *
   * 操作:
   * - コード表記の内部に丸括弧を含む翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部の丸括弧を理由とする 1-5 の指摘は返らない。
   */
  it('when parentheses appear inside a protected technical string, should not report rule 1-5', () => {
    expect(
      checkEntries(checkParenthesesSpacing, [
        createEntry(0, 'Code', 'コード `foo(bar)` を確認'),
      ]),
    ).toEqual([])
  })

  /**
   * 関数呼び出しの丸括弧を本文の丸括弧として誤検出しないことを確認する。
   *
   * 操作:
   * - 明確な関数呼び出しを含む翻訳を確認する。
   *
   * 期待結果:
   * - 関数呼び出しの丸括弧を理由とする 1-5 の指摘は返らない。
   */
  it('when empty parentheses belong to a function call, should not report rule 1-5', () => {
    expect(
      checkEntries(checkParenthesesSpacing, [
        createEntry(
          0,
          'Function',
          'remove_order_items() は文字列型の項目を期待します',
        ),
      ]),
    ).toEqual([])
  })

  /**
   * マークアップを挟んでも表示本文側の丸括弧外側スペースが正しければ 1-5 としないことを確認する。
   *
   * 操作:
   * - マークアップ内部に丸括弧があり、表示本文との境界には適切なスペースがある翻訳を確認する。
   *
   * 期待結果:
   * - マークアップ自体を表示文字として数えず、1-5 の指摘は返らない。
   */
  it('when parentheses are wrapped by markup with valid visible spacing, should not report rule 1-5', () => {
    expect(
      checkEntries(checkParenthesesSpacing, [
        createEntry(0, 'Status', '保留中 <span class="count">(%s)</span>'),
      ]),
    ).toEqual([])
  })

  /**
   * 名前付き文字列プレースホルダー内部の丸括弧を 1-5 として誤検出しないことを確認する。
   *
   * 操作:
   * - 名前付きプレースホルダーが日本語へ接する翻訳を 1-5 で確認する。
   *
   * 期待結果:
   * - プレースホルダー内部の丸括弧を理由とする指摘は返らない。
   */
  it('when a named string placeholder is checked by rule 1-5, should not report its parentheses', () => {
    expect(
      checkParenthesesSpacing(createEntry(0, 'Field', '%(field)sの範囲')),
    ).toEqual([])
  })

  /**
   * 丸括弧外側スペースの文字列境界・日本語句読点例外を確認する。
   *
   * 操作:
   * - 文字列先頭の開き括弧と、日本語句読点へ接する閉じ括弧を含む翻訳を確認する。
   *
   * 期待結果:
   * - 例外位置へ外側スペースを要求せず、1-5 の指摘は返らない。
   */
  it('when parentheses are at string boundaries or next to Japanese punctuation, should not require outside spaces', () => {
    expect(
      checkEntries(checkParenthesesSpacing, [
        createEntry(0, 'Label', '(詳細)、設定。'),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 1-6', () => {
  /**
   * 丸括弧の直後・直前に不要なスペースがある場合の 1-6 判定を確認する。
   *
   * 操作:
   * - 丸括弧内側に半角スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-6 の Error が返り、内側スペースの削除が案内される。
   */
  it('when spaces exist just inside parentheses, should report rule 1-6', () => {
    expect(
      getRuleMessages(checkInnerParenthesesSpacing, 'Label', '設定 ( 詳細 )'),
    ).toContainEqual({
      styleGuideItem: '1-6 丸括弧内側の不要スペース',
      message: '丸括弧の内側のスペースは削除してください',
    })
  })

  /**
   * 技術文字列内部の丸括弧内側スペースを 1-6 の対象外にすることを確認する。
   *
   * 操作:
   * - コード表記の内部に丸括弧と内側スペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部を理由とする 1-6 の指摘は返らない。
   */
  it('when inner parentheses spacing appears inside a protected technical string, should not report rule 1-6', () => {
    expect(
      checkEntries(checkInnerParenthesesSpacing, [
        createEntry(0, 'Code', 'コード `foo( bar )` を確認'),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 1-7', () => {
  /**
   * 文中の丸括弧内末尾に句点がある場合の 1-7 判定を確認する。
   *
   * 操作:
   * - 文の途中に「。)」を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-7 の Error が返り、括弧内末尾の句点削除が案内される。
   */
  it('when a period appears before a closing parenthesis inside a larger sentence, should report rule 1-7', () => {
    expect(
      getRuleMessages(
        checkPeriodInsideParentheses,
        'Message',
        '設定 (詳細。) を保存',
      ),
    ).toContainEqual({
      styleGuideItem: '1-7 括弧内末尾の句点',
      message: '丸括弧内の末尾の句点は削除してください',
    })
  })

  /**
   * 技術文字列内部の括弧直前句点を 1-7 の対象外にすることを確認する。
   *
   * 操作:
   * - コード表記の内部に「。)」を含む翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部を理由とする 1-7 の指摘は返らない。
   */
  it('when a period before a closing parenthesis appears inside a protected technical string, should not report rule 1-7', () => {
    expect(
      checkEntries(checkPeriodInsideParentheses, [
        createEntry(0, 'Code', 'コード `foo(。)` を確認'),
      ]),
    ).toEqual([])
  })

  /**
   * 翻訳全体の末尾にある「。)」を 1-7 として重複指摘しないことを確認する。
   *
   * 操作:
   * - 翻訳全体が「。)」で終わる文を 1-7 で確認する。
   *
   * 期待結果:
   * - 文末括弧の句点位置は 1-8 の対象となるため、1-7 の指摘は返らない。
   */
  it('when the translation ends with period then closing parenthesis, should not report rule 1-7', () => {
    expect(
      checkPeriodInsideParentheses(createEntry(0, 'Message', '設定 (詳細。)')),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 1-8', () => {
  /**
   * 閉じ括弧で終わるだけの翻訳から句点不足を推測しないことを確認する。
   *
   * 操作:
   * - 末尾が「)」だが「。)」ではない翻訳を確認する。
   *
   * 期待結果:
   * - 1-8 の指摘は返らない。
   */
  it('when a translation merely ends with a closing parenthesis, should not infer a missing period', () => {
    expect(
      checkEntries(checkSentenceEndingParentheses, [
        createEntry(0, 'Label', '(詳細)'),
      ]),
    ).toEqual([])
  })

  /**
   * 翻訳末尾の「。)」が技術文字列内部にある場合は 1-8 としないことを確認する。
   *
   * 操作:
   * - コード表記そのものが「。)」で終わる翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部を理由とする 1-8 の指摘は返らない。
   */
  it('when a protected technical string ends with period then closing parenthesis, should not report rule 1-8', () => {
    expect(
      checkEntries(checkSentenceEndingParentheses, [
        createEntry(0, 'Code', '`foo(。)`'),
      ]),
    ).toEqual([])
  })

  /**
   * 翻訳全体の末尾にある「。)」を 1-8 として検出することを確認する。
   *
   * 操作:
   * - 翻訳全体が「。)」で終わる文を 1-8 で確認する。
   *
   * 期待結果:
   * - 文末の句点を丸括弧の外へ移す指摘が返る。
   */
  it('when the translation ends with period then closing parenthesis, should report rule 1-8', () => {
    expect(
      checkSentenceEndingParentheses(
        createEntry(0, 'Message', '設定 (詳細。)'),
      ),
    ).toContainEqual({
      styleGuideItem: '1-8 文末括弧と句点の位置',
      message: '文末の句点は丸括弧の外に置いてください',
      matches: [{ start: 6, end: 8 }],
    })
  })
})

describe('Japanese v1 rule 1-9', () => {
  /**
   * 半角数字と日本語の間に不要なスペースがある場合の 1-9 判定を確認する。
   *
   * 操作:
   * - 半角数字と日本語単位の間にスペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-9 の Error が返り、不要スペースの削除が案内される。
   */
  it('when a half-width number is separated from Japanese by a space, should report rule 1-9', () => {
    expect(getRuleMessages(checkNumberSpacing, 'Count', '3 件')).toContainEqual(
      {
        styleGuideItem: '1-9 半角数字前後の不要スペース',
        message: '半角数字と日本語の間のスペースは削除してください',
      },
    )
  })

  /**
   * 数値プレースホルダーを半角数字と同様に 1-9 で扱うことを確認する。
   *
   * 操作:
   * - 数値プレースホルダーと日本語の間にスペースを含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-9 の Error が返り、不要スペースの削除が案内される。
   */
  it('when a numeric placeholder is separated from Japanese by a space, should report rule 1-9', () => {
    expect(
      getRuleMessages(checkNumberSpacing, '%d items', '%1$d 件'),
    ).toContainEqual({
      styleGuideItem: '1-9 半角数字前後の不要スペース',
      message: '半角数字と日本語の間のスペースは削除してください',
    })
  })

  /**
   * 半角文字同士の表記に必要なスペースを 1-9 として誤検出しないことを確認する。
   *
   * 操作:
   * - 時刻と英字表記を含む翻訳を確認する。
   *
   * 期待結果:
   * - 1-9 の指摘は返らない。
   */
  it('when spacing is between half-width tokens such as a time expression, should not report rule 1-9', () => {
    expect(
      checkEntries(checkNumberSpacing, [createEntry(0, 'Time', '2:00 AM')]),
    ).toEqual([])
  })

  /**
   * 技術表現に含まれる数字を日本語本文との単独数字境界として誤検出しないことを確認する。
   *
   * 操作:
   * - 文字コード、規格番号、ハッシュ名、バージョン、寸法を含む翻訳をまとめて確認する。
   *
   * 期待結果:
   * - 技術表現中の数字を理由とする 1-9 の指摘は返らない。
   */
  it('when a digit is part of a technical token, should not report rule 1-9', () => {
    expect(
      checkEntries(checkNumberSpacing, [
        createEntry(0, 'Encoding', 'ファイルは UTF-8 として扱います'),
        createEntry(1, 'Date', 'ISO8601 準拠の日付'),
        createEntry(2, 'Hash', 'MD5 ハッシュ'),
        createEntry(3, 'Version', 'WooCommerce 5.3 で導入されました'),
        createEntry(4, 'Image', '150x50 ピクセルの画像'),
      ]),
    ).toEqual([])
  })

  /**
   * コードとして明示された技術文字列内部の数字と日本語のスペースを 1-9 の対象外にすることを確認する。
   *
   * 操作:
   * - コード表記の内部に「数字 + スペース + 日本語」を含む翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列内部を理由とする 1-9 の指摘は返らない。
   */
  it('when number spacing appears inside protected code, should not report rule 1-9', () => {
    expect(
      checkEntries(checkNumberSpacing, [
        createEntry(0, 'Code', 'コード `3 件` を確認'),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 3-2', () => {
  /**
   * 原文が動詞の「View XX」で、推奨外の訳語が使われた場合の 3-2 判定を確認する。
   *
   * 操作:
   * - 「View posts」を「投稿を閲覧」とした翻訳を確認する。
   *
   * 期待結果:
   * - 3-2 の Warning と確認メッセージが返る。
   */
  it('when View XX is translated using 閲覧, should report rule 3-2', () => {
    expect(
      getRuleMessages(checkViewExpression, 'View posts', '投稿を閲覧'),
    ).toContainEqual({
      styleGuideItem: '3-2 「View XX」を「〜を表示 (する)」に統一',
      message: '「View XX」の訳し方を確認してください',
    })
  })

  /**
   * 「View XX」が推奨される「〜を表示する」で訳されている場合を正常とすることを確認する。
   *
   * 操作:
   * - 「View posts」を「投稿を表示する」とした翻訳を確認する。
   *
   * 期待結果:
   * - 3-2 の Warning は返らない。
   */
  it('when View XX is translated as an action using 表示, should not report rule 3-2', () => {
    expect(
      checkEntries(checkViewExpression, [
        createEntry(0, 'View posts', '投稿を表示する'),
      ]),
    ).toEqual([])
  })

  /**
   * 3-2 を原文の「View XX」パターンに限定することを確認する。
   *
   * 操作:
   * - 原文が「Preview」で始まる翻訳を確認する。
   *
   * 期待結果:
   * - 翻訳に「閲覧」があっても 3-2 の Warning は返らない。
   */
  it('when the source is Preview instead of View XX, should not report rule 3-2', () => {
    expect(
      checkEntries(checkViewExpression, [
        createEntry(0, 'Preview post', '投稿を閲覧'),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 3-3', () => {
  /**
   * 原文が権限不足の対象構文で、既定の権限表現が使われていない場合の 3-3 判定を確認する。
   *
   * 操作:
   * - 「are not allowed to」を含む原文と、権限表現を使わない翻訳を確認する。
   *
   * 期待結果:
   * - 3-3 の Warning と確認メッセージが返る。
   */
  it('when not allowed to is translated without the permission expression, should report rule 3-3', () => {
    expect(
      getRuleMessages(
        checkNotAllowedExpression,
        'Users are not allowed to edit this.',
        'ユーザーは編集できません。',
      ),
    ).toContainEqual({
      styleGuideItem:
        '3-3 「XX are/is not allowed to...」を「〜する権限がありません」に統一',
      message: '「not allowed to ...」の訳し方を確認してください',
    })
  })

  /**
   * 権限不足の対象構文が「〜する権限がありません」と訳されている場合を正常とすることを確認する。
   *
   * 操作:
   * - 対象原文と既定の権限表現を使う翻訳を確認する。
   *
   * 期待結果:
   * - 3-3 の Warning は返らない。
   */
  it('when not allowed to uses the permission expression, should not report rule 3-3', () => {
    expect(
      checkEntries(checkNotAllowedExpression, [
        createEntry(
          0,
          'User is not allowed to edit this.',
          '編集する権限がありません。',
        ),
      ]),
    ).toEqual([])
  })

  /**
   * 権限不足ではない制約表現の「not allowed to」を 3-3 として誤検出しないことを確認する。
   *
   * 操作:
   * - 値に対する制約を表す「is not allowed to」を含む原文を確認する。
   *
   * 期待結果:
   * - 権限不足と十分に判断できないため、3-3 の Warning は返らない。
   */
  it('when not allowed to describes a value constraint, should not report rule 3-3', () => {
    expect(
      checkEntries(checkNotAllowedExpression, [
        createEntry(
          0,
          'This value is not allowed to contain spaces.',
          'この値にスペースを含めることはできません。',
        ),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 3-4', () => {
  /**
   * 原文先頭の「Sorry,」に対応する謝罪表現が翻訳先頭へ残る場合の 3-4 判定を確認する。
   *
   * 操作:
   * - 「Sorry,」で始まる原文と、明示的な謝罪表現で始まる翻訳を確認する。
   *
   * 期待結果:
   * - 3-4 の Warning と謝罪表現の削除案内が返る。
   */
  it('when Sorry starts the source and an explicit apology remains in translation, should report rule 3-4', () => {
    expect(
      getRuleMessages(
        checkSorryPrefix,
        'Sorry, you cannot continue.',
        '申し訳ございません。続行できません。',
      ),
    ).toContainEqual({
      styleGuideItem: '3-4 「Sorry, ...」の Sorry を訳さない',
      message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
    })
  })

  /**
   * 3-4 を明示された原文位置と謝罪表現の組み合わせに限定することを確認する。
   *
   * 事前条件:
   * - 「Sorry」が原文先頭にないケースと、翻訳先頭に対象謝罪表現がないケースがある。
   *
   * 操作:
   * - 両ケースをまとめて確認する。
   *
   * 期待結果:
   * - どちらにも 3-4 の Warning は返らない。
   */
  it('when Sorry is not at the source start or the translation has no listed apology prefix, should not report rule 3-4', () => {
    expect(
      checkEntries(checkSorryPrefix, [
        createEntry(
          0,
          'We are sorry, try again.',
          'すみません、再試行してください。',
        ),
        createEntry(1, 'Sorry, try again.', '再試行してください。'),
      ]),
    ).toEqual([])
  })
})

describe('Japanese v1 rule 3-6', () => {
  /**
   * v1 で定義した3組の推奨表記を 3-6 としてそれぞれ検出することを確認する。
   *
   * 事前条件:
   * - 翻訳本文に「下さい」「全て」「既に」がすべて含まれる。
   *
   * 操作:
   * - 対象翻訳を確認する。
   *
   * 期待結果:
   * - 3つの表記それぞれについて 3-6 の Error と期待表記が返る。
   */
  it('when recommended expressions are used, should report each rule 3-6 message', () => {
    const result = getRuleMessages(
      checkRecommendedExpressions,
      'Message',
      '全て既に確認して下さい',
    )

    expect(result).toEqual(
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

  /**
   * 技術文字列内部だけにある推奨表記を 3-6 の対象外にすることを確認する。
   *
   * 操作:
   * - コード表記の内部だけに「全て」を含む翻訳を確認する。
   *
   * 期待結果:
   * - 3-6 の指摘は返らない。
   */
  it('when a recommended expression appears only inside protected code, should not report rule 3-6', () => {
    expect(
      checkEntries(checkRecommendedExpressions, [
        createEntry(0, 'Code', 'コード `全て` をそのまま使用'),
      ]),
    ).toEqual([])
  })

  /**
   * 同じ推奨表記が技術文字列と通常本文の両方にある場合の 3-6 判定を確認する。
   *
   * 操作:
   * - コード内部と通常本文の双方に「全て」を含む翻訳を確認する。
   *
   * 期待結果:
   * - 技術文字列側は除外し、通常本文側を根拠とする 3-6 の指摘が1件だけ返る。
   */
  it('when a recommended expression appears both inside protected code and normal text, should report rule 3-6 once', () => {
    const result = getRuleMessages(
      checkRecommendedExpressions,
      'Message',
      'コード `全て` はそのままにして、全ての設定を保存',
    )

    expect(
      result.filter(
        (item) =>
          item.styleGuideItem ===
            '3-6 「下さい / 全て / 既に」などの推奨表記' &&
          item.message === '「全て」は「すべて」と表記してください',
      ),
    ).toHaveLength(1)
  })
})

describe('Japanese v1 match ranges', () => {
  /**
   * 同じ 1-4 の指摘内容に該当する複数箇所を、1件の指摘へまとめて位置情報として保持することを確認する。
   *
   * 操作:
   * - 半角英字と日本語の境界違反を同じ文中に2箇所含む翻訳を確認する。
   *
   * 期待結果:
   * - 同じ表示メッセージの指摘は1件となる。
   * - 2箇所それぞれの [start, end) が UTF-16 code unit offset で保持される。
   */
  it('when the same spacing boundary violation occurs multiple times, should keep all match ranges in one rule 1-4 message', () => {
    expect(
      checkSpacingBetweenHalfAndFullWidth(
        createEntry(0, 'Settings', 'WordPress設定とPlugin設定'),
      ),
    ).toContainEqual({
      styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
      message: '「s」と「設」の間に半角スペースを入れてください',
      matches: [
        { start: 8, end: 10 },
        { start: 17, end: 19 },
      ],
    })
  })

  /**
   * コロン前後の異なる 1-4 指摘が、それぞれ自分の問題箇所だけを位置情報として持つことを確認する。
   *
   * 操作:
   * - コロン前に不要スペースがあり、コロン後の必要スペースがない翻訳を確認する。
   *
   * 期待結果:
   * - 前側と後側の指摘が別々に返る。
   * - 各指摘の matches が対応する境界だけを示す。
   */
  it('when colon spacing has separate before and after violations, should keep distinct match ranges for each rule 1-4 message', () => {
    expect(
      checkSpacingBetweenHalfAndFullWidth(
        createEntry(0, 'Status', '状態 :有効'),
      ),
    ).toEqual(
      expect.arrayContaining([
        {
          styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
          message: '「:」の前のスペースは不要です',
          matches: [{ start: 2, end: 4 }],
        },
        {
          styleGuideItem: '1-4 半角文字と全角文字の間のスペース',
          message: '「:」の後にスペースを1つ入れてください',
          matches: [{ start: 3, end: 5 }],
        },
      ]),
    )
  })

  /**
   * 同じ推奨外表記が複数回現れる場合に、3-6 の指摘件数を増やさず全箇所を位置情報へまとめることを確認する。
   *
   * 操作:
   * - UTF-16 で2 code unit の絵文字に続けて「全て」を2箇所含む翻訳を確認する。
   *
   * 期待結果:
   * - 「全て」に対する指摘は1件だけ返る。
   * - 2箇所の位置が UTF-16 code unit offset で保持される。
   */
  it('when one recommended expression appears multiple times, should keep every UTF-16 range in one rule 3-6 message', () => {
    expect(
      checkRecommendedExpressions(
        createEntry(0, 'Save all', '😀全て保存、全て確認'),
      ),
    ).toContainEqual({
      styleGuideItem: '3-6 「下さい / 全て / 既に」などの推奨表記',
      message: '「全て」は「すべて」と表記してください',
      matches: [
        { start: 2, end: 4 },
        { start: 7, end: 9 },
      ],
    })
  })

  /**
   * 翻訳内の単一箇所へ機械的に限定できない Warning では、誤った強調位置を生成しないことを確認する。
   *
   * 操作:
   * - 3-2 の確認対象となる View の翻訳を確認する。
   *
   * 期待結果:
   * - Warning 自体は返る。
   * - matches は空配列となる。
   */
  it('when a warning applies to the translation expression as a whole, should not invent a match range', () => {
    expect(
      checkViewExpression(createEntry(0, 'View posts', '投稿を閲覧')),
    ).toEqual([
      {
        styleGuideItem: '3-2 「View XX」を「〜を表示 (する)」に統一',
        message: '「View XX」の訳し方を確認してください',
        matches: [],
      },
    ])
  })
})

