/**
 * ブラウザーから PO ファイルを選択して確認し、Validation Core の結果を利用者へ表示する責任を持つ。
 *
 * File API と React の画面状態をこの Presentation 境界に閉じ、個別ルールや locale 判定は再実装しない。
 */

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { checkPo } from '@/check/check'
import {
  createFindings,
  createGlossaryFindings,
  createPaginationModel,
  createRuleFilterOptions,
  DEFAULT_PAGE_SIZE,
  filterFindingsByRule,
  PAGE_SIZE_OPTIONS,
  getCompletionFocusTarget,
  presentationReducer,
  summarizeFindings,
} from './presentation-model'
import { CheckScopeGuide } from './CheckScopeGuide'
import { Feedback } from './Feedback'
import { FindingCard } from './FindingCard'
import { GlossaryFindingCard } from './GlossaryFindingCard'
import { PaginationControls } from './PaginationControls'
import { serializeCsv, serializeJson, serializeMarkdown } from './result-export'
import styles from './TranslationChecker.module.css'

const STYLE_GUIDE_LAST_UPDATED = '2026年8月28日'

/** Markdown コピー操作の結果として利用者へ通知する状態。 */
type CopyFeedback = 'success' | 'failure' | null

/**
 * WTC v1 のファイル入力、確認開始、結果表示を提供する Presentation コンポーネント。
 *
 * @returns ブラウザー内で完結する翻訳確認画面。
 */
