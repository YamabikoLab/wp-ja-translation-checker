/**
 * WordPress 日本語翻訳スタイルガイド v1 の個別ルール判定を所有する。
 *
 * 各関数は1件の翻訳 entry を独立して評価し、そのルールに該当する指摘だけを返す。
 * ルール全体の実行順、Error / Warning の区分、entry ごとの結果集約は check.ts が所有する。
 */

import type { TranslationEntry } from '@/po/interpret-po'

/**
 * 翻訳内で検出した1箇所の一致範囲を表す。
 */
type CheckMessageMatch = {
  /** 指摘箇所の開始位置。entry.translations[0].text に対する UTF-16 code unit offset。 */
  start: number
  /** 指摘箇所の終了位置。対象範囲に含まない UTF-16 code unit offset。 */
  end: number
}

/**
 * 1件の指摘で利用者へ提示する最小情報を表す。
 */
export type CheckMessage = {
  /** 対応する WordPress 日本語翻訳スタイルガイドの項目。 */
  styleGuideItem: string
  /** 利用者が確認する指摘内容。 */
  message: string
  /** 同一の指摘内容として扱う翻訳内の該当箇所。 */
  matches: readonly CheckMessageMatch[]
}

/**
 * 日本語 v1 の各指摘で利用者に示すスタイルガイド項目名を定義する。
 */
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
const NO_SPACE_JAPANESE_PUNCTUATION = new Set([
  '『',
  '』',
  '「',
  '」',
  '。',
  '、',
])
const OUTER_PARENTHESES_SPACE_EXCEPTIONS = new Set([
  '『',
  '』',
  '「',
  '」',
  '。',
  '、',
])
/**
 * 3-4 で Sorry に対応する謝罪表現として扱う、v1 の完全な対象集合。
 */
const APOLOGY_PREFIXES = [
  'すみませんが',
  'すみません',
  '申し訳ございません',
  '申し訳ありません',
  'ごめんなさい',
] as const

/**
 * 日本語本文の表記規則から除外する技術文字列の位置情報を表す。
 */
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
    /\{\{\/?[A-Za-z][A-Za-z0-9_-]*\}\}/gu,
    /%(?:\d+\$)?s/gu,
    /%\([A-Za-z0-9_.-]+\)s/gu,
    /(?:[A-Za-z_][A-Za-z0-9_]*|%(?:\d+\$)?s)\(\)/gu,
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
 * 日本語 v1 で使用する翻訳文字列を取得する。
 *
 * @param entry 確認対象 entry。
 * @returns 日本語 v1 の確認対象となる先頭 translation form。存在しない場合は undefined。
 */
function getTranslation(entry: TranslationEntry): string | undefined {
  return entry.translations[0]?.text
}

/**
 * 保護範囲を除いた表示本文上で、指定位置の外側にあるスペースと隣接文字を取得する。
 *
 * HTML 等の表示されない技術文字列は読み飛ばすが、本文側に実在するスペースは元文字列上の位置とともに保持する。
 *
 * @param text 確認対象の翻訳。
 * @param protectedIndexes 技術文字列として判定対象外にする文字位置。
 * @param startIndex 基準位置の直近から確認を開始する位置。
 * @param direction 前方は 1、後方は -1。
 * @param spacingCharacters スペースとして扱う文字集合。
 * @returns 表示本文上の隣接文字と、その手前に存在するスペース位置。文字列境界の場合は undefined。
 */
function getVisibleAdjacentText(
  text: string,
  protectedIndexes: ReadonlySet<number>,
  startIndex: number,
  direction: 1 | -1,
  spacingCharacters: ReadonlySet<string>,
):
  | { character: string; characterIndex: number; spacingIndexes: readonly number[] }
  | undefined {
  let index = startIndex
  const spacingIndexes: number[] = []

  // 表示されない保護範囲を除外し、本文側のスペースと最初の可視文字だけを取得する。
  while (index >= 0 && index < text.length) {
    if (protectedIndexes.has(index)) {
      index += direction
      continue
    }

    const character = text[index]
    if (character === undefined) {
      return undefined
    }

    if (spacingCharacters.has(character)) {
      spacingIndexes.push(index)
      index += direction
      continue
    }

    return {
      character,
      characterIndex: index,
      spacingIndexes,
    }
  }

  return undefined
}

