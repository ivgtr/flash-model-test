export type SortDirection = 'asc' | 'desc'

export interface LineSortOptions {
  direction?: SortDirection
  caseSensitive?: boolean
  natural?: boolean
  ignoreLeadingWhitespace?: boolean
  removeBlankLines?: boolean
}

export const DEFAULT_SORT_OPTIONS: Required<LineSortOptions> = {
  direction: 'asc',
  caseSensitive: true,
  natural: false,
  ignoreLeadingWhitespace: false,
  removeBlankLines: false,
}

export function parseDirection(value: string): SortDirection | null {
  if (value === 'asc' || value === 'desc') {
    return value
  }
  return null
}

interface SortChunk {
  numeric: boolean
  value: string
}

function splitChunks(value: string): SortChunk[] {
  const chunks: SortChunk[] = []
  const parts = value.split(/(\d+)/)
  for (const part of parts) {
    if (part === '') {
      continue
    }
    chunks.push({ numeric: /^\d+$/.test(part), value: part })
  }
  return chunks
}

function compareChunkStrings(a: string, b: string, caseSensitive: boolean): number {
  const keyA = caseSensitive ? a : a.toLowerCase()
  const keyB = caseSensitive ? b : b.toLowerCase()
  if (keyA < keyB) {
    return -1
  }
  if (keyA > keyB) {
    return 1
  }
  return 0
}

function compareNatural(a: string, b: string, caseSensitive: boolean): number {
  const chunksA = splitChunks(a)
  const chunksB = splitChunks(b)
  const length = Math.min(chunksA.length, chunksB.length)
  for (let index = 0; index < length; index += 1) {
    const chunkA = chunksA[index]!
    const chunkB = chunksB[index]!
    if (chunkA.numeric && chunkB.numeric) {
      const numberA = BigInt(chunkA.value)
      const numberB = BigInt(chunkB.value)
      if (numberA !== numberB) {
        return numberA < numberB ? -1 : 1
      }
      if (chunkA.value !== chunkB.value) {
        return chunkA.value < chunkB.value ? -1 : 1
      }
      continue
    }
    const compared = compareChunkStrings(chunkA.value, chunkB.value, caseSensitive)
    if (compared !== 0) {
      return compared
    }
  }
  if (chunksA.length !== chunksB.length) {
    return chunksA.length < chunksB.length ? -1 : 1
  }
  return 0
}

function compareLines(a: string, b: string, options: Required<LineSortOptions>): number {
  const keyA = options.ignoreLeadingWhitespace ? a.replace(/^\s+/, '') : a
  const keyB = options.ignoreLeadingWhitespace ? b.replace(/^\s+/, '') : b
  const compared = options.natural
    ? compareNatural(keyA, keyB, options.caseSensitive)
    : compareChunkStrings(keyA, keyB, options.caseSensitive)
  if (compared === 0) {
    return 0
  }
  return options.direction === 'desc' ? -compared : compared
}

function detectNewline(input: string): string {
  if (input.includes('\r\n')) {
    return '\r\n'
  }
  if (input.includes('\n')) {
    return '\n'
  }
  if (input.includes('\r')) {
    return '\r'
  }
  return '\n'
}

export function sortLines(input: string, options: LineSortOptions = {}): string {
  const resolved: Required<LineSortOptions> = { ...DEFAULT_SORT_OPTIONS, ...options }
  const newline = detectNewline(input)
  const normalized = newline === '\n' ? input : input.split(newline).join('\n')
  let lines = normalized.split('\n')
  if (resolved.removeBlankLines) {
    lines = lines.filter((line) => line.trim() !== '')
  }
  lines.sort((a, b) => compareLines(a, b, resolved))
  return lines.join(newline)
}