export function TranslationChecker() {
  const [state, dispatch] = useReducer(presentationReducer, {
    status: 'no-file',
  })
  const activeFileRef = useRef<File | null>(null)
  const feedbackRef = useRef<HTMLElement>(null)
  const summaryRef = useRef<HTMLElement>(null)
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null)
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const focusTarget = getCompletionFocusTarget(state)

  useEffect(() => {
    if (focusTarget === 'feedback') {
      feedbackRef.current?.focus()
    }

    if (focusTarget === 'summary') {
      summaryRef.current?.focus()
    }
  }, [focusTarget])

  /**
   * 利用者が選択した File を現在入力として採用し、以前の結果を画面状態から外す。
   *
   * @param event ファイル入力の変更イベント。
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file === undefined) {
      return
    }

    activeFileRef.current = null
    setCopyFeedback(null)
    setSelectedRule(null)
    setPage(1)
    dispatch({ type: 'select-file', file })
  }

  /**
   * 現在選択中の File を文字列として読み取り、Check Orchestration の公開入口へ渡す。
   *
   * 同じ File の確認が進行中なら重複実行せず、入力差し替え後の古い完了結果は reducer が適用しない。
   */
  const handleCheck = async () => {
    if (state.status === 'no-file' || state.status === 'checking') {
      return
    }

    const file = state.file

    if (activeFileRef.current === file) {
      return
    }

    activeFileRef.current = file
    setCopyFeedback(null)
    setSelectedRule(null)
    setPage(1)
    dispatch({ type: 'start-check' })

    let source: string

    try {
      source = await file.text()
    } catch {
      if (activeFileRef.current === file) {
        activeFileRef.current = null
      }

      dispatch({ type: 'file-read-failure', file })
      return
    }

    const result = checkPo(source)

    if (activeFileRef.current === file) {
      activeFileRef.current = null
    }

    dispatch({ type: 'check-completed', file, result })
  }

  /**
   * 正常完了した現在の確認結果を、指定形式のローカルファイルとして保存する。
   *
   * @param content 保存する出力文字列。
   * @param extension 出力形式を表す拡張子。
   * @param mediaType 出力形式に対応する MIME type。
   */
  const downloadResult = (
    content: string,
    extension: 'csv' | 'json',
    mediaType: string,
  ) => {
    if (state.status !== 'success') {
      return
    }

    const baseName = state.file.name.replace(/\.po$/i, '')
    const blob = new Blob([content], { type: mediaType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${baseName}-wtc-results.${extension}`
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * 現在の確認結果全体を CSV として保存する。
   */
  const handleCsvDownload = () => {
    downloadResult(
      serializeCsv(findings, glossaryFindings),
      'csv',
      'text/csv;charset=utf-8',
    )
  }

  /**
   * 現在の確認結果全体を JSON として保存する。
   */
  const handleJsonDownload = () => {
    if (state.status !== 'success') {
      return
    }

    downloadResult(
      serializeJson(state.file.name, findings, glossaryFindings),
      'json',
      'application/json;charset=utf-8',
    )
  }

  /**
   * 現在の確認結果全体を Markdown としてクリップボードへコピーする。
   *
   * Clipboard API を利用できない場合や書き込みに失敗した場合は、成功扱いにせず利用者へ通知する。
   */
  const handleMarkdownCopy = async () => {
    if (state.status !== 'success') {
      return
    }

    if (navigator.clipboard?.writeText === undefined) {
      setCopyFeedback('failure')
      return
    }

    try {
      await navigator.clipboard.writeText(
        serializeMarkdown(state.file.name, findings, glossaryFindings),
      )
      setCopyFeedback('success')
    } catch {
      setCopyFeedback('failure')
    }
  }

  const selectedFile = state.status === 'no-file' ? null : state.file
  const findings =
    state.status === 'success' ? createFindings(state.result) : []
  const glossaryFindings =
    state.status === 'success' ? createGlossaryFindings(state.result) : []
  const summary = summarizeFindings(findings, glossaryFindings)
  const ruleFilterOptions = createRuleFilterOptions(findings)
  const filteredFindings = filterFindingsByRule(findings, selectedRule)
  const pagination = createPaginationModel(filteredFindings, page, pageSize)

  /**
   * 表示件数を変更し、新しいページ構成を1ページ目から表示する。
   *
   * @param nextPageSize 新しい1ページあたりの表示件数。
   */
  const handlePageSizeChange = (nextPageSize: number) => {
    // 画面で提供している表示件数だけを共有状態へ採用する。
    if (
      !PAGE_SIZE_OPTIONS.includes(
        nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
      )
    ) {
      return
    }

    setPageSize(nextPageSize)
    setPage(1)
  }

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>YamabikoLab</p>
        <h1>WP 翻訳チェッカー</h1>
        <p className={styles.version}>v{__APP_VERSION__}</p>
        <p className={styles.lead}>
          WordPress 日本語翻訳スタイルガイド（{STYLE_GUIDE_LAST_UPDATED}
          最終更新）の対象ルールと、日本語 Glossary
          の登録訳語をブラウザー内で確認します。
        </p>
        <p className={styles.privacy}>
          選択した翻訳内容は外部の確認サービスへ送信しません。
        </p>
      </header>

      <section className={styles.inputCard} aria-labelledby="file-input-title">
        <div>
          <h2 id="file-input-title">PO ファイルを選択</h2>
          <p className={styles.secondaryText}>
            ファイルを選択しただけでは確認を開始しません。
          </p>
        </div>

        <label className={styles.fileInput}>
          <span>.po ファイル</span>
          <input
            type="file"
            accept=".po,text/x-gettext-translation"
            onChange={handleFileChange}
          />
        </label>

        {selectedFile !== null && (
          <p className={styles.selectedFile}>
            選択中: <strong>{selectedFile.name}</strong>
          </p>
        )}

        <button
          type="button"
          className={styles.checkButton}
          disabled={selectedFile === null || state.status === 'checking'}
          onClick={handleCheck}
        >
          {state.status === 'checking' ? '確認中…' : '確認する'}
        </button>

        {state.status === 'checking' && (
          <p className={styles.checking} role="status">
            {state.file.name} を確認しています。
          </p>
        )}
      </section>

      {state.status === 'feedback' && (
        <section
          ref={feedbackRef}
          className={styles.feedback}
          tabIndex={-1}
          aria-live="polite"
        >
          <Feedback state={state} />
        </section>
      )}

      {state.status === 'success' && (
        <>
          <section
            ref={summaryRef}
            className={styles.summary}
            tabIndex={-1}
            aria-labelledby="result-summary-title"
          >
            <div>
              <p className={styles.eyebrow}>確認完了</p>
              <h2 id="result-summary-title">確認が正常に完了しました</h2>
            </div>

            <dl className={styles.counts}>
              <div className={styles.errorCount}>
                <dt>Error</dt>
                <dd>{summary.errorCount}件</dd>
              </div>
              <div className={styles.warningCount}>
                <dt>Warning</dt>
                <dd>{summary.warningCount}件</dd>
              </div>
            </dl>

            {summary.totalCount === 0 && (
              <div className={styles.noFindings}>
                <p>WTC の自動チェックでは問題が見つかりませんでした。</p>
                <p>手動で確認したい項目もあります。</p>
              </div>
            )}

            <CheckScopeGuide />

            <div className={styles.exportArea}>
              <div>
                <h3>確認結果を共有・保存</h3>
                <p>
                  CSV / JSON はファイルとして保存し、Markdown
                  はクリップボードへコピーします。
                </p>
              </div>
              <div className={styles.exportActions}>
                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={handleCsvDownload}
                >
                  CSV をダウンロード
                </button>
                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={handleJsonDownload}
                >
                  JSON をダウンロード
                </button>
                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={handleMarkdownCopy}
                >
                  Markdown をコピー
                </button>
              </div>
              {copyFeedback === 'success' && (
                <p className={styles.copySuccess} role="status">
                  Markdown をクリップボードへコピーしました。
                </p>
              )}
              {copyFeedback === 'failure' && (
                <p className={styles.copyFailure} role="alert">
                  Markdown
                  をコピーできませんでした。ブラウザーのクリップボード利用設定を確認してください。
                </p>
              )}
            </div>
          </section>

          {glossaryFindings.length > 0 && (
            <section
              className={styles.findingsSection}
              aria-labelledby="glossary-findings-title"
            >
              <div className={styles.findingsHeading}>
                <h2 id="glossary-findings-title">Glossary の確認</h2>
                <p>{glossaryFindings.length}件の Warning</p>
              </div>
              <p className={styles.glossaryIntro}>
                登録訳語と異なる可能性がある箇所です。文脈と Glossary
                の補足を確認してください。
              </p>
              <div className={styles.findingsList}>
                {glossaryFindings.map((finding) => (
                  <GlossaryFindingCard key={finding.key} finding={finding} />
                ))}
              </div>
            </section>
          )}

          {findings.length > 0 && (
            <section
              className={styles.findingsSection}
              aria-labelledby="findings-title"
            >
              <div className={styles.findingsHeading}>
                <h2 id="findings-title">指摘一覧</h2>
                <p>{filteredFindings.length}件の指摘</p>
              </div>

              <label className={styles.ruleFilter}>
                <span>ルールで絞り込む</span>
                <select
                  value={selectedRule ?? ''}
                  onChange={(event) => {
                    setSelectedRule(event.target.value || null)
                    setPage(1)
                  }}
                >
                  <option value="">すべてのルール</option>
                  {ruleFilterOptions.map((option) => (
                    <option
                      key={option.styleGuideItem}
                      value={option.styleGuideItem}
                    >
                      {option.styleGuideItem} ({option.count})
                    </option>
                  ))}
                </select>
              </label>

              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pageSize}
                totalCount={pagination.totalCount}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                items={pagination.items}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />

              <div className={styles.findingsList}>
                {pagination.visibleFindings.map((finding) => (
                  <FindingCard key={finding.key} finding={finding} />
                ))}
              </div>

              <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pageSize}
                totalCount={pagination.totalCount}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                items={pagination.items}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </section>
          )}
        </>
      )}
    </main>
  )
}
