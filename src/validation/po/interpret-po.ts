/**
 * PO 文字列を Validation Core が利用する意味データへ変換する責任を持つ。
 *
 * parser 固有の表現、PO 構文名、raw source を後続責務へ公開せず、locale 判定と
 * Rule Evaluation に必要な metadata、原文、plural、翻訳 form、安定した identity だけを提供する。
 */

type ParserTranslation = {
  msgid: string
  msgid_plural?: string
  msgstr?: string[]
}

type ParsedPo = {
  headers?: Record<string, string>
  translations: Record<string, Record<string, ParserTranslation>>
}

type GettextBrowserBundle = {
  po2js: (source: string) => unknown
}

/**
 * PO Interpretation が後続責務へ公開する metadata を表す。
 */
export type PoMetadata = {
  language?: string
}

/**
 * 1つの翻訳 form を表す。
 *
 * index は正規化後配列の位置ではなく、元の msgstr[n] の n を保持する。
 */
export type TranslationForm = {
  index: number
  text: string
}

/**
 * Rule Evaluation の1対象となる翻訳 entry を表す。
 *
 * entryIndex は validation 対象 filtering 後の interpreted entry order に対する
 * 0-based の安定した identity であり、元 PO の物理 entry order を意味しない。
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
 * 正常に解釈された PO の、Validation Core 用データを表す。
 */
export type InterpretedPo = {
  metadata: PoMetadata
  entries: readonly TranslationEntry[]
}

/**
 * PO Interpretation の公開結果を表す。
 *
 * malformed PO だけを invalid-po とし、parser bundle 不在などの実装・構成異常は
 * この結果へ丸めず例外として扱う。
 */
export type PoInterpretationResult =
  | {
      status: 'success'
      document: InterpretedPo
    }
  | {
      status: 'invalid-po'
    }

const getParser = (): GettextBrowserBundle => {
  const gettext = (
    globalThis as typeof globalThis & {
      gettext?: GettextBrowserBundle
    }
  ).gettext

  if (!gettext) {
    throw new Error(
      'gettext-converter の browser bundle を読み込めませんでした。',
    )
  }

  return gettext
}

const toParsedPo = (value: unknown): ParsedPo => {
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

const toTranslationForms = (
  translation: ParserTranslation,
): readonly TranslationForm[] =>
  (translation.msgstr ?? []).flatMap((text, index) =>
    text === '' ? [] : [{ index, text }],
  )

const createEntries = (parsed: ParsedPo): readonly TranslationEntry[] => {
  const entries: TranslationEntry[] = []

  /**
   * parser が保持する context ごとの entry を、validation 対象だけの interpreted entry order へ変換する。
   *
   * context 自体は v1 の Rule Evaluation へ公開しないが、context ごとの collection を個別に走査することで
   * 同じ原文・翻訳を持つ別 entry を統合せず、entry identity を維持する。
   */
  for (const translationsByMsgid of Object.values(parsed.translations)) {
    for (const translation of Object.values(translationsByMsgid)) {
      if (translation.msgid === '') {
        continue
      }

      const translations = toTranslationForms(translation)
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
 * @returns 正常時は正規化済み document、malformed PO の場合は invalid-po。
 */
export function interpretPo(source: string): PoInterpretationResult {
  const parser = getParser()
  let parsed: ParsedPo

  try {
    parsed = toParsedPo(parser.po2js(source))
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { status: 'invalid-po' }
    }

    throw error
  }

  return {
    status: 'success',
    document: {
      metadata: {
        ...(parsed.headers?.Language === undefined
          ? {}
          : { language: parsed.headers.Language }),
      },
      entries: createEntries(parsed),
    },
  }
}
