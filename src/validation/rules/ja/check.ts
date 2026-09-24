/**
 * WordPress 日本語翻訳スタイルガイド v1 の対象ルールを評価する公開入口を提供する。
 *
 * 個別チェックの構造はこの責務内に閉じ、呼び出し元は翻訳 entry 一覧をまとめて渡す。
 * 問題のない entry は結果に含めず、同じ入力からは同じ順序の結果を返す。
 */

import type { TranslationEntry } from '../../po/interpret-po'

/**
 * 1件の指摘で利用者へ提示する最小情報を表す。
 */
export type CheckMessage = {
  styleGuideItem: string
  message: string
}

/**
 * 1つの翻訳 entry で検出された Error / Warning を表す。
 */
export type TranslationCheckResult = {
  entryIndex: number
  errors: readonly CheckMessage[]
  warnings: readonly CheckMessage[]
}

const STYLE_GUIDE = {
  punctuation: '1-1 日本語の句読点',
  halfWidth: '1-2 英数字・記号の半角表記',
  halfFullSpacing: '1-4 半角文字と全角文字の間のスペース',
  parentheses: '1-5 半角丸括弧と前後スペース',
  innerParenthesesSpacing: '1-6 丸括弧内側の不要スペース',
  periodInsideParentheses: '1-7 括弧内末尾の句点',
  sentenceEndingParentheses: '1-8 文末括弧と句点の位置',
  numberSpacing: '1-9 半角数字前後の不要スペース',
  viewExpression: '3-2 「View XX」を「〜を表示 (する)」に統一',
  notAllowedExpression:
    '3-3 「XX are/is not allowed to...」を「〜する権限がありません」に統一',
  sorryPrefix: '3-4 「Sorry, ...」の Sorry を訳さない',
  recommendedExpressions: '3-6 「下さい / 全て / 既に」などの推奨表記',
} as const

const JAPANESE_CHARACTER =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
const ASCII_NON_DIGIT = /[\x21-\x2F\x3A-\x7E]/
const NO_SPACE_JAPANESE_PUNCTUATION = new Set(['『', '』', '「', '」', '。', '、'])
const OUTER_PARENTHESES_SPACE_EXCEPTIONS = new Set([
  '『',
  '』',
  '「',
  '」',
  '。',
  '、',
])
const APOLOGY_PREFIXES = [
  'すみませんが',
  'すみません',
  '申し訳ございません',
  '申し訳ありません',
  'ごめんなさい',
] as const

type ProtectedText = {
  text: string
  protectedIndexes: ReadonlySet<number>
}

/**
 * 技術的な文字列の内部を日本語本文の表記規則として誤検出しないため、
 * 明示的に判別できる代表的な技術文字列の位置を保護する。
 *
 * @param text 確認対象の翻訳。
 * @returns 元文字列と、本文ルールの判定対象外にする文字位置。
 */
function protectTechnicalText(text: string): ProtectedText {
  const protectedIndexes = new Set<number>()
  const patterns = [
    /https?:\/\/[^\s]+/giu,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu,
    /<[^>]+>/gu,
    /`[^`]+`/gu,
    /(?:[A-Z]:\\|\/)\S+/giu,
  ]

  // 明示的に技術文字列と判断できる範囲だけを保護し、周囲の日本語本文は通常どおり確認する。
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const start = match.index
      const value = match[0]

      for (let index = start; index < start + value.length; index += 1) {
        protectedIndexes.add(index)
      }
    }
  }

  return { text, protectedIndexes }
}

/**
 * 日本語 v1 の各チェックをすべて実行する。
 *
 * @param entries PO Interpretation が生成した翻訳 entry 一覧。
 * @returns Error または Warning が存在する entry だけを含む確認結果。
 */
export function check(
  entries: readonly TranslationEntry[],
): readonly TranslationCheckResult[] {
  const results: TranslationCheckResult[] = []

  // 各 entry は独立して評価し、指摘が存在する entry だけを公開結果へ含める。
  for (const entry of entries) {
    const errors = [
      ...checkJapanesePunctuation(entry),
      ...checkHalfWidthCharacters(entry),
      ...checkSpacingBetweenHalfAndFullWidth(entry),
      ...checkParenthesesSpacing(entry),
      ...checkInnerParenthesesSpacing(entry),
      ...checkPeriodInsideParentheses(entry),
      ...checkSentenceEndingParentheses(entry),
      ...checkNumberSpacing(entry),
      ...checkRecommendedExpressions(entry),
    ]
    const warnings = [
      ...checkViewExpression(entry),
      ...checkNotAllowedExpression(entry),
      ...checkSorryPrefix(entry),
    ]

    if (errors.length > 0 || warnings.length > 0) {
      results.push({
        entryIndex: entry.entryIndex,
        errors,
        warnings,
      })
    }
  }

  return results
}

/**
 * 日本語 v1 で使用する翻訳文字列を取得する。
 *
 * @param entry 確認対象 entry。
 * @returns 日本語 v1 の確認対象となる先頭 translation form。存在しない場合は undefined。
 */
function getTranslation(entry: TranslationEntry): string | undefined {
  return entry.translations[0]?.text
}

/**
 * 日本語本文で使用された半角・全角の代替句読点を検出する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-1 に該当する指摘。
 */
function checkJapanesePunctuation(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)

  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (character === undefined) {
      continue
    }

    if (['，', '．', '､', '｡'].includes(character)) {
      return [
        {
          styleGuideItem: STYLE_GUIDE.punctuation,
          message: '日本語の句読点は「、」「。」を使用してください',
        },
      ]
    }

    if (character !== ',' && character !== '.') {
      continue
    }

    const previous = translation[index - 1] ?? ''
    const next = translation[index + 1] ?? ''

    // 小数・バージョン番号等の数値表記は、日本語本文の句読点として扱わない。
    if (/\d/.test(previous) && /\d/.test(next)) {
      continue
    }

    // 半角句読点が日本語文字と接している場合だけ、日本語本文の句読点と判断する。
    if (JAPANESE_CHARACTER.test(previous) || JAPANESE_CHARACTER.test(next)) {
      return [
        {
          styleGuideItem: STYLE_GUIDE.punctuation,
          message: '日本語の句読点は「、」「。」を使用してください',
        },
      ]
    }
  }

  return []
}

/**
 * 半角表記すべき英数字・記号の全角文字を検出する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-2 に該当する指摘。
 */
function checkHalfWidthCharacters(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const messages: CheckMessage[] = []
  const seen = new Set<string>()

  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (character === undefined) {
      continue
    }

    const codePoint = character.codePointAt(0)
    if (codePoint === undefined || codePoint < 0xff01 || codePoint > 0xff5e) {
      continue
    }

    // 句読点と丸括弧は、より具体的な 1-1 / 1-5 で扱う。
    if (['，', '．', '（', '）'].includes(character)) {
      continue
    }

    const expected = String.fromCodePoint(codePoint - 0xfee0)
    const key = `${character}:${expected}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfWidth,
      message: `「${character}」は半角の「${expected}」で表記してください`,
    })
  }

  return messages
}

