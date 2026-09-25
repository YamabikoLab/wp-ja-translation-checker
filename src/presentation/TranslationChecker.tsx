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
  createPaginationModel,
  createRuleFilterOptions,
  DEFAULT_PAGE_SIZE,
  filterFindingsByRule,
  getCollapsedText,
  PAGE_SIZE_OPTIONS,
  getCompletionFocusTarget,
  presentationReducer,
  summarizeFindings,
  type Finding,
  type PresentationState,
} from './presentation-model'
import { serializeCsv, serializeJson, serializeMarkdown } from './result-export'
import styles from './TranslationChecker.module.css'

const STYLE_GUIDE_URL =
  'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/'
const STYLE_GUIDE_LAST_UPDATED = '2026年8月28日'

/** Markdown コピー操作の結果として利用者へ通知する状態。 */
type CopyFeedback = 'success' | 'failure' | null

/**
 * 重要な確認不能状態を利用者へ説明する。
 *
 * @param props 確認不能状態を表示するための属性。
 * @param props.state 確認不能を表す画面状態。
 * @returns 確認不能理由と次の操作を示す領域。
 */
function Feedback({
  state,
}: {
  state: Extract<PresentationState, { status: 'feedback' }>
}) {
  switch (state.reason) {
    case 'file-read-failure':
      return (
        <>
          <h2>ファイルを読み取れませんでした</h2>
          <p>別の .po ファイルを選択して、もう一度確認してください。</p>
        </>
      )

    case 'invalid-po':
      return (
        <>
          <h2>PO ファイルを正常に確認できませんでした</h2>
          <p>
            確認可能な PO
            として解釈できませんでした。ファイル内容を確認するか、別の .po
            ファイルを選択してください。
          </p>
        </>
      )

    case 'unresolved-locale':
      return (
        <>
          <h2>ロケールを判定できませんでした</h2>
          <p>
            対象ロケールを特定できないため確認を続行できません。PO ファイルの
            Language ヘッダーを確認してください。
          </p>
        </>
      )

    case 'unsupported-locale':
      return (
        <>
          <h2>このロケールには対応していません</h2>
          <p>
            判定されたロケールは「{state.locale}
            」です。現在は日本語（ja）のみ対応しています。
          </p>
        </>
      )
  }
}

/**
 * 200文字を超える原文または翻訳を、利用者が個別に展開・折りたたみできる形で表示する。
 *
 * @param props 文字列表示に必要な属性。
 * @param props.text 表示対象の文字列。
 * @param props.matches 翻訳内の一致範囲。原文表示では省略可能。
 * @returns 長文時だけ展開操作を持つ文字列表示。
 */

function ExpandableText({
  text,
  matches = [],
}: {
  text: string
  matches?: Finding['matches']
}) {
  const [expanded, setExpanded] = useState(false)
  const { isLong, collapsed } = getCollapsedText(text)
  const displayedText = isLong && !expanded ? collapsed : text
  const originalVisibleEnd =
    isLong && !expanded ? collapsed.slice(0, -1).length : text.length
  const visibleMatches = matches
    .map(({ start, end }) => ({
      start: Math.max(0, start),
      end: Math.min(end, originalVisibleEnd),
    }))
    .filter(({ start, end }) => start < end)
    .sort((left, right) => left.start - right.start || left.end - right.end)
  const normalizedMatches: Array<Finding['matches'][number]> = []

  // 重複・隣接する範囲を1つへまとめ、同じ文字を欠落・重複させずに表示する。
  for (const match of visibleMatches) {
    const previous = normalizedMatches[normalizedMatches.length - 1]

    if (previous !== undefined && match.start <= previous.end) {
      normalizedMatches[normalizedMatches.length - 1] = {
        start: previous.start,
        end: Math.max(previous.end, match.end),
      }
    } else {
      normalizedMatches.push(match)
    }
  }

  const content = []
  let cursor = 0

  // 元の翻訳文字列を順番どおり保持し、一致範囲だけを視覚的な強調へ変換する。
  for (const [index, match] of normalizedMatches.entries()) {
    content.push(displayedText.slice(cursor, match.start))
    content.push(
      <mark
        className={styles.ngMatch}
        key={`${match.start}-${match.end}-${index}`}
      >
        {displayedText.slice(match.start, match.end)}
      </mark>,
    )
    cursor = match.end
  }
  content.push(displayedText.slice(cursor))

  if (!isLong) {
    return <p className={styles.translationText}>{content}</p>
  }

  return (
    <div>
      <p className={styles.translationText}>{content}</p>
      <button
        type="button"
        className={styles.textToggle}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? '折りたたむ' : '全文を表示'}
      </button>
    </div>
  )
}

/**
 * 1件の CheckMessage と、その指摘が属する entry の原文・翻訳を表示する。
 *
 * @param props 指摘表示に必要な属性。
 * @param props.finding 表示対象の1指摘。
 * @returns Severity、メッセージ、翻訳比較、一次情報へのリンクを含む指摘。
 */
