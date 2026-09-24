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
  /** 対応する WordPress 日本語翻訳スタイルガイドの項目。 */
  styleGuideItem: string
  /** 利用者が確認する指摘内容。 */
  message: string
}

/**
 * 1つの翻訳 entry で検出された Error / Warning を表す。
 */
export type TranslationCheckResult = {
  /** PO Interpretation が付与した対象 entry の識別位置。 */
  entryIndex: number
  /** 機械的に高い確度で問題と判断できる指摘。 */
  errors: readonly CheckMessage[]
  /** 文脈によって正しい可能性があり、人による確認が必要な指摘。 */
  warnings: readonly CheckMessage[]
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

    // 問題のない entry は公開結果へ含めず、1件以上の指摘がある場合だけ結果を生成する。
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
 * 数値・技術文字列の一部や、句点と断定できない連続ピリオドは対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 1-1 に該当する指摘。
 */
function checkJapanesePunctuation(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、1-1 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)

  // 日本語本文として評価できる文字だけを対象に、句読点の使用を確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部は、日本語本文の句読点として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    // 判定対象の文字を取得できない場合は指摘を生成しない。
    if (character === undefined) {
      continue
    }

    // 日本語句読点の代替として使われる全角・半角記号は、1-1 の明確な対象とする。
    if (['，', '．', '､', '｡'].includes(character)) {
      return [
        {
          styleGuideItem: STYLE_GUIDE.punctuation,
          message: '日本語の句読点は「、」「。」を使用してください',
        },
      ]
    }

    // 1-1 で追加判断が必要なのは、日本語句読点として使われ得る半角カンマとピリオドだけとする。
    if (character !== ',' && character !== '.') {
      continue
    }

    const previous = translation[index - 1] ?? ''
    const next = translation[index + 1] ?? ''

    // 連続するピリオドは省略表現等の可能性があるため、日本語本文の句点と断定しない。
    if (character === '.' && (previous === '.' || next === '.')) {
      continue
    }

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
 * 日本語の句読点は 1-1、丸括弧は 1-5 を優先し、技術文字列内部は対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 1-2 に該当する指摘。
 */
function checkHalfWidthCharacters(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、1-2 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const messages: CheckMessage[] = []
  const seen = new Set<string>()

  // 技術文字列を除く本文から、半角表記へ置き換え可能な全角 ASCII 文字を確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部は、日本語本文の全半角規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    // 判定対象の文字を取得できない場合は指摘を生成しない。
    if (character === undefined) {
      continue
    }

    const codePoint = character.codePointAt(0)
    // 半角 ASCII に対応する全角文字だけを 1-2 の候補とする。
    if (codePoint === undefined || codePoint < 0xff01 || codePoint > 0xff5e) {
      continue
    }

    // 句読点と丸括弧は、より具体的な 1-1 / 1-5 で扱う。
    if (['，', '．', '（', '）'].includes(character)) {
      continue
    }

    const expected = String.fromCodePoint(codePoint - 0xfee0)
    const key = `${character}:${expected}`
    // 同じ翻訳内の同一表記は1件の指摘へまとめ、同じ内容を重複表示しない。
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
  // 日本語訳が存在しない entry は、1-4 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const spacingText = translation.replace(/%\d*\$?d/gu, (value) =>
    '0'.repeat(value.length),
  )
  const messages: CheckMessage[] = []
  const spacingCharacters = new Set([' ', '　'])
  let invalidBoundary:
    | {
        left: string
        right: string
        spaceCount: number
        hasFullWidthSpace: boolean
      }
    | undefined
  let unnecessarySymbol: string | undefined

  // 数字以外の半角文字と日本語文字の境界が、半角スペース1つで区切られているか確認する。
  for (let index = 0; index < spacingText.length - 1; index += 1) {
    // 技術文字列内部から始まる境界は、日本語本文のスペース規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const left = spacingText[index] ?? ''
    let rightIndex = index + 1
    let spaceCount = 0
    let hasFullWidthSpace = false

    // 境界に存在するスペースを確認し、半角スペース1つ以外は 1-4 の不適合として扱う。
    while (spacingCharacters.has(spacingText[rightIndex] ?? '')) {
      spaceCount += 1
      hasFullWidthSpace ||= spacingText[rightIndex] === '　'
      rightIndex += 1
    }

    // 技術文字列へ接続する境界は、本文同士のスペース規則として断定しない。
    if (protectedIndexes.has(rightIndex)) {
      continue
    }

    const right = spacingText[rightIndex] ?? ''

    // 丸括弧・コロン・句読点等は個別規則または例外があるため、通常の半角・全角境界判定から除外する。
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

    // 数字を除く半角文字と日本語文字の境界は、半角スペースがちょうど1つの場合だけ正常とする。
    if (
      ((leftHalf && rightJapanese) || (leftJapanese && rightHalf)) &&
      (spaceCount !== 1 || hasFullWidthSpace)
    ) {
      invalidBoundary = { left, right, spaceCount, hasFullWidthSpace }
      break
    }
  }

  // 日本語の句読点・かぎ括弧の前後にはスペースを置かない。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部の記号は、日本語本文のスペース規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    // スペース禁止の日本語記号に隣接する空白がある場合だけ、不要なスペースとして扱う。
    if (
      character !== undefined &&
      NO_SPACE_JAPANESE_PUNCTUATION.has(character) &&
      (spacingCharacters.has(translation[index - 1] ?? '') ||
        spacingCharacters.has(translation[index + 1] ?? ''))
    ) {
      unnecessarySymbol = character
      break
    }
  }

  let colonBefore = false
  let colonAfterMissing = false
  let colonAfterMultiple = false

  // 日本語本文の区切りとして使われるコロンについて、前後のスペース規則を確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // コロン以外、または技術文字列内部のコロンは 1-4 の対象にしない。
    if (translation[index] !== ':' || protectedIndexes.has(index)) {
      continue
    }

    const previous = translation[index - 1] ?? ''
    const next = translation[index + 1] ?? ''

    // 時刻のような数字同士を結ぶコロンは、日本語本文の区切り記号として扱わない。
    if (/\d/u.test(previous) && /\d/u.test(next)) {
      continue
    }

    // コロン前には半角・全角どちらのスペースも置かず、後にはどちらか1つを置く。
    colonBefore ||= spacingCharacters.has(previous)
    colonAfterMissing ||= next !== '' && !spacingCharacters.has(next)
    colonAfterMultiple ||=
      spacingCharacters.has(next) &&
      spacingCharacters.has(translation[index + 2] ?? '')
  }

  // 通常の半角・全角文字境界でスペースの過不足を検出した場合は、その境界を1件の指摘として返す。
  if (invalidBoundary !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message:
        invalidBoundary.spaceCount === 0
          ? `「${invalidBoundary.left}」と「${invalidBoundary.right}」の間に半角スペースを入れてください`
          : `「${invalidBoundary.left}」と「${invalidBoundary.right}」の間の半角スペースは1つにしてください`,
    })
  }

  // スペース禁止記号の前後に空白を検出した場合は、その記号について1件の指摘を返す。
  if (unnecessarySymbol !== undefined) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: `「${unnecessarySymbol}」の前後のスペースは不要です`,
    })
  }

  // コロンの直前に空白が存在する場合は、不要なスペースとして指摘する。
  if (colonBefore) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の前のスペースは不要です',
    })
  }

  // コロンの直後が半角または全角スペース1つでない場合は、必要なスペースの不足または過剰として指摘する。
  if (colonAfterMissing || colonAfterMultiple) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.halfFullSpacing,
      message: '「:」の後にスペースを1つ入れてください',
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
function checkParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、1-5 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const messages: CheckMessage[] = []
  let hasFullWidthParentheses = false

  // 技術文字列を除く本文で、全角丸括弧が使われていないか確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部の丸括弧は、日本語本文の丸括弧規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    // 本文で全角丸括弧を検出した場合は、半角丸括弧へ統一する対象とする。
    if (character === '（' || character === '）') {
      hasFullWidthParentheses = true
      break
    }
  }

  // 全角丸括弧が1つ以上あれば、同じルール内で1件の指摘としてまとめる。
  if (hasFullWidthParentheses) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧は半角の「( )」を使用してください',
    })
  }

  let invalidOuterSpacing = false

  // 半角丸括弧の外側が、例外を除いて半角スペース1つになっているか確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部の丸括弧は、日本語本文の外側スペース規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]

    // 文字列先頭以外の開き括弧では、本文側の直前に必要な外側スペースがあるか確認する。
    if (character === '(' && index > 0) {
      const outside = getOuterParenthesesSpacing(
        translation,
        protectedIndexes,
        index - 1,
        -1,
      )
      // 例外記号に隣接しない本文側では、外側スペースが半角1つでなければ 1-5 の対象とする。
      if (
        outside !== undefined &&
        !OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(outside.character) &&
        outside.spaceCount !== 1
      ) {
        invalidOuterSpacing = true
        break
      }
    }

    // 文字列末尾以外の閉じ括弧では、本文側の直後に必要な外側スペースがあるか確認する。
    if (character === ')' && index < translation.length - 1) {
      const outside = getOuterParenthesesSpacing(
        translation,
        protectedIndexes,
        index + 1,
        1,
      )
      // 閉じ括弧直後の句点等の例外を除き、本文側の外側スペースが半角1つでなければ 1-5 の対象とする。
      if (
        outside !== undefined &&
        outside.character !== '。' &&
        !OUTER_PARENTHESES_SPACE_EXCEPTIONS.has(outside.character) &&
        outside.spaceCount !== 1
      ) {
        invalidOuterSpacing = true
        break
      }
    }
  }

  // 外側スペースの不適合が1箇所以上あれば、同じルール内で1件の指摘としてまとめる。
  if (invalidOuterSpacing) {
    messages.push({
      styleGuideItem: STYLE_GUIDE.parentheses,
      message: '丸括弧の外側は半角スペース1つにしてください',
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
function checkInnerParenthesesSpacing(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、1-6 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)

  // 技術文字列を除く本文で、丸括弧の直後・直前に空白がないか確認する。
  for (let index = 0; index < translation.length; index += 1) {
    // 技術文字列内部の丸括弧は、日本語本文の内側スペース規則として評価しない。
    if (protectedIndexes.has(index)) {
      continue
    }

    const character = translation[index]
    // 本文中の丸括弧について、保護範囲を除いた直後または直前に空白がある場合だけ 1-6 とする。
    if (
      (character === '(' &&
        !protectedIndexes.has(index + 1) &&
        /\s/u.test(translation[index + 1] ?? '')) ||
      (character === ')' &&
        !protectedIndexes.has(index - 1) &&
        /\s/u.test(translation[index - 1] ?? ''))
    ) {
      return [
        {
          styleGuideItem: STYLE_GUIDE.innerParenthesesSpacing,
          message: '丸括弧の内側のスペースは削除してください',
        },
      ]
    }
  }

  return []
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
  // 日本語訳が存在しない entry は、1-7 の判定対象にできないため指摘しない。
  if (translation === undefined) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)

  // 文末全体の「。)」は 1-8 に委ね、それ以外の括弧直前句点だけを確認する。
  for (let index = 0; index < translation.length - 1; index += 1) {
    // 技術文字列外の「。)」が翻訳全体の末尾ではない場合だけ、括弧内末尾の不要句点として扱う。
    if (
      translation[index] === '。' &&
      translation[index + 1] === ')' &&
      !protectedIndexes.has(index) &&
      !protectedIndexes.has(index + 1) &&
      index + 1 !== translation.length - 1
    ) {
      return [
        {
          styleGuideItem: STYLE_GUIDE.periodInsideParentheses,
          message: '丸括弧内の末尾の句点は削除してください',
        },
      ]
    }
  }

  return []
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
  // 1-8 は、翻訳が存在し、翻訳全体が「。)」で終わる場合だけを明示的な判定対象とする。
  if (translation === undefined || !/。\)$/u.test(translation)) {
    return []
  }

  const { protectedIndexes } = protectTechnicalText(translation)
  const periodIndex = translation.length - 2
  const closingParenthesisIndex = translation.length - 1

  // 文末の「。)」が技術文字列内部にある場合は、日本語本文の句点位置として指摘しない。
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
function checkNumberSpacing(entry: TranslationEntry): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、1-9 の判定対象にできないため指摘しない。
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

  // 数字が識別子・バージョン・寸法等の技術表現の一部ではなく、日本語本文との境界にある場合だけ指摘する。
  for (const match of translation.matchAll(pattern)) {
    const value = match[0]
    const start = match.index
    const numeric = match[1] ?? match[4]
    // 数字または数値プレースホルダーを特定できない候補は、1-9 の対象として扱わない。
    if (numeric === undefined) {
      continue
    }

    const numericOffset = value.indexOf(numeric)
    const numericStart = start + numericOffset
    const numericEnd = numericStart + numeric.length
    const isPlaceholder = numeric.startsWith('%')

    // コード等の保護された技術文字列内部にある数字は、日本語本文との境界として扱わない。
    if (protectedIndexes.has(numericStart)) {
      continue
    }

    // 数値プレースホルダーは常に数字相当として扱い、通常の数字だけ技術トークンへの埋め込みを追加確認する。
    if (!isPlaceholder) {
      const before = translation[numericStart - 1] ?? ''
      const after = translation[numericEnd] ?? ''

      // ASCII の識別子、バージョン、規格番号、寸法等に埋め込まれた数字は単独の数字として扱わない。
      if (/[A-Za-z0-9_.-]/u.test(before) || /[A-Za-z0-9_.-]/u.test(after)) {
        continue
      }
    }

    return [
      {
        styleGuideItem: STYLE_GUIDE.numberSpacing,
        message: '半角数字と日本語の間のスペースは削除してください',
      },
    ]
  }

  return []
}

