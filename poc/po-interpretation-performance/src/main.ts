/**
 * PO Interpretation performance / memory validation POC のブラウザー操作を提供する。
 *
 * performance は production の interpretPo() を直接計測し、memory は DevTools で
 * 呼び出し全体の peak allocation を観察できる単発実行導線を提供する。
 */

import { runBenchmark, runInterpretation } from './benchmark'
import { generateSyntheticPo } from './generate-po'

const validationSizes = [500, 5_000, 15_000, 30_000] as const
const encoder = new TextEncoder()

const benchmarkButton =
  document.querySelector<HTMLButtonElement>('#run-benchmark')
const benchmarkStatus = document.querySelector('#benchmark-status')
const benchmarkResults = document.querySelector('#benchmark-results')
const fileInput = document.querySelector<HTMLInputElement>('#po-file')
const fileStatus = document.querySelector('#file-status')
const fileResults = document.querySelector('#file-results')
const memoryButtons = document.querySelector('#memory-buttons')
const memoryStatus = document.querySelector('#memory-status')

if (
  !benchmarkButton ||
  !benchmarkStatus ||
  !benchmarkResults ||
  !fileInput ||
  !fileStatus ||
  !fileResults ||
  !memoryButtons ||
  !memoryStatus
) {
  throw new Error('Performance validation POC の初期化に必要な要素がありません。')
}

/**
 * 実 PO の計測結果を表示する。
 *
 * @param label 結果項目名。
 * @param value 表示値。
 */
const appendFileResult = (label: string, value: string): void => {
  const term = document.createElement('dt')
  const detail = document.createElement('dd')
  term.textContent = label
  detail.textContent = value
  fileResults.append(term, detail)
}

benchmarkButton.addEventListener('click', async () => {
  benchmarkButton.disabled = true
  benchmarkStatus.textContent = '計測中...'
  benchmarkResults.replaceChildren()

  try {
    const results = await runBenchmark(validationSizes)

    // 各 validation size の実測値を同じ列構成で表示する。
    for (const result of results) {
      const row = document.createElement('tr')
      const values = [
        result.entryCount.toLocaleString(),
        result.inputBytes.toLocaleString(),
        result.minMs.toFixed(2),
        result.medianMs.toFixed(2),
        result.maxMs.toFixed(2),
      ]

      for (const value of values) {
        const cell = document.createElement('td')
        cell.textContent = value
        row.append(cell)
      }

      benchmarkResults.append(row)
    }

    benchmarkStatus.textContent =
      '計測完了。結果を #20 の実測記録へ転記してください。'
  } catch (error) {
    benchmarkStatus.textContent =
      error instanceof Error
        ? '計測失敗: ' + error.message
        : '計測に失敗しました。'
  } finally {
    benchmarkButton.disabled = false
  }
})

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  fileResults.replaceChildren()

  if (!file) {
    fileStatus.textContent = ''
    return
  }

  fileStatus.textContent = '読み込み・解釈中...'

  try {
    const source = await file.text()
    const startedAt = performance.now()
    const interpretedEntries = runInterpretation(source)
    const elapsedMs = performance.now() - startedAt

    appendFileResult('File', file.name)
    appendFileResult('Input bytes', file.size.toLocaleString())
    appendFileResult('Interpreted entries', interpretedEntries.toLocaleString())
    appendFileResult('Interpretation time', elapsedMs.toFixed(2) + ' ms')
    fileStatus.textContent =
      'PASS: production の PO Interpretation で解釈できました。'
  } catch (error) {
    fileStatus.textContent =
      error instanceof Error
        ? 'FAIL: ' + error.message
        : 'FAIL: PO Interpretation に失敗しました。'
  }
})

// 4サイズを個別に実行できるようにし、各呼び出しを DevTools の memory recording で分離して観察可能にする。
for (const entryCount of validationSizes) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = entryCount.toLocaleString() + ' entries を1回実行'

  button.addEventListener('click', async () => {
    memoryStatus.textContent =
      entryCount.toLocaleString() + ' entries を準備中...'
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    try {
      const source = generateSyntheticPo(entryCount)
      const inputBytes = encoder.encode(source).byteLength
      const startedAt = performance.now()
      const interpretedEntries = runInterpretation(source)
      const elapsedMs = performance.now() - startedAt

      memoryStatus.textContent =
        entryCount.toLocaleString() +
        ' entries / ' +
        inputBytes.toLocaleString() +
        ' bytes を完了: ' +
        interpretedEntries.toLocaleString() +
        ' interpreted entries / ' +
        elapsedMs.toFixed(2) +
        ' ms。DevTools の記録で interpretPo() 全体の peak allocation を確認してください。'
    } catch (error) {
      memoryStatus.textContent =
        error instanceof Error
          ? '実行失敗: ' + error.message
          : 'memory validation 用実行に失敗しました。'
    }
  })

  memoryButtons.append(button)
}
