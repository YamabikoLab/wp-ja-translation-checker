import po2js from 'gettext-converter/po2js'

export interface ParsedTranslation {
  msgid: string
  msgid_plural?: string
  msgstr: string[]
}

export interface ParsedPo {
  charset: string
  headers?: Record<string, string>
  translations: Record<string, Record<string, ParsedTranslation>>
}

export const parsePo = (source: string): ParsedPo => po2js(source) as ParsedPo
