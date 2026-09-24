/**
 * 簡易な結果出力で実際の翻訳修正に十分か確認する POC 画面を提供する。
 *
 * PO Interpretation と日本語 v1 Check の既存契約をそのまま利用し、
 * 問題箇所の位置情報やハイライトを追加せずに結果を提示する。
 */

import { useState } from 'react'
import './App.css'
import { resolveLocale } from './validation/locale/resolve-locale'
import {
  interpretPo,
  type TranslationEntry,
} from './validation/po/interpret-po'
import {
  check,
  type TranslationCheckResult,
} from './validation/rules/ja/check'

type PocResult =
  | { status: 'idle' }
  | { status: 'reading'; fileName: string }
  | { status: 'invalid-po'; fileName: string }
  | { status: 'unresolved-locale'; fileName: string }
  | { status: 'unsupported-locale'; fileName: string; locale: string }
  | {
      status: 'success'
      fileName: string
      entries: readonly TranslationEntry[]
      results: readonly TranslationCheckResult[]
    }
  | { status: 'error'; fileName: string; message: string }

/**
 * 実ファイルを読み込み、簡易結果だけで修正箇所を判断できるか確認する POC。
 */
function App() {
  const [result, setResult] = useState<PocResult>({ status: 'idle' })

  /**
   * 選択された PO を既存の Validation Core 境界で解釈・確認する。
   *
   * @param file 利用者が選択した PO ファイル。
   */
  const inspectFile = async (file: File) => {
    setResult({ status: 'reading', fileName: file.name })

    try {
      const source = await file.text()
      const interpretation = interpretPo(source)

      if (interpretation.status === 'invalid-po') {
        setResult({ status: 'invalid-po', fileName: file.name })
        return
      }

      const locale = resolveLocale(interpretation.document.metadata)
      if (locale.status === 'unresolved') {
        setResult({ status: 'unresolved-locale', fileName: file.name })
        return
      }

      if (locale.locale !== 'ja') {
        setResult({
          status: 'unsupported-locale',
          fileName: file.name,
          locale: locale.locale,
        })
        return
      }

      setResult({
        status: 'success',
        fileName: file.name,
        entries: interpretation.document.entries,
        results: check(interpretation.document.entries),
      })
    } catch (error) {
      setResult({
        status: 'error',
        fileName: file.name,
        message:
          error instanceof Error ? error.message : '確認中にエラーが発生しました。',
      })
    }
  }

  const entryByIndex =
    result.status === 'success'
      ? new Map(result.entries.map((entry) => [entry.entryIndex, entry]))
      : undefined

  return (
    <main className="poc">
      <header className="poc__header">
        <p className="poc__eyebrow">POC</p>
        <h1>簡易結果出力の実用性確認</h1>
        <p>
          問題箇所の位置情報やハイライトを表示せず、現在の日本語 v1 Check
          が返すメッセージだけで修正できるか確認します。
        </p>
      </header>

      <section className="poc__input" aria-labelledby="po-file-heading">
        <h2 id="po-file-heading">PO ファイル</h2>
        <input
          type="file"
          accept=".po,text/plain"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) {
              void inspectFile(file)
            }
          }}
        />
      </section>

      <ResultView result={result} entryByIndex={entryByIndex} />
    </main>
  )
}

/**
 * POC の確認状態と簡易結果一覧を表示する。
 *
 * @param result 現在の確認状態または確認結果。
 * @param entryByIndex entryIndex から原文・翻訳を参照するための対応表。
 */
function ResultView({
  result,
  entryByIndex,
}: {
  result: PocResult
  entryByIndex?: ReadonlyMap<number, TranslationEntry>
}) {
  if (result.status === 'idle') {
    return <p className="poc__status">PO ファイルを選択してください。</p>
  }

  if (result.status === 'reading') {
    return <p className="poc__status">{result.fileName} を確認しています…</p>
  }

  if (result.status === 'invalid-po') {
    return <p className="poc__status">PO ファイルを解釈できませんでした。</p>
  }

  if (result.status === 'unresolved-locale') {
    return <p className="poc__status">対象ロケールを判定できませんでした。</p>
  }

  if (result.status === 'unsupported-locale') {
    return (
      <p className="poc__status">
        この POC は日本語 PO のみ対象です。検出ロケール: {result.locale}
      </p>
    )
  }

  if (result.status === 'error') {
    return <p className="poc__status poc__status--error">{result.message}</p>
  }

  if (result.results.length === 0) {
    return (
      <section className="poc__results">
        <h2>結果</h2>
        <p>指摘はありませんでした。</p>
      </section>
    )
  }

  const errorCount = result.results.reduce(
    (total, item) => total + item.errors.length,
    0,
  )
  const warningCount = result.results.reduce(
    (total, item) => total + item.warnings.length,
    0,
  )

  return (
    <section className="poc__results" aria-labelledby="results-heading">
      <div className="poc__summary">
        <div>
          <h2 id="results-heading">結果</h2>
          <p>{result.fileName}</p>
        </div>
        <p>
          {result.results.length}件の翻訳に指摘 / Error {errorCount}件 / Warning{' '}
          {warningCount}件
        </p>
      </div>

      <ol className="result-list">
        {result.results.map((item) => {
          const entry = entryByIndex?.get(item.entryIndex)
          return (
            <li className="result-card" key={item.entryIndex}>
              <div className="result-card__identity">
                entryIndex: {item.entryIndex}
              </div>

              <dl>
                <div>
                  <dt>原文</dt>
                  <dd>{entry?.source.singular ?? '取得できませんでした'}</dd>
                </div>
                <div>
                  <dt>翻訳</dt>
                  <dd>{entry?.translations[0]?.text ?? '取得できませんでした'}</dd>
                </div>
              </dl>

              <MessageList label="Error" messages={item.errors} />
              <MessageList label="Warning" messages={item.warnings} />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/**
 * Severity ごとの簡易メッセージを一覧表示する。
 *
 * @param label 表示する Severity。
 * @param messages 日本語 v1 Check が返した指摘。
 */
function MessageList({
  label,
  messages,
}: {
  label: 'Error' | 'Warning'
  messages: TranslationCheckResult['errors']
}) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className="message-group">
      <h3>{label}</h3>
      <ul>
        {messages.map((message, index) => (
          <li key={`${message.styleGuideItem}:${message.message}:${index}`}>
            <strong>{message.styleGuideItem}</strong>
            <span>{message.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
