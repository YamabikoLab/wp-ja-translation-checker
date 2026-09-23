export type Severity = 'error' | 'warning'

export type ProblemLocation =
  | {
      side: 'source' | 'translation'
      kind: 'range'
      startOffset: number
      endOffset: number
    }
  | {
      side: 'source' | 'translation'
      kind: 'boundary'
      offset: number
    }

export type StyleGuideReference = {
  item: string
  url: string
}

export type RuleSpecificDetection = {
  ruleId: string
  severity: Severity
  summary: string
  source: string
  translation: string
  locations: readonly ProblemLocation[]
  reason: string
  styleGuide: StyleGuideReference
}

export type Finding = {
  ruleId: string
  severity: Severity
  summary: string
  source: string
  translation: string
  locations: readonly ProblemLocation[]
  reason: string
  styleGuide: StyleGuideReference
}

export type CheckResult =
  | {
      status: 'success'
      findings: readonly Finding[]
    }
  | {
      status: 'invalid-po'
    }
  | {
      status: 'unresolved-locale'
    }
  | {
      status: 'unsupported-locale'
      locale: string
    }
