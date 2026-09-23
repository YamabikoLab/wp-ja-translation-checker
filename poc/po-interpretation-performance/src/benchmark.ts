/**
 * production の PO Interpretation 全体について browser 上の処理時間を計測する。
 */

import { interpretPo } from '../../../src/validation/po/interpret-po'
import { generateSyntheticPo } from './generate-po'

export type BenchmarkResult = {
  entryCount: number
  inputBytes: number
  minMs: number
  medianMs: number
  maxMs: number
}

const encoder = new TextEncoder()

/**
 * production の PO Interpretation が正常完了することを確認しながら1回実行する。
 *
 * @param source 計測対象の PO 文字列。
 * @returns 解釈後に validation 対象として保持された entry 数。
 */
export const runInterpretation = (source: string): number => {
  const result = interpretPo(source)

  if (result.status !== 'success') {
    throw new Error('synthetic PO が invalid-po として扱われました。')
  }

  return result.document.entries.length
}

/**
 * 1つの入力を warm-up 後に複数回計測する。
 *
 * @param source 計測対象の PO 文字列。
 * @param iterations 計測回数。warm-up は含めない。
 * @returns 各回の処理時間。
 */
const measure = (source: string, iterations: number): number[] => {
  const durations: number[] = []

  runInterpretation(source)

  // warm-up を除外した同一入力の実測値を収集する。
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const startedAt = performance.now()
    runInterpretation(source)
    durations.push(performance.now() - startedAt)
  }

  return durations
}

/**
 * 計測値を Issue #30 で必要な指標へ集約する。
 *
 * @param entryCount synthetic PO の entry 数。
 * @param source 計測した PO 文字列。
 * @param durations warm-up を除いた処理時間。
 * @returns input bytes と min / median / max を含む計測結果。
 */
const summarize = (
  entryCount: number,
  source: string,
  durations: readonly number[],
): BenchmarkResult => {
  const sorted = [...durations].sort((left, right) => left - right)

  return {
    entryCount,
    inputBytes: encoder.encode(source).byteLength,
    minMs: sorted[0] ?? 0,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
    maxMs: sorted.at(-1) ?? 0,
  }
}

/**
 * 指定された各 validation size を順番に計測する。
 *
 * @param entryCounts Issue #30 で定義された entry 数。
 * @param iterations 各サイズの実測回数。
 * @returns 各サイズの処理時間と入力サイズ。
 */
export const runBenchmark = async (
  entryCounts: readonly number[],
  iterations = 5,
): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = []

  // サイズ間でブラウザー描画へ制御を戻し、1つの連続 task にまとめない。
  for (const entryCount of entryCounts) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const source = generateSyntheticPo(entryCount)
    const durations = measure(source, iterations)
    results.push(summarize(entryCount, source, durations))
  }

  return results
}
