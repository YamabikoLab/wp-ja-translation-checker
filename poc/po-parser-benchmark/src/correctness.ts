import type { ParsedPo } from './parser'

export interface CorrectnessCheck {
  name: string
  passed: boolean
  detail: string
}

const representativePo = String.raw`msgid ""
msgstr ""
"Project-Id-Version: wjtc-poc\\n"
"Language: ja\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

msgid "Hello"
msgstr "こんにちは"

msgid "One file"
msgid_plural "Many files"
msgstr[0] "1個のファイル"
msgstr[1] "複数のファイル"

msgid ""
"Multi "
"line"
msgstr ""
"複数"
"行"

msgid "Quote: \"x\" and slash \\"
msgstr "引用: \"x\" とスラッシュ \\"
`

const representativeMalformedPo = `msgidx "broken"
msgstr "壊れた"`

const result = (name: string, passed: boolean, detail: string): CorrectnessCheck => ({
  name,
  passed,
  detail,
})

export const runCorrectnessGate = (
  parse: (source: string) => ParsedPo,
): CorrectnessCheck[] => {
  let parsed: ParsedPo

  try {
    parsed = parse(representativePo)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return [result('representative PO parse', false, detail)]
  }

  const translations = parsed.translations[''] ?? {}
  const checks: CorrectnessCheck[] = [
    result(
      'header metadata',
      parsed.headers?.Language === 'ja' &&
        parsed.headers?.['Content-Type'] === 'text/plain; charset=UTF-8',
      'Language と Content-Type を保持する',
    ),
    result(
      'singular msgid / msgstr',
      translations.Hello?.msgstr[0] === 'こんにちは',
      'singular の原文と翻訳を保持する',
    ),
    result(
      'plural',
      translations['One file']?.msgid_plural === 'Many files' &&
        translations['One file']?.msgstr[0] === '1個のファイル' &&
        translations['One file']?.msgstr[1] === '複数のファイル',
      'msgid_plural と msgstr[n] を保持する',
    ),
    result(
      'multiline',
      translations['Multi line']?.msgstr[0] === '複数行',
      'multiline を連結後の値として保持する',
    ),
    result(
      'escape',
      translations['Quote: "x" and slash \\']?.msgstr[0] ===
        '引用: "x" とスラッシュ \\',
      'quote と backslash の escape を復元する',
    ),
  ]

  let malformedRejected = false
  let malformedDetail = '例外を返さず成功結果として受理した'

  try {
    parse(representativeMalformedPo)
  } catch (error) {
    malformedRejected = true
    malformedDetail = error instanceof Error ? error.message : String(error)
  }

  checks.push(
    result(
      'malformed input',
      malformedRejected,
      malformedRejected
        ? `解析失敗として識別: ${malformedDetail}`
        : malformedDetail,
    ),
  )

  return checks
}
