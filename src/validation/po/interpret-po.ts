/**
 * PO 文字列を Validation Core 用の意味データへ解釈する責任を持つ。
 *
 * gettext-converter 固有の解析結果をこの境界内に閉じ込め、Locale Resolution と
 * Rule Evaluation が必要とするメタデータ、原文、複数形、翻訳フォーム、安定した識別情報だけを公開する。
 */

/**
 * gettext-converter が1件の翻訳エントリについて返す、境界内だけの解析表現を表す。
 *
 * 後続責務へ公開せず、PO Interpretation の正規化にだけ利用する。
 */
type ParserTranslation = {
  msgid: string
  msgid_plural?: string
  msgstr?: string[]
}

/**
 * gettext-converter が PO 全体について返す、境界内だけの解析表現を表す。
 *
 * ヘッダーとコンテキスト別の翻訳表は、公開契約へ変換した後は保持しない。
 */
type ParsedPo = {
  headers?: Record<string, string>
  translations: Record<string, Record<string, ParserTranslation>>
}

/**
 * ブラウザー用 gettext-converter が提供する、PO Interpretation に必要な最小操作を表す。
 */
type GettextBrowserBundle = {
  po2js: (source: string) => unknown
}

/**
 * PO Interpretation が後続責務へ公開するメタデータを表す。
 */
export type PoMetadata = {
  language?: string
}

/**
 * 1つの翻訳フォームを表す。
 *
 * index は正規化後の配列位置ではなく、元の `msgstr[n]` の `n` を保持する。
 */
export type TranslationForm = {
  index: number
  text: string
}

/**
 * Rule Evaluation の1対象となる翻訳エントリを表す。
 *
 * entryIndex は検証対象の絞り込み後に得られる解釈済みエントリ順の0始まりの識別情報であり、
 * 元 PO の物理的なエントリ順を意味しない。
 */
export type TranslationEntry = {
  entryIndex: number
  source: {
    singular: string
    plural?: string
  }
  translations: readonly TranslationForm[]
}

/**
 * 正常に解釈された PO の Validation Core 用データを表す。
 */
export type InterpretedPo = {
  metadata: PoMetadata
  entries: readonly TranslationEntry[]
}

/**
 * PO Interpretation の公開結果を表す。
 *
 * 構文不正な PO だけを `invalid-po` とし、ブラウザー用パーサー不在などの
 * 実装・構成異常は入力不正へ読み替えない。
 */
export type PoInterpretationResult =
  | {
      status: 'success'
      document: InterpretedPo
    }
  | {
      status: 'invalid-po'
    }

/**
 * PO の翻訳文字列を記述する1行が、開始・終了の引用符を持つか確認する。
 *
 * @param literal PO のキーに続く文字列、または複数行文字列の継続行。
 * @returns 行内の文字列が閉じている場合は true。
 */
const hasClosedPoStringLiteral = (literal: string): boolean => {
  const trimmed = literal.trimEnd()

  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return false
  }

  let precedingBackslashes = 0

  // 行末の引用符がエスケープされた内容文字か、文字列を閉じる引用符かを判定する。
  for (
    let index = trimmed.length - 2;
    index >= 0 && trimmed[index] === '\\';
    index -= 1
  ) {
    precedingBackslashes += 1
  }

  return precedingBackslashes % 2 === 0
}

/**
 * gettext-converter が正常結果として受理し得る、途中で切れた PO 文字列を識別する。
 *
 * 独自の PO 解析は行わず、PO のキー行と複数行文字列の継続行について
 * 引用文字列がその行で閉じていることだけを補完確認する。
 *
 * @param source PO ファイル内容の文字列。
 * @returns 閉じていない引用文字列が存在する場合は true。
 */
const hasUnterminatedPoString = (source: string): boolean => {
  const keyPattern =
    /^\s*(?:msgctxt|msgid(?:_plural)?|msgstr(?:\[\d+\])?)(?=\s|$)/

  // PO の各物理行を確認し、パーサーが見落とす引用文字列の途中終了だけを検出する。
  for (const line of source.split(/\r\n|\n|\r/)) {
    const keyMatch = line.match(keyPattern)

    if (keyMatch) {
      const literal = line.slice(keyMatch[0].length).trimStart()

      if (!hasClosedPoStringLiteral(literal)) {
        return true
      }

      continue
    }

    const continuation = line.trimStart()

    if (
      continuation.startsWith('"') &&
      !hasClosedPoStringLiteral(continuation)
    ) {
      return true
    }
  }

  return false
}

/**
 * PO Interpretation が利用するブラウザー用パーサーを取得する。
 *
 * @returns gettext-converter の PO 解析操作。
 */
