import { runBenchmark } from './benchmark'
import { runCorrectnessGate } from './correctness'
import { parsePo, type ParsedPo } from './parser'

const benchmarkSizes = [500, 5_000, 15_000, 30_000] as const

const correctnessStatus = document.querySelector('#correctness-status')
const correctnessResults = document.querySelector('#correctness-results')
const fileInput = document.querySelector<HTMLInputElement>('#po-file')
const fileStatus = document.querySelector('#file-status')
const fileResults = document.querySelector('#file-results')
const runButton = document.querySelector<HTMLButtonElement>('#run-benchmark')
const benchmarkStatus = document.querySelector('#benchmark-status')
const benchmarkResults = document.querySelector('#benchmark-results')

if (
  !correctnessStatus ||
  !correctnessResults ||
  !fileInput ||
  !fileStatus ||
  !fileResults ||
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
  ? 'PASS: 実 PO ファイル確認と performance comparison を実行できます。'
  : 'FAIL: correctness gate を通過していないため後続確認は実行しません。'
fileInput.disabled = !gatePassed
runButton.disabled = !gatePassed

const countEntries = (parsed: ParsedPo): number =>
  Object.values(parsed.translations).reduce(
    (total, context) =>
      total + Object.keys(context).filter((msgid) => msgid !== '').length,
    0,
  )

const appendFileResult = (label: string, value: string): void => {
  const term = document.createElement('dt')
  const detail = document.createElement('dd')
  term.textContent = label
  detail.textContent = value
  fileResults.append(term, detail)
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  fileResults.replaceChildren()

  if (!file) {
    fileStatus.textContent = ''
    return
  }

  fileStatus.textContent = '読み込み・解析中...'

  try {
    const source = await file.text()
    const startedAt = performance.now()
    const parsed = parsePo(source)
    const elapsedMs = performance.now() - startedAt

    appendFileResult('File', file.name)
    appendFileResult('Input bytes', file.size.toLocaleString())
    appendFileResult('Entries', countEntries(parsed).toLocaleString())
    appendFileResult('Language', parsed.headers?.Language ?? '(none)')
    appendFileResult('Parse time', `${elapsedMs.toFixed(2)} ms`)
    fileStatus.textContent = 'PASS: ブラウザー内で PO を解析できました。'
  } catch (error) {
    fileStatus.textContent =
      error instanceof Error ? `FAIL: ${error.message}` : 'FAIL: PO の解析に失敗しました。'
  }
})

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
