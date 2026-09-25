/**
 * WordPress.org 日本語 Glossary の検証契約を定義する。
 *
 * Glossary の候補情報と照合結果を Validation 内で保持し、Presentation が判定を再実装せず
 * 利用者へ確認材料を提示できる公開境界を提供する。
 */

/** WordPress.org 日本語 Glossary の1登録行を表す。 */
export type GlossaryEntry = {
  original: string
  translation: string
  partOfSpeech?: string
  comment?: string
}

/** 原文内で Glossary term が一致した位置を表す。 */
export type GlossarySourceMatch = {
  source: 'singular' | 'plural'
  start: number
  end: number
}

/** Glossary 不一致として人による確認を促す1件の Warning を表す。 */
export type GlossaryCheckResult = {
  entryIndex: number
  translationFormIndex: number
  originalTerm: string
  candidates: readonly GlossaryEntry[]
  currentTranslation: string
  sourceMatches: readonly GlossarySourceMatch[]
}
