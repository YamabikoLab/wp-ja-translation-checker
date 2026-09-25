/**
 * WTC が自動確認する範囲と、人が確認する範囲の概要を結果画面で案内する責任を持つ。
 *
 * 詳細なルール定義は要件定義書を正本とし、この表示では翻訳作業中に必要な概要と公開サマリーへの導線だけを提供する。
 */

import styles from './TranslationChecker.module.css'

const REQUIREMENTS_URL =
  'https://github.com/YamabikoLab/wp-translation-checker/blob/main/docs/requirements/v1-requirements.md'
const README_URL =
  'https://github.com/YamabikoLab/wp-translation-checker#check-scope'
const STYLE_GUIDE_URL =
  'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/'

/**
 * 結果概要に常時表示する WTC のチェック範囲案内。
 *
 * @returns 自動チェック・一部チェック・手動確認の役割分担と詳細資料への導線。
 */
export function CheckScopeGuide() {
  return (
    <section
      className={styles.scopeGuide}
      aria-labelledby="check-scope-guide-title"
    >
      <div className={styles.scopeGuideHeader}>
        <h3 id="check-scope-guide-title">WTC のチェック範囲</h3>
        <span className={styles.scopeGuideSummaryNote}>12項目をチェック</span>
      </div>

      <div className={styles.scopeGuideContent}>
        <p>
          WTC は WordPress
          日本語翻訳スタイルガイドのうち、機械的に判定できる項目を確認します。チェック結果だけでスタイルガイド全体への準拠を保証するものではありません。
        </p>

        <dl className={styles.scopeGuideLegend}>
          <div>
            <dt>✅ 自動チェック</dt>
            <dd>機械的に高い確度で判定できる項目。</dd>
          </div>
          <div>
            <dt>△ 一部チェック</dt>
            <dd>
              特定の原文パターンなど、判定できる条件に限って確認する項目。
            </dd>
          </div>
          <div>
            <dt>👀 手動確認</dt>
            <dd>文脈・意味・自然さなど、人による判断が必要な項目。</dd>
          </div>
        </dl>

        <div className={styles.manualCheck}>
          <h3>手動で確認したい主な項目</h3>
          <ul>
            <li>自然な日本語になっているか</li>
            <li>訳語やボタン名が統一されているか</li>
            <li>カタカナ語・長音表記</li>
            <li>ブランド名・機能名</li>
            <li>日付・日時の表記</li>
            <li>プレースホルダーの扱い</li>
          </ul>
        </div>

        <p className={styles.scopeGuideLinks}>
          <a href={README_URL} target="_blank" rel="noreferrer">
            詳しい対応状況を見る
          </a>
          <a href={REQUIREMENTS_URL} target="_blank" rel="noreferrer">
            要件定義書を見る
          </a>
          <a href={STYLE_GUIDE_URL} target="_blank" rel="noreferrer">
            WordPress 日本語翻訳スタイルガイドを見る
          </a>
        </p>
      </div>
    </section>
  )
}