const getParser = (): GettextBrowserBundle => {
  const gettext = (
    globalThis as typeof globalThis & {
      gettext?: GettextBrowserBundle
    }
  ).gettext

  // パーサー不在は入力 PO の問題ではなく実行環境の構成異常として扱う。
  if (!gettext) {
    throw new Error(
      'gettext-converter の browser bundle を読み込めませんでした。',
    )
  }

  return gettext
}

/**
 * パーサーの返却値が PO Interpretation が利用できる最小構造を持つことを確認する。
 *
 * @param value gettext-converter が返した解析結果。
 * @returns PO Interpretation 内部で利用する解析表現。
 */
const toParsedPo = (value: unknown): ParsedPo => {
  // 想定構造の欠落は PO の構文不正ではなく、パーサー連携の契約不整合として扱う。
  if (
    typeof value !== 'object' ||
    value === null ||
    !('translations' in value) ||
    typeof value.translations !== 'object' ||
    value.translations === null
  ) {
    throw new Error('gettext-converter が想定外の解析結果を返しました。')
  }

  return value as ParsedPo
}

/**
 * パーサーが返した翻訳フォームから、Rule Evaluation が評価するフォームだけを作る。
 *
 * @param translation gettext-converter が返した1件の翻訳エントリ。
 * @returns 元の `msgstr[n]` の index を保持した検証対象フォーム。
 */
const toTranslationForms = (
  translation: ParserTranslation,
): readonly TranslationForm[] => {
  const forms: TranslationForm[] = []

  // 元の plural form identity を維持しながら、各翻訳フォームを検証対象へ含めるか判断する。
  for (const [index, text] of (translation.msgstr ?? []).entries()) {
    // 未翻訳として除外するのは厳密な空文字列だけとし、空白のみの翻訳は検証対象に残す。
    if (text === '') {
      continue
    }

    forms.push({ index, text })
  }

  return forms
}

/**
 * パーサーのヘッダー表現から、Locale Resolution が必要とするメタデータだけを公開形へ変換する。
 *
 * @param parsed gettext-converter が返した PO 全体の解析結果。
 * @returns Language header の値だけを保持する公開メタデータ。
 */
const createMetadata = (parsed: ParsedPo): PoMetadata => {
  // Language header の欠落は正常な PO として許容し、ロケール未解決の判断を Locale Resolution に委ねる。
  if (parsed.headers?.Language === undefined) {
    return {}
  }

  return { language: parsed.headers.Language }
}

/**
 * パーサーの翻訳表から、Rule Evaluation が評価するエントリ集合を作る。
 *
 * @param parsed gettext-converter が返した PO 全体の解析結果。
 * @returns 検証対象の絞り込み後に連続した entryIndex を持つ翻訳エントリ。
 */
const createEntries = (parsed: ParsedPo): readonly TranslationEntry[] => {
  const entries: TranslationEntry[] = []

  // msgctxt ごとの翻訳表を別々に扱い、同じ原文・翻訳を持つ別コンテキストのエントリを統合しない。
  for (const translationsByMsgid of Object.values(parsed.translations)) {
    // 各パーサーエントリを公開契約へ変換し、検証対象だけを解釈済みエントリ順へ追加する。
    for (const translation of Object.values(translationsByMsgid)) {
      // 空 msgid のヘッダーエントリは翻訳内容ではないため Rule Evaluation へ渡さない。
      if (translation.msgid === '') {
        continue
      }

      const translations = toTranslationForms(translation)

      // 翻訳済みフォームが1つも残らないエントリは、訳文に対するルール評価の対象にしない。
      if (translations.length === 0) {
        continue
      }

      entries.push({
        entryIndex: entries.length,
        source: {
          singular: translation.msgid,
          ...(translation.msgid_plural === undefined
            ? {}
            : { plural: translation.msgid_plural }),
        },
        translations,
      })
    }
  }

  return entries
}

/**
 * PO 文字列を Validation Core 用の正規化データへ解釈する。
 *
 * @param source PO ファイル内容の文字列。関数内で変更せず、戻り値にも保持しない。
 * @returns 正常時は正規化済み document、構文不正な PO の場合は `invalid-po`。
 */
export function interpretPo(source: string): PoInterpretationResult {
  // 途中で切れた引用文字列をパーサーが成功扱いする既知の境界を、入力不正として先に識別する。
  if (hasUnterminatedPoString(source)) {
    return { status: 'invalid-po' }
  }

  const parser = getParser()
  let parsed: ParsedPo

  try {
    parsed = toParsedPo(parser.po2js(source))
  } catch (error) {
    // パーサーが構文不正として報告した場合だけ入力不正へ変換し、その他の実装異常は呼び出し元へ伝える。
    if (error instanceof SyntaxError) {
      return { status: 'invalid-po' }
    }

    throw error
  }

  return {
    status: 'success',
    document: {
      metadata: createMetadata(parsed),
      entries: createEntries(parsed),
    },
  }
}