/**
 * 全角カンマ・ピリオドが数値表記内の符号か確認する。
 *
 * 数字に挟まれている場合は日本語の句読点ではなく、1-2 の半角表記対象として扱う。
 *
 * @param text 確認対象の翻訳。
 * @param index 確認対象文字の位置。
 * @returns 数値表記内の全角カンマ・ピリオドである場合は true。
 */
function isNumericFullWidthPunctuation(text: string, index: number): boolean {
  const character = text[index]
  if (character !== '，' && character !== '．') {
    return false
  }

  const numericCharacter = /[0-9０-９]/u
  return (
    numericCharacter.test(text[index - 1] ?? '') &&
    numericCharacter.test(text[index + 1] ?? '')
  )
}

/**
 * 日本語本文で使用された、機械的に高い確度で判定できる代替句読点を検出する。
 *
 * ASCII のカンマとピリオドは用途を機械的に特定できないため対象外とする。
 * また、数字に挟まれた全角カンマ・ピリオドは数値表記として 1-2 に委ねる。
 *
 * @param entry 確認対象 entry。
 * @returns 1-1 に該当する指摘。
 */

export function checkJapanesePunctuation(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const matches: CheckMessageMatch[] = []

  // 技術文字列を除く本文で、明確に代替句読点と判断できる文字をすべて同一指摘へまとめる。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (
      character !== undefined &&
      ['，', '．', '､', '｡'].includes(character) &&
      !isNumericFullWidthPunctuation(translation, index)
    ) {
      matches.push({ start: index, end: index + character.length })
    }
  }

  return matches.length === 0
    ? []
    : [
        {
          styleGuideItem: STYLE_GUIDE.punctuation,
          message: '日本語の句読点は「、」「。」を使用してください',
          matches,
        },
      ]
}

/**
 * 半角表記すべき英数字・記号の全角文字を検出する。
 *
 * 日本語の句読点は 1-1、丸括弧は 1-5 を優先し、技術文字列内部は対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 1-2 に該当する指摘。
 */

export function checkHalfWidthCharacters(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const matchesByKey = new Map<
    string,
    { character: string; expected: string; matches: CheckMessageMatch[] }
  >()

  // 同じ全角文字の複数箇所は同一指摘へまとめ、異なる文字は別の指摘として維持する。
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

    if (
      ['（', '）'].includes(character) ||
      (['，', '．'].includes(character) &&
        !isNumericFullWidthPunctuation(translation, index))
    ) {
      continue
    }

    const expected = String.fromCodePoint(codePoint - 0xfee0)
    const key = `${character}:${expected}`
    const match = { start: index, end: index + character.length }
    const existing = matchesByKey.get(key)

    if (existing !== undefined) {
      existing.matches.push(match)
    } else {
      matchesByKey.set(key, { character, expected, matches: [match] })
    }
  }

  return Array.from(
    matchesByKey.values(),
    ({ character, expected, matches }) => ({
      styleGuideItem: STYLE_GUIDE.halfWidth,
      message: `「${character}」は半角の「${expected}」で表記してください`,
      matches,
    }),
  )
}

/**
 * 半角文字と日本語文字の境界、およびスペース不要記号・コロンの規則を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-4 に該当する指摘。
 */