/**
 * 原文の View 操作が、日本語で「表示」を主動作とする表現になっているか確認する。
 *
 * 「〜を表示（する）」を正常とし、「〜の表示」など動詞としての「表示」になっていない訳は確認対象とする。
 *
 * @param entry 確認対象 entry。
 * @returns 3-2 に該当する指摘。
 */
function checkViewExpression(entry: TranslationEntry): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 3-2 は、日本語訳が存在し、原文が動詞の「View XX」と明確に判断できる場合だけ確認する。
  if (
    translation === undefined ||
    !/^View\s+\S+/u.test(entry.source.singular)
  ) {
    return []
  }

  // 主動作が「〜を表示（する）」として訳されている場合は、3-2 の推奨表現を満たす。
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
  // v1 では、権限主体と明確に判断できる代表的な人・利用者の表現に対象を限定し、物や値の制約表現は指摘しない。
  const permissionSource =
    /\b(?:you|users?|administrators?|editors?|authors?|contributors?|subscribers?|customers?|members?)\s+(?:is|are) not allowed to\b/iu

  // 3-3 は、対象の権限不足構文が存在し、翻訳が既定の権限表現を満たしていない場合だけ Warning とする。
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
  // 3-4 は、原文が「Sorry, ...」で始まり、翻訳先頭に v1 対象の謝罪表現が残る場合だけ Warning とする。
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
 * 対象は「下さい / 全て / 既に」の3組に限定し、コード等の技術文字列内部は対象外とする。
 *
 * @param entry 確認対象 entry。
 * @returns 3-6 に該当する指摘。
 */
function checkRecommendedExpressions(
  entry: TranslationEntry,
): readonly CheckMessage[] {
  const translation = getTranslation(entry)
  // 日本語訳が存在しない entry は、3-6 の判定対象にできないため指摘しない。
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

  // 同じ推奨表記が複数あっても1件にまとめ、技術文字列外に実在する場合だけ指摘する。
  for (const [detected, expected] of recommendations) {
    let detectedIndex = translation.indexOf(detected)

    // 技術文字列内部だけに現れる推奨表記は対象外とし、本文側に同じ表記がある場合はそこまで確認を続ける。
    while (detectedIndex !== -1 && protectedIndexes.has(detectedIndex)) {
      detectedIndex = translation.indexOf(
        detected,
        detectedIndex + detected.length,
      )
    }

    // 技術文字列外の本文で対象表記を1箇所以上検出した場合は、その表記について1件の指摘を返す。
    if (detectedIndex !== -1) {
      messages.push({
        styleGuideItem: STYLE_GUIDE.recommendedExpressions,
        message: `「${detected}」は「${expected}」と表記してください`,
      })
    }
  }

  return messages
}
