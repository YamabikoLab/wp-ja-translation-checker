import { generateSyntheticPo } from './generate-po'
import type { ParsedPo } from './parser'

export interface BenchmarkResult {
  entryCount: number
  inputBytes: number
  minMs: number
  medianMs: number
  maxMs: number
  hasFiftyMsParse: boolean
}

const measureParse = (
  source: string,
  parse: (source: string) => ParsedPo,
  iterations: number,
): number[] => {
  const durations: number[] = []

  parse(source)

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const startedAt = performance.now()
    parse(source)
    durations.push(performance.now() - startedAt)
  }

  return durations
}

const summarize = (
  entryCount: number,
  source: string,
  durations: number[],
): BenchmarkResult => {
  const sorted = [...durations].sort((left, right) => left - right)
  const medianIndex = Math.floor(sorted.length / 2)

  return {
    entryCount,
    inputBytes: new TextEncoder().encode(source).byteLength,
    minMs: sorted[0] ?? 0,
    medianMs: sorted[medianIndex] ?? 0,
    maxMs: sorted.at(-1) ?? 0,
    hasFiftyMsParse: sorted.some((duration) => duration >= 50),
  }
}

export const runBenchmark = async (
  parse: (source: string) => ParsedPo,
  entryCounts: readonly number[],
  iterations = 5,
): Promise<BenchmarkResult[]> => {
  const results: BenchmarkResult[] = []

  for (const entryCount of entryCounts) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const source = generateSyntheticPo(entryCount)
    const durations = measureParse(source, parse, iterations)
    results.push(summarize(entryCount, source, durations))
  }

  return results
}