export function checkSpacingBetweenHalfAndFullWidth(
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
  const spacingCharacters = new Set([' ', '\u00a0', '　'])
  const validColonSpacingCharacters = new Set([' ', '　'])
  const invalidBoundaryMatches: CheckMessageMatch[] = []
  let invalidBoundaryMessage: string | undefined
  const unnecessarySymbolMatches: CheckMessageMatch[] = []
  let unnecessarySymbol: string | undefined
  const colonBeforeMatches: CheckMessageMatch[] = []
  const colonAfterMatches: CheckMessageMatch[] = []

  // 数字以外の半角文字と日本語文字の境界が、半角スペース1つで区切られているか確認する。
  for (let index = 0; index < spacingText.length - 1; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const left = spacingText[index] ?? ''
    let rightIndex = index + 1
    let spaceCount = 0
    let hasInvalidBoundarySpace = false

    while (spacingCharacters.has(spacingText[rightIndex] ?? '')) {
      spaceCount += 1
      hasInvalidBoundarySpace ||= spacingText[rightIndex] !== ' '
      rightIndex += 1
    }

    if (protectedIndexes.has(rightIndex)) {
      continue
    }

    const right = spacingText[rightIndex] ?? ''
    if (
      left === '(' ||
      right === ')' ||
      left === ')' ||
      right === '(' ||
      left === ':' ||
      right === ':' ||
      NO_SPACE_JAPANESE_PUNCTUATION.has(left) ||
      NO_SPACE_JAPANESE_PUNCTUATION.has(right) ||
      [',', '.', '，', '．', '､', '｡'].includes(left) ||
      [',', '.', '，', '．', '､', '｡'].includes(right)
    ) {
      continue
    }

    const leftHalf = ASCII_NON_DIGIT.test(left) && !/\d/.test(left)
    const rightHalf = ASCII_NON_DIGIT.test(right) && !/\d/.test(right)
    const leftJapanese = JAPANESE_CHARACTER.test(left)
    const rightJapanese = JAPANESE_CHARACTER.test(right)

    if (
      ((leftHalf && rightJapanese) || (leftJapanese && rightHalf)) &&
      (spaceCount !== 1 || hasInvalidBoundarySpace)
    ) {
      const message =
        spaceCount === 0
          ? `「${left}」と「${right}」の間に半角スペースを入れてください`
          : `「${left}」と「${right}」の間の半角スペースは1つにしてください`

      // 従来どおり最初の指摘内容だけを1件として返し、同じ内容の後続箇所だけを位置情報へまとめる。
      if (invalidBoundaryMessage === undefined) {
        invalidBoundaryMessage = message
      }
      if (invalidBoundaryMessage === message) {
        invalidBoundaryMatches.push({ start: index, end: rightIndex + 1 })
      }
    }
  }

  // 日本語の句読点・かぎ括弧の前後にある不要スペースを、同じ記号の指摘へまとめる。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (
      character !== undefined &&
      NO_SPACE_JAPANESE_PUNCTUATION.has(character) &&
      (spacingCharacters.has(translation[index - 1] ?? '') ||
        spacingCharacters.has(translation[index + 1] ?? ''))
    ) {
      if (unnecessarySymbol === undefined) {
        unnecessarySymbol = character
      }
      if (unnecessarySymbol === character) {
        const start = spacingCharacters.has(translation[index - 1] ?? '')
          ? index - 1
          : index
        const end = spacingCharacters.has(translation[index + 1] ?? '')
          ? index + 2
          : index + 1
        unnecessarySymbolMatches.push({ start, end })
      }
    }
  }

  // 日本語本文の区切りとして使われるコロンについて、表示されないマークアップを除いた前後のスペース規則を確認する。
  for (let index = 0; index < translation.length; index += 1) {
    if (translation[index] !== ':' || protectedIndexes.has(index)) {
      continue
    }

    const before = getVisibleAdjacentText(
      translation,
      protectedIndexes,
      index - 1,
      -1,
      spacingCharacters,
    )
    const after = getVisibleAdjacentText(
      translation,
      protectedIndexes,
      index + 1,
      1,
      spacingCharacters,
    )

    if (
      before !== undefined &&
      after !== undefined &&
      /\d/u.test(before.character) &&
      /\d/u.test(after.character)
    ) {
      continue
    }

    if (before !== undefined && before.spacingIndexes.length > 0) {
      colonBeforeMatches.push({
        start: Math.min(...before.spacingIndexes),
        end: index + 1,
      })
    }

    if (after !== undefined) {
      const spacingCount = after.spacingIndexes.length
      const hasInvalidSpacing = after.spacingIndexes.some(
        (spacingIndex) =>
          !validColonSpacingCharacters.has(translation[spacingIndex] ?? ''),
      )

      if (
        spacingCount === 0 ||
        spacingCount > 1 ||
        hasInvalidSpacing
      ) {
        colonAfterMatches.push({
          start: index,
          end: after.characterIndex + 1,
        })
      }
    }
  }

  if (invalidBoundaryMessage !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: invalidBoundaryMessage,
      matches: invalidBoundaryMatches,
    })
  }

  if (unnecessarySymbol !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: `「${unnecessarySymbol}」の前後のスペースは不要です`,
      matches: unnecessarySymbolMatches,
    })
  }

  if (colonBeforeMatches.length > 0) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の前のスペースは不要です',
      matches: colonBeforeMatches,
    })
  }

  if (colonAfterMatches.length > 0) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の後にスペースを1つ入れてください',
      matches: colonAfterMatches,
    })
  }

  return messages
}

