/**
 * 1件の翻訳チェック指摘について、Severity、原文・翻訳比較、スタイルガイド参照をまとめて表示する責任を持つ。
 *
 * 指摘一覧全体の絞り込みやページ状態は扱わず、受け取った1件の表示だけを所有する。
 */

import { useEffect, useState } from 'react'
import { ExpandableText } from './ExpandableText'
import type { Finding } from './presentation-model'
import { serializeFindingMarkdown } from './result-export'
import styles from './TranslationChecker.module.css'

const STYLE_GUIDE_URL =
  'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/'

/**
 * 1件の CheckMessage と、その指摘が属する entry の原文・翻訳を表示する。
 *
 * @param props 指摘表示に必要な属性。
 * @param props.finding 表示対象の1指摘。
 * @returns Severity、メッセージ、翻訳比較、一次情報へのリンクを含む指摘。
 */
export function FindingCard({ finding }: { finding: Finding }) {
  const translation = finding.entry.translations[0]?.text ?? ''
  const [copyFeedback, setCopyFeedback] = useState<
    'success' | 'failure' | null
  >(null)

  useEffect(() => {
    if (copyFeedback === null) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyFeedback(null)
    }, 2000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  /**
   * 表示中の1指摘を既存の Finding 単位 Markdown 形式でクリップボードへコピーする。
   *
   * Clipboard API を利用できない場合や書き込みに失敗した場合も、指摘表示自体は維持する。
   */
  const handleMarkdownCopy = async () => {
    if (navigator.clipboard?.writeText === undefined) {
      setCopyFeedback('failure')
      return
    }

    try {
      await navigator.clipboard.writeText(serializeFindingMarkdown(finding))
      setCopyFeedback('success')
    } catch {
      setCopyFeedback('failure')
    }
  }

  return (
    <article className={styles.finding}>
      <div className={styles.findingHeader}>
        <span
          className={
            finding.severity === 'Error'
              ? styles.errorBadge
              : styles.warningBadge
          }
        >
          {finding.severity}
        </span>
        <p className={styles.findingMessage}>{finding.message}</p>
      </div>

      <div className={styles.comparison}>
        <section className={styles.comparisonPanel}>
          <h3>原文</h3>
          <ExpandableText text={finding.entry.source.singular} />
          {finding.entry.source.plural !== undefined && (
            <div className={styles.pluralSource}>
              <h4>複数形原文</h4>
              <ExpandableText text={finding.entry.source.plural} />
            </div>
          )}
        </section>
        <section className={styles.comparisonPanel}>
          <h3>翻訳</h3>
          <ExpandableText text={translation} matches={finding.matches} />
        </section>
      </div>

      <div className={styles.findingFooter}>
        <p className={styles.guideReference}>
          <span>スタイルガイド: {finding.styleGuideItem}</span>
          <a href={STYLE_GUIDE_URL} target="_blank" rel="noreferrer">
            WordPress 日本語翻訳スタイルガイドを確認
          </a>
        </p>
        <button
          type="button"
          className={styles.findingCopyButton}
          onClick={handleMarkdownCopy}
        >
          <span aria-live="polite">
            {copyFeedback === 'success'
              ? 'コピーしました'
              : copyFeedback === 'failure'
                ? 'コピーできませんでした'
                : 'Markdownをコピー'}
          </span>
        </button>
      </div>
    </article>
  )
}