/**
 * 半角文字と日本語文字の境界、およびスペース不要記号・コロンの規則を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-4 に該当する指摘。
 */
function checkSpacingBetweenHalfAndFullWidth(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const spacingText = translation.replace(/%\d*\$?d/gu, (value) =>
    '0'.repeat(value.length),
  )
  const messages: CheckMessage[] = []
  let missingBoundary: [string, string] | undefined
  let unnecessarySymbol: string | undefined

  for (let index = 0; index < spacingText.length - 1; index += 1) {
    if (protectedIndexes.has(index) || protectedIndexes.has(index + 1)) {
      continue
    }

    const left = spacingText[index] ?? ''
    const right = spacingText[index + 1] ?? ''

    if (
      left === ' ' ||
      right === ' ' ||
      left === '(' ||
      right === ')' ||
      left === ')' ||
      right === '(' ||
      left === ':' ||
      right === ':' ||
      NO_SPACE_JAPANESE_PUNCTUATION.has(left) ||
      NO_SPACE_JAPANESE_PUNCTUATION.has(right)
    ) {
      continue
    }

    const leftHalf = ASCII_NON_DIGIT.test(left) && !/\d/.test(left)
    const rightHalf = ASCII_NON_DIGIT.test(right) && !/\d/.test(right)
    const leftJapanese = JAPANESE_CHARACTER.test(left)
    const rightJapanese = JAPANESE_CHARACTER.test(right)

    if ((leftHalf && rightJapanese) || (leftJapanese && rightHalf)) {
      missingBoundary = [left, right]
      break
    }
  }

  // 日本語の句読点・かぎ括弧の前後にはスペースを置かない。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (
      character !== undefined &&
      NO_SPACE_JAPANESE_PUNCTUATION.has(character) &&
      (translation[index - 1] === ' ' || translation[index + 1] === ' ')
    ) {
      unnecessarySymbol = character
      break
    }
  }

  const colonBefore = /\s+:/u.test(translation)
  const colonAfterMissing = /:(?!\s|$)/u.test(translation)
  const colonAfterMultiple = /: {2,}/u.test(translation)

  if (missingBoundary !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: `「${missingBoundary[0]}」と「${missingBoundary[1]}」の間に半角スペースを入れてください`,
    })
  }

  if (unnecessarySymbol !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: `「${unnecessarySymbol}」の前後のスペースは不要です`,
    })
  }

  if (colonBefore) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の前のスペースは不要です',
    })
  }

  if (colonAfterMissing || colonAfterMultiple) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の後に半角スペースを入れてください',
    })
  }

  return messages
}

/**
 * 丸括弧の全角表記と、半角丸括弧の外側スペースを確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-5 に該当する指摘。
 */
function checkParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const messages: CheckMessage[] = []

  if (/[（）]/u.test(translation)) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧は半角の「( )」を使用してください',
    })
  }

  if (!JAPANESE_CHARACTER.test(translation)) {
    return messages
  }

  let invalidOuterSpacing = false

  for (let index = 0; index < translation.length; index += 1) {
    const character = translation[index]

    if (character === '(' && index > 0) {
      const previous = translation[index - 1] ?? ''
      if (!OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(previous)) {
        const spaceCount = countSpacesBackward(translation, index - 1)
        if (spaceCount !== 1) {
          invalidOuterSpacing = true
          break
        }
      }
    }

    if (character === ')' && index < translation.length - 1) {
      const next = translation[index + 1] ?? ''
      if (
        next !== '。' &&
        !OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(next)
      ) {
        const spaceCount = countSpacesForward(translation, index + 1)
        if (spaceCount !== 1) {
          invalidOuterSpacing = true
          break
        }
      }
    }
  }

  if (invalidOuterSpacing) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧の外側は半角スペース1つにしてください',
    })
  }

  return messages
}

/**
 * 指定位置から前方へ連続する半角スペース数を数える。
 *
 * @param text 対象文字列。
 * @param startIndex 開始位置。
 * @returns 連続する半角スペース数。
 */
function countSpacesBackward(text: string, startIndex: number): number {
  let count = 0

  for (let index = startIndex; index >= 0 && text[index] === ' '; index -= 1) {
    count += 1
  }

  return count
}

/**
 * 指定位置から後方へ連続する半角スペース数を数える。
 *
 * @param text 対象文字列。
 * @param startIndex 開始位置。
 * @returns 連続する半角スペース数。
 */
function countSpacesForward(text: string, startIndex: number): number {
  let count = 0

  for (
    let index = startIndex;
    index < text.length && text[index] === ' ';
    index += 1
  ) {
    count += 1
  }

  return count
}

/**
 * 丸括弧の内側直近にある不要なスペースを確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-6 に該当する指摘。
 */
function checkInnerParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined || !/(\(\s+|\s+\))/u.test(translation)) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.innerParenthesesSpacing,
      message: '丸括弧の内側のスペースは削除してください',
    },
  ]
}

/**
 * 丸括弧内の最後の文の末尾にある句点を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-7 に該当する指摘。
 */
function checkPeriodInsideParentheses(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (
    translation === undefined ||
    !/。\)/u.test(translation) ||
    /。\)$/u.test(translation)
  ) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.periodInsideParentheses,
      message: '丸括弧内の末尾の句点は削除してください',
    },
  ]
}

/**
 * 文末の丸括弧内側に置かれた句点を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-8 に該当する指摘。
 */
function checkSentenceEndingParentheses(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined || !/。\)$/u.test(translation)) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.sentenceEndingParentheses,
      message: '文末の句点は丸括弧の外に置いてください',
    },
  ]
}

/**
 * 半角数字または数値プレースホルダーと日本語の間の不要スペースを確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-9 に該当する指摘。
 */
function checkNumberSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const numericToken = '(?:\\d+|%\\d*\\$?d)'
  const japanese =
    '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]'
  const pattern = new RegExp(
    `(?:${numericToken}) +${japanese}|${japanese} +(?:${numericToken})`,
    'u',
  )

  if (!pattern.test(translation)) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.numberSpacing,
      message: '半角数字と日本語の間のスペースは削除してください',
    },
  ]
}

/**
 * 原文の View 操作が、日本語で「表示」を主動作とする表現になっているか確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-2 に該当する指摘。
 */
function checkViewExpression(entry: TranslationEntry): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (
    translation === undefined ||
    !/^View\s+\S+/u.test(entry.source.singular)
  ) {
    return []
  }

  if (/を表示(?:する)?/u.test(translation) && !/の表示/u.test(translation)) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.viewExpression,
      message: '「View XX」の訳し方を確認してください',
    },
  ]
}

/**
 * 原文の not allowed to 構文が、権限不足の定型表現になっているか確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-3 に該当する指摘。
 */
function checkNotAllowedExpression(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (
    translation === undefined ||
    !/\b(?:is|are) not allowed to\b/iu.test(entry.source.singular) ||
    /権限がありません/u.test(translation)
  ) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.notAllowedExpression,
      message: '「not allowed to ...」の訳し方を確認してください',
    },
  ]
}

/**
 * 原文先頭の Sorry, に対応する明示的な謝罪表現が翻訳先頭に残っていないか確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-4 に該当する指摘。
 */
function checkSorryPrefix(entry: TranslationEntry): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (
    translation === undefined ||
    !/^Sorry,\s*/u.test(entry.source.singular) ||
    !APOLOGY_PREFIXES.some((prefix) => translation.startsWith(prefix))
  ) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.sorryPrefix,
      message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
    },
  ]
}

/**
 * スタイルガイドで v1 対象とした3組の推奨表記を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-6 に該当する指摘。
 */
function checkRecommendedExpressions(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const recommendations = [
    ['下さい', 'ください'],
    ['全て', 'すべて'],
    ['既に', 'すでに'],
  ] as const
  const messages: CheckMessage[] = []

  for (const [detected, expected] of recommendations) {
    if (translation.includes(detected)) {
      messages.push({
        styleGuideItem: STYLE_GUIDE.recommendedExpressions,
        message: `「${detected}」は「${expected}」と表記してください`,
      })
    }
  }

  return messages
}
