/**
 * Glossary Warning を Style Guide 指摘と混同せず表示する責任を持つ。
 *
 * 登録訳語・品詞・補足と現在の翻訳を提示し、最終判断は利用者へ委ねる。
 */

import type { GlossaryFinding } from './presentation-model'
import styles from './TranslationChecker.module.css'

const GLOSSARY_URL =
  'https://translate.wordpress.org/locale/ja/default/glossary/'

/**
 * 1件の Glossary Warning を表示する。
 *
 * @param finding 表示対象の Glossary Warning と対応 entry。
 * @returns Glossary 候補と参照先を含む確認カード。
 */
export function GlossaryFindingCard({
  finding,
}: {
  finding: GlossaryFinding
}) {
  const { result } = finding

  return (
    <article className={styles.finding}>
      <header className={styles.findingHeader}>
        <span className={styles.warningBadge}>Warning</span>
        <p className={styles.findingMessage}>Glossary の訳語を確認してください</p>
      </header>
      <div className={styles.glossaryContent}>
        <div>
          <h3>原語</h3>
          <p>{result.originalTerm}</p>
        </div>
        <div>
          <h3>Glossary の候補</h3>
          <ul>
            {result.candidates.map((candidate, index) => (
              <li key={`${candidate.translation}-${candidate.partOfSpeech ?? ''}-${index}`}>
                <strong>{candidate.translation || '（訳文へ入れない）'}</strong>
                {candidate.partOfSpeech !== undefined && (
                  <span> / {candidate.partOfSpeech}</span>
                )}
                {candidate.comment !== undefined && <p>{candidate.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>現在の翻訳</h3>
          <p>{result.currentTranslation}</p>
        </div>
      </div>
      <footer className={styles.findingFooter}>
        <p className={styles.guideReference}>
          <a href={GLOSSARY_URL} target="_blank" rel="noreferrer">
            WordPress.org 日本語 Glossary を確認
          </a>
        </p>
      </footer>
    </article>
  )
}