function FindingCard({ finding }: { finding: Finding }) {
  const translation = finding.entry.translations[0]?.text ?? ''

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

      <p className={styles.guideReference}>
        <span>スタイルガイド: {finding.styleGuideItem}</span>
        <a href={STYLE_GUIDE_URL} target="_blank" rel="noreferrer">
          WordPress 日本語翻訳スタイルガイドを確認
        </a>
      </p>
    </article>
  )
}

/**
 * 指摘一覧の現在範囲、表示件数、ページ移動を同じ操作領域として提供する。
 *
 * 確定済みのページ状態は親から受け取り、直接入力の編集中文字列だけを各配置位置で個別に保持する。
 *
 * @param props ページ表示と操作に必要な属性。
 * @param props.currentPage 現在表示している1始まりのページ番号。
 * @param props.totalPages フィルター後の総ページ数。
 * @param props.pageSize 1ページあたりの表示件数。
 * @param props.totalCount フィルター後の総指摘件数。
 * @param props.rangeStart 現在ページの先頭指摘番号。
 * @param props.rangeEnd 現在ページの末尾指摘番号。
 * @param props.items 表示するページ番号と省略記号。
 * @param props.onPageChange 確定したページ移動を通知する関数。
 * @param props.onPageSizeChange 表示件数変更を通知する関数。
 * @returns 指摘一覧のページ移動操作。
 */
function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  rangeStart,
  rangeEnd,
  items,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  rangeStart: number
  rangeEnd: number
  items: readonly (number | 'ellipsis')[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const [pageDraft, setPageDraft] = useState(String(currentPage))
  const editingRef = useRef(false)

  useEffect(() => {
    if (!editingRef.current) {
      setPageDraft(String(currentPage))
    }
  }, [currentPage])

  /**
   * 直接入力されたページ番号を確定し、有効な整数だけを共有ページ状態へ反映する。
   */
  const commitPageDraft = () => {
    const nextPage = Number(pageDraft)

    editingRef.current = false

    if (Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= totalPages) {
      setPageDraft(String(nextPage))
      onPageChange(nextPage)
      return
    }

    setPageDraft(String(currentPage))
  }

  return (
    <div className={styles.paginationArea}>
      <p className={styles.paginationRange}>
        {rangeStart}–{rangeEnd} / {totalCount}件の指摘
      </p>

      <div className={styles.paginationControls}>
        <label className={styles.pageSizeControl}>
          <span>表示件数</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}件
              </option>
            ))}
          </select>
        </label>

        {totalPages > 1 && (
          <>
            <nav
              className={styles.pageNavigation}
              aria-label="指摘一覧のページ移動"
            >
              <button
                type="button"
                aria-label="前のページ"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                ‹
              </button>
              {items.map((item, index) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={styles.pageEllipsis}
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    aria-current={item === currentPage ? 'page' : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="次のページ"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                ›
              </button>
            </nav>

            <label className={styles.directPageControl}>
              <span>ページ</span>
              <input
                type="text"
                inputMode="numeric"
                value={pageDraft}
                aria-label="移動先ページ"
                onFocus={() => {
                  editingRef.current = true
                }}
                onChange={(event) => {
                  editingRef.current = true
                  setPageDraft(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitPageDraft()
                  }
                }}
                onBlur={commitPageDraft}
              />
              <span>/ {totalPages}</span>
            </label>
          </>
        )}
      </div>
    </div>
  )
}

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
    downloadResult(serializeCsv(findings), 'csv', 'text/csv;charset=utf-8')
  }

  /**
   * 現在の確認結果全体を JSON として保存する。
   */
  const handleJsonDownload = () => {
    if (state.status !== 'success') {
      return
    }

    downloadResult(
      serializeJson(state.file.name, findings),
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
        serializeMarkdown(state.file.name, findings),
      )
      setCopyFeedback('success')
    } catch {
      setCopyFeedback('failure')
    }
  }

  const selectedFile = state.status === 'no-file' ? null : state.file
  const findings =
    state.status === 'success' ? createFindings(state.result) : []
  const summary = summarizeFindings(findings)
  const ruleFilterOptions = createRuleFilterOptions(findings)
  const filteredFindings = filterFindingsByRule(findings, selectedRule)
  const pagination = createPaginationModel(filteredFindings, page, pageSize)

  /**
   * 表示件数を変更し、新しいページ構成を1ページ目から表示する。
   *
   * @param nextPageSize 新しい1ページあたりの表示件数。
   */
  const handlePageSizeChange = (nextPageSize: number) => {
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
          最終更新）の対象ルールを、ブラウザー内で確認します。
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
              <p className={styles.noFindings}>
                {STYLE_GUIDE_LAST_UPDATED}
                最終更新版の対象ルールでは問題が検出されませんでした。
              </p>
            )}

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
