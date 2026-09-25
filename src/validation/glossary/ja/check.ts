/**
 * WordPress.org 日本語 Glossary と解釈済み PO entry を照合する責任を持つ。
 *
 * 原文中の登録語を大小文字・英数字境界・長い語句優先の規則で検出し、
 * 各翻訳フォームに登録訳語が含まれない場合だけ人による確認用 Warning を返す。
 */

import type { TranslationEntry } from '@/po/interpret-po'
import type {
  GlossaryCheckResult,
  GlossaryEntry,
  GlossarySourceMatch,
} from './glossary'

type TermGroup = {
  originalTerm: string
  normalized: string
  candidates: readonly GlossaryEntry[]
}

/**
 * Glossary term の単語境界判定に用いる ASCII 英数字かどうかを返す。
 *
 * @param value 原文または Glossary term の1文字。
 * @returns ASCII 英数字の場合は true。
 */
const isAsciiAlphaNumeric = (value: string | undefined): boolean =>
  value !== undefined && /^[A-Za-z0-9]$/.test(value)

/**
 * 同一原語の候補をまとめ、長い語句から検出できる順序へ整える。
 *
 * @param glossary 検証に利用する Glossary 登録行。
 * @returns 大小文字を無視した原語単位の候補集合。
 */
function createTermGroups(
  glossary: readonly GlossaryEntry[],
): readonly TermGroup[] {
  const groups = new Map<string, GlossaryEntry[]>()

  for (const entry of glossary) {
    const normalized = entry.original.toLocaleLowerCase('en-US')
    const current = groups.get(normalized) ?? []
    current.push(entry)
    groups.set(normalized, current)
  }

  return Array.from(groups, ([normalized, candidates]) => ({
    originalTerm: candidates[0]?.original ?? normalized,
    normalized,
    candidates,
  })).sort(
    (left, right) =>
      right.normalized.length - left.normalized.length ||
      left.normalized.localeCompare(right.normalized),
  )
}

/**
 * 1つの原文から、Glossary の一致範囲を長い語句優先で抽出する。
 *
 * @param text singular または plural の原文。
 * @param source 原文種別。
 * @param groups Glossary の原語候補集合。
 * @returns 同一範囲の部分語を除外した一致情報。
 */
function findSourceTerms(
  text: string,
  source: GlossarySourceMatch['source'],
  groups: readonly TermGroup[],
): readonly { group: TermGroup; match: GlossarySourceMatch }[] {
  const lower = text.toLocaleLowerCase('en-US')
  const occupied = new Array<boolean>(text.length).fill(false)
  const found: Array<{ group: TermGroup; match: GlossarySourceMatch }> = []

  // 長い語句から原文へ割り当て、同一範囲を短い部分語で重複指摘しない。
  for (const group of groups) {
    let from = 0
    while (from <= lower.length - group.normalized.length) {
      const start = lower.indexOf(group.normalized, from)
      if (start < 0) break
      const end = start + group.normalized.length
      from = start + 1

      const boundaryMatches =
        (!isAsciiAlphaNumeric(group.normalized[0]) ||
          !isAsciiAlphaNumeric(text[start - 1])) &&
        (!isAsciiAlphaNumeric(group.normalized[group.normalized.length - 1]) ||
          !isAsciiAlphaNumeric(text[end]))

      if (!boundaryMatches || occupied.slice(start, end).some(Boolean)) continue

      for (let index = start; index < end; index += 1) occupied[index] = true
      found.push({ group, match: { source, start, end } })
    }
  }

  return found.sort((left, right) => left.match.start - right.match.start)
}

/**
 * 日本語 Glossary を翻訳 entry へ適用する。
 *
 * @param entries PO Interpretation が公開した翻訳 entry。
 * @param glossary 照合に利用する Glossary データ。
 * @returns 登録訳語が見つからない翻訳フォーム単位の Warning。
 */
export function checkJapaneseGlossary(
  entries: readonly TranslationEntry[],
  glossary: readonly GlossaryEntry[],
): readonly GlossaryCheckResult[] {
  const groups = createTermGroups(glossary)
  const results: GlossaryCheckResult[] = []

  for (const entry of entries) {
    const detected = [
      ...findSourceTerms(entry.source.singular, 'singular', groups),
      ...(entry.source.plural === undefined
        ? []
        : findSourceTerms(entry.source.plural, 'plural', groups)),
    ]
    const byTerm = new Map<
      string,
      { group: TermGroup; matches: GlossarySourceMatch[] }
    >()

    // singular / plural の双方で見つかった同一 term を1つの確認対象へまとめる。
    for (const item of detected) {
      const current = byTerm.get(item.group.normalized)
      if (current === undefined) {
        byTerm.set(item.group.normalized, {
          group: item.group,
          matches: [item.match],
        })
      } else {
        current.matches.push(item.match)
      }
    }

    // 1つの Glossary term について、登録された全候補を同じ判断材料として扱う。
    for (const { group, matches } of byTerm.values()) {
      const usableCandidates = group.candidates.filter(
        (candidate) => candidate.translation !== '',
      )
      if (usableCandidates.length === 0) continue

      // plural form 間で成立条件を共有せず、各翻訳フォームを独立して確認する。
      for (const translationForm of entry.translations) {
        const matchesGlossary = usableCandidates.some((candidate) =>
          translationForm.text.includes(candidate.translation),
        )
        if (matchesGlossary) continue

        results.push({
          entryIndex: entry.entryIndex,
          translationFormIndex: translationForm.index,
          originalTerm: group.originalTerm,
          candidates: group.candidates,
          currentTranslation: translationForm.text,
          sourceMatches: matches,
        })
      }
    }
  }

  return results
}
