import { describe, expect, it } from 'vitest'
import type {
  CheckResult,
  Finding,
  ProblemLocation,
  RuleSpecificDetection,
} from './contracts'

describe('validation contracts', () => {
  it('when a problem is an existing character range, should preserve its side and range', () => {
    const location: ProblemLocation = {
      side: 'translation',
      kind: 'range',
      start: 2,
      end: 5,
    }

    expect(location).toEqual({
      side: 'translation',
      kind: 'range',
      start: 2,
      end: 5,
    })
  })

  it('when a problem is between characters, should preserve its side and boundary offset', () => {
    const location: ProblemLocation = {
      side: 'source',
      kind: 'boundary',
      offset: 3,
    }

    expect(location).toEqual({
      side: 'source',
      kind: 'boundary',
      offset: 3,
    })
  })

  it('when a rule-specific problem is detected, should preserve the data needed for finding coordination', () => {
    const detection: RuleSpecificDetection = {
      ruleId: '1-4',
      severity: 'error',
      summary: '半角文字と全角文字の間に不要なスペースがあります。',
      source: 'Hello 世界',
      translation: 'Hello 世界',
      locations: [
        {
          side: 'translation',
          kind: 'range',
          start: 5,
          end: 6,
        },
      ],
      reason: '半角文字と全角文字の間には原則としてスペースを入れません。',
      styleGuide: {
        item: '1-4',
        url: 'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/',
      },
    }

    expect(detection.locations).toHaveLength(1)
    expect(detection.styleGuide.item).toBe('1-4')
  })

  it('when validation succeeds, should distinguish success from non-checkable results', () => {
    const finding: Finding = {
      ruleId: '1-4',
      severity: 'error',
      summary: '半角文字と全角文字の間に不要なスペースがあります。',
      source: 'Hello 世界',
      translation: 'Hello 世界',
      locations: [
        {
          side: 'translation',
          kind: 'range',
          start: 5,
          end: 6,
        },
      ],
      reason: '半角文字と全角文字の間には原則としてスペースを入れません。',
      styleGuide: {
        item: '1-4',
        url: 'https://ja.wordpress.org/team/handbook/translation/translation-style-guide/',
      },
    }
    const result: CheckResult = {
      status: 'success',
      findings: [finding],
    }

    expect(result.status).toBe('success')
    expect(result.findings).toEqual([finding])
  })

  it.each<CheckResult>([
    { status: 'invalid-po' },
    { status: 'unresolved-locale' },
    { status: 'unsupported-locale', locale: 'fr' },
  ])(
    'when validation cannot complete with $status, should preserve that result as distinct from success',
    (result) => {
      expect(result.status).not.toBe('success')
    },
  )
})