/**
 * 丸括弧の全角表記と、半角丸括弧の外側スペースを確認する。
 *
 * 明示的に判別できる技術文字列の内部は日本語本文の丸括弧規則として扱わない。
 *
 * @param entry 確認対象 entry。
 * @returns 1-5 に該当する指摘。
 */

export function checkParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const messages: CheckMessage[] = []
  const fullWidthMatches: CheckMessageMatch[] = []
  const invalidOuterSpacingMatches: CheckMessageMatch[] = []

  // 技術文字列を除く本文で使われた全角丸括弧を、1件の指摘へまとめる。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (character === '（' || character === '）') {
      fullWidthMatches.push({ start: index, end: index + character.length })
    }
  }

  if (fullWidthMatches.length > 0) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧は半角の「( )」を使用してください',
      matches: fullWidthMatches,
    })
  }

  // 半角丸括弧の外側が、例外を除いて半角スペース1つになっているか確認する。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (character === '(' && index > 0) {
      const outside = getOuterParenthesesSpacing(
        translation,
        protectedIndexes,
        index - 1,
        -1,
      )
      if (
        outside !== undefined &&
        !OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(outside.character) &&
        outside.spaceCount !== 1
      ) {
        invalidOuterSpacingMatches.push({
          start: Math.max(0, index - Math.max(1, outside.spaceCount)),
          end: index + 1,
        })
      }
    }

    if (character === ')' && index < translation.length - 1) {
      const outside = getOuterParenthesesSpacing(
        translation,
        protectedIndexes,
        index + 1,
        1,
      )
      if (
        outside !== undefined &&
        outside.character !== '。' &&
        !OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(outside.character) &&
        outside.spaceCount !== 1
      ) {
        invalidOuterSpacingMatches.push({
          start: index,
          end: Math.min(
            translation.length,
            index + Math.max(2, outside.spaceCount + 1),
          ),
        })
      }
    }
  }

  if (invalidOuterSpacingMatches.length > 0) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧の外側は半角スペース1つにしてください',
      matches: invalidOuterSpacingMatches,
    })
  }

  return messages
}

/**
 * 丸括弧の外側について、マークアップ等の保護範囲を除いた表示本文側の隣接文字とスペース数を取得する。
 *
 * @param text 対象文字列。
 * @param protectedIndexes 技術文字列として判定対象外にする文字位置。
 * @param startIndex 丸括弧の外側直近から確認を開始する位置。
 * @param direction 前方は 1、後方は -1。
 * @returns 表示本文側の文字と、その手前に存在する半角スペース数。文字列境界の場合は undefined。
 */
