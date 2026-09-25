/**
 * 指摘一覧の現在範囲、表示件数、ページ移動、ページ番号直接入力を同じ操作領域として提供する責任を持つ。
 *
 * 確定済みのページ状態は親から受け取り、直接入力の編集中文字列だけを各配置位置で個別に保持する。
 */

import { useEffect, useRef, useState } from 'react'
import { PAGE_SIZE_OPTIONS } from './presentation-model'
import styles from './TranslationChecker.module.css'

/**
 * 指摘一覧の現在範囲、表示件数、ページ移動を同じ操作領域として提供する。
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
export function PaginationControls({
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
    // 他方のページ操作で確定ページが変わっても、利用者が入力途中の文字列は上書きしない。
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

    // 直接入力では、存在するページを表す整数だけを確定済みページとして採用する。
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

        {/* 1ページだけの場合は移動操作を省き、表示件数の選択だけを残す。 */}
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
