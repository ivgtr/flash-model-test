export const LIMIT_OPTIONS = [10, 20, 50, 'all'] as const

export type TopN = (typeof LIMIT_OPTIONS)[number]

export const DEFAULT_LIMIT: TopN = 10

export interface WordFrequencyOptions {
  caseInsensitive: boolean
  limit: TopN
}

export const DEFAULT_OPTIONS: WordFrequencyOptions = {
  caseInsensitive: false,
  limit: DEFAULT_LIMIT,
}

export interface WordEntry {
  word: string
  count: number
}

export interface WordFrequencyTotals {
  words: number
  unique: number
}

export interface WordFrequencyResult {
  entries: WordEntry[]
  totals: WordFrequencyTotals
}

const WORD_PATTERN = /[\p{L}\p{N}]+/gu

export function tokenize(input: string): string[] {
  return input.match(WORD_PATTERN) ?? []
}

export function countWords(
  input: string,
  options: WordFrequencyOptions = DEFAULT_OPTIONS,
): WordFrequencyResult {
  const tokens = tokenize(input)
  const counts = new Map<string, number>()
  const display = new Map<string, string>()

  for (const token of tokens) {
    const key = options.caseInsensitive ? token.toLowerCase() : token
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!display.has(key)) {
      display.set(key, token)
    }
  }

  const entries = Array.from(counts.entries())
    .map(([key, count]) => ({ word: display.get(key) ?? key, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }
      const aLower = a.word.toLowerCase()
      const bLower = b.word.toLowerCase()
      if (aLower !== bLower) {
        return aLower < bLower ? -1 : 1
      }
      if (a.word !== b.word) {
        return a.word < b.word ? -1 : 1
      }
      return 0
    })

  const limited = options.limit === 'all' ? entries : entries.slice(0, options.limit)

  return { entries: limited, totals: { words: tokens.length, unique: counts.size } }
}