function getOuterParenthesesSpacing(
  text: string,
  protectedIndexes: ReadonlySet<number>,
  startIndex: number,
  direction: 1 | -1,
): { character: string; spaceCount: number } | undefined {
  let index = startIndex
  let spaceCount = 0

  // HTML 等の表示されない保護範囲を飛ばしつつ、本文側に実在するスペースだけを数える。
  while (index >= 0 && index < text.length) {
    // マークアップ等の保護範囲は表示本文の隣接文字として扱わない。
    if (protectedIndexes.has(index)) {
      index += direction
      continue
    }

    const character = text[index]
    // 本文側に連続する半角スペースを、丸括弧外側の実在スペースとして数える。
    if (character === ' ') {
      spaceCount += 1
      index += direction
      continue
    }

    // 表示本文側の文字へ到達できない場合は、文字列境界としてスペース要否を判定しない。
    if (character === undefined) {
      return undefined
    }

    return { character, spaceCount }
  }

  return undefined
}

/**
 * 丸括弧の内側直近にある不要なスペースを確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-6 に該当する指摘。
 */

export function checkInnerParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const matches: CheckMessageMatch[] = []

  // 技術文字列を除く本文で、丸括弧の内側にある不要スペースをすべて同一指摘へまとめる。
  for (let index = 0; index < translation.length; index += 1) {
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    if (
      character === '(' &&
      !protectedIndexes.has(index + 1) &&
      /\s/u.test(translation[index + 1] ?? '')
    ) {
      matches.push({ start: index + 1, end: index + 2 })
    }

    if (
      character === ')' &&
      !protectedIndexes.has(index - 1) &&
      /\s/u.test(translation[index - 1] ?? '')
    ) {
      matches.push({ start: index - 1, end: index })
    }
  }

  return matches.length === 0
    ? []
    : [
        {
          styleGuideItem: STYLE_GUIDE.innerParenthesesSpacing,
          message: '丸括弧の内側のスペースは削除してください',
          matches,
        },
      ]
}

/**
 * 丸括弧内の最後の文の末尾にある句点を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-7 に該当する指摘。
 */

export function checkPeriodInsideParentheses(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const matches: CheckMessageMatch[] = []

  // 文末全体の「。)」は 1-8 に委ね、それ以外の括弧直前句点を同一指摘へまとめる。
  for (let index = 0; index < translation.length - 1; index += 1) {
    if (
      translation[index] === '。' &&
      translation[index + 1] === ')' &&
      !protectedIndexes.has(index) &&
      !protectedIndexes.has(index + 1) &&
      index + 1 !== translation.length - 1
    ) {
      matches.push({ start: index, end: index + 1 })
    }
  }

  return matches.length === 0
    ? []
    : [
        {
          styleGuideItem: STYLE_GUIDE.periodInsideParentheses,
          message: '丸括弧内の末尾の句点は削除してください',
          matches,
        },
      ]
}

/**
 * 文末の丸括弧内側に置かれた句点を確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 1-8 に該当する指摘。
 */

export function checkSentenceEndingParentheses(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined || !/。\)$/u.test(translation)) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const periodIndex = translation.length - 2
  const closingParenthesisIndex = translation.length - 1

  if (
    protectedIndexes.has(periodIndex) ||
    protectedIndexes.has(closingParenthesisIndex)
  ) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.sentenceEndingParentheses,
      message: '文末の句点は丸括弧の外に置いてください',
      matches: [{ start: periodIndex, end: closingParenthesisIndex + 1 }],
    },
  ]
}

/**
 * 半角数字または数値プレースホルダーと日本語の間の不要スペースを確認する。
 *
 * コード等の技術文字列内部や、識別子・バージョン・寸法等の技術表現に含まれる数字は対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 1-9 に該当する指摘。
 */

