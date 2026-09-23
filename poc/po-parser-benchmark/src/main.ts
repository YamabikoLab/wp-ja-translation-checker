import { runBenchmark } from './benchmark'
import { runCorrectnessGate } from './correctness'
import { parsePo } from './parser'

const benchmarkSizes = [500, 5_000, 15_000, 30_000] as const

const correctnessStatus = document.querySelector('#correctness-status')
const correctnessResults = document.querySelector('#correctness-results')
const runButton = document.querySelector<HTMLButtonElement>('#run-benchmark')
const benchmarkStatus = document.querySelector('#benchmark-status')
const benchmarkResults = document.querySelector('#benchmark-results')

if (
  !correctnessStatus ||
  !correctnessResults ||
  !runButton ||
  !benchmarkStatus ||
  !benchmarkResults
) {
  throw new Error('PO parser benchmark UI の初期化に必要な要素がありません。')
}

const gateResults = runCorrectnessGate(parsePo)
const gatePassed = gateResults.every((check) => check.passed)

for (const check of gateResults) {
  const item = document.createElement('li')
  item.textContent = `${check.passed ? 'PASS' : 'FAIL'}: ${check.name} — ${check.detail}`
  correctnessResults.append(item)
}

correctnessStatus.textContent = gatePassed
  ? 'PASS: performance comparison を実行できます。'
  : 'FAIL: correctness gate を通過していないため benchmark は実行しません。'
runButton.disabled = !gatePassed

runButton.addEventListener('click', async () => {
  runButton.disabled = true
  benchmarkStatus.textContent = '計測中...'
  benchmarkResults.replaceChildren()

  try {
    const results = await runBenchmark(parsePo, benchmarkSizes)

    for (const benchmark of results) {
      const row = document.createElement('tr')
      const values = [
        benchmark.entryCount.toLocaleString(),
        benchmark.inputBytes.toLocaleString(),
        benchmark.minMs.toFixed(2),
        benchmark.medianMs.toFixed(2),
        benchmark.maxMs.toFixed(2),
        benchmark.hasFiftyMsParse ? 'Yes' : 'No',
      ]

      for (const value of values) {
        const cell = document.createElement('td')
        cell.textContent = value
        row.append(cell)
      }

      benchmarkResults.append(row)
    }

    benchmarkStatus.textContent =
      '完了しました。50ms+ parse は main-thread blocking の後続検討材料として扱います。'
  } catch (error) {
    benchmarkStatus.textContent =
      error instanceof Error ? `計測失敗: ${error.message}` : '計測に失敗しました。'
  } finally {
    runButton.disabled = false
  }
})
