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

interface GettextBrowserBundle {
  po2js: (source: string) => unknown
}

const gettext = (
  globalThis as typeof globalThis & { gettext?: GettextBrowserBundle }
).gettext

if (!gettext) {
  throw new Error('gettext-converter の browser bundle を読み込めませんでした。')
}

export const parsePo = (source: string): ParsedPo =>
  gettext.po2js(source) as ParsedPo