export function checkNumberSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const numericToken = '(?:\\d+|%\\d*\\$?d)'
  const japanese = '[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]'
  const pattern = new RegExp(
    `(?:(${numericToken}) +(${japanese})|(${japanese}) +(${numericToken}))`,
    'gu',
  )
  const matches: CheckMessageMatch[] = []

  for (const match of translation.matchAll(pattern)) {
    const value = match[0]
    const start = match.index
    const numeric = match[1] ?? match[4]
    if (numeric === undefined) {
      continue
    }

    const numericOffset = value.indexOf(numeric)
    const numericStart = start + numericOffset
    const numericEnd = numericStart + numeric.length
    const isPlaceholder = numeric.startsWith('%')

    if (protectedIndexes.has(numericStart)) {
      continue
    }

    if (!isPlaceholder) {
      const before = translation[numericStart - 1] ?? ''
      const after = translation[numericEnd] ?? ''
      if (/[A-Za-z0-9_.-]/u.test(before) || /[A-Za-z0-9_.-]/u.test(after)) {
        continue
      }
    }

    matches.push({ start, end: start + value.length })
  }

  return matches.length === 0
    ? []
    : [
        {
          styleGuideItem: STYLE_GUIDE.numberSpacing,
          message: '半角数字と日本語の間のスペースは削除してください',
          matches,
        },
      ]
}

/**
 * 原文の View 操作が、日本語で「表示」を主動作とする表現になっているか確認する。
 *
 * 「〜を表示（する）」を正常とし、「〜の表示」など動詞としての「表示」になっていない訳は確認対象とする。
 *
 * @param entry 確認対象 entry。
 * @returns 3-2 に該当する指摘。
 */

export function checkViewExpression(
  entry: TranslationEntry,
): readonly CheckMessage[] {
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
      matches: [],
    },
  ]
}

/**
 * 原文の not allowed to 構文が、権限不足の定型表現になっているか確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-3 に該当する指摘。
 */

export function checkNotAllowedExpression(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  const permissionSource =
    /\b(?:you|users?|administrators?|editors?|authors?|contributors?|subscribers?|customers?|members?)\s+(?:is|are) not allowed to\b/iu

  if (
    translation === undefined ||
    !permissionSource.test(entry.source.singular) ||
    /権限がありません/u.test(translation)
  ) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.notAllowedExpression,
      message: '「not allowed to ...」の訳し方を確認してください',
      matches: [],
    },
  ]
}

/**
 * 原文先頭の Sorry, に対応する明示的な謝罪表現が翻訳先頭に残っていないか確認する。
 *
 * @param entry 確認対象 entry。
 * @returns 3-4 に該当する指摘。
 */

export function checkSorryPrefix(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined || !/^Sorry,\s*/u.test(entry.source.singular)) {
    return []
  }

  const prefix = APOLOGY_PREFIXES.find((candidate) =>
    translation.startsWith(candidate),
  )
  if (prefix === undefined) {
    return []
  }

  return [
    {
      styleGuideItem: STYLE_GUIDE.sorryPrefix,
      message: '先頭の「Sorry,」に対応する謝罪表現を削除してください',
      matches: [{ start: 0, end: prefix.length }],
    },
  ]
}

/**
 * スタイルガイドで v1 対象とした3組の推奨表記を確認する。
 *
 * 対象は「下さい / 全て / 既に」の3組に限定し、コード等の技術文字列内部は対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 3-6 に該当する指摘。
 */

export function checkRecommendedExpressions(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const recommendations = [
    ['下さい', 'ください'],
    ['全て', 'すべて'],
    ['既に', 'すでに'],
  ] as const
  const messages: CheckMessage[] = []

  // 表記ごとに1件の指摘を維持し、同じ表記の複数箇所を matches にまとめる。
  for (const [detected, expected] of recommendations) {
    const matches: CheckMessageMatch[] = []
    let detectedIndex = translation.indexOf(detected)

    while (detectedIndex !== -1) {
      if (!protectedIndexes.has(detectedIndex)) {
        matches.push({
          start: detectedIndex,
          end: detectedIndex + detected.length,
        })
      }
      detectedIndex = translation.indexOf(
        detected,
        detectedIndex + detected.length,
      )
    }

    if (matches.length > 0) {
      messages.push({
        styleGuideItem: STYLE_GUIDE.recommendedExpressions,
        message: `「${detected}」は「${expected}」と表記してください`,
        matches,
      })
    }
  }

  return messages
}
