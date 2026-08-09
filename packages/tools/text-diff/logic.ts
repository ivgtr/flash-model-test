export type DiffLineType = 'add' | 'remove' | 'same'

export interface DiffLine {
  type: DiffLineType
  text: string
}

export type DiffResult =
  { ok: true; lines: DiffLine[]; added: number; removed: number } | { ok: false; error: string }

export const MAX_DIFF_LINES = 2000

const DIFF_MARKERS: Record<DiffLineType, string> = {
  add: '+',
  remove: '-',
  same: ' ',
}

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function splitLines(text: string): string[] {
  const lines = normalizeNewlines(text).split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

export function computeLineDiff(original: string, changed: string): DiffResult {
  const originalLines = splitLines(original)
  const changedLines = splitLines(changed)
  if (originalLines.length > MAX_DIFF_LINES || changedLines.length > MAX_DIFF_LINES) {
    return {
      ok: false,
      error: `Input is too large: each text can contain at most ${MAX_DIFF_LINES} lines.`,
    }
  }
  const lines = diffLines(originalLines, changedLines)
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.type === 'add') {
      added += 1
    } else if (line.type === 'remove') {
      removed += 1
    }
  }
  return { ok: true, lines, added, removed }
}

export function diffLines(original: string[], changed: string[]): DiffLine[] {
  const table = lcsLengths(original, changed)
  const lines: DiffLine[] = []
  let i = original.length
  let j = changed.length
  while (i > 0 && j > 0) {
    const originalLine = original[i - 1]!
    if (originalLine === changed[j - 1]) {
      lines.push({ type: 'same', text: originalLine })
      i -= 1
      j -= 1
    } else if (table[i - 1]![j]! > table[i]![j - 1]!) {
      lines.push({ type: 'remove', text: originalLine })
      i -= 1
    } else {
      lines.push({ type: 'add', text: changed[j - 1]! })
      j -= 1
    }
  }
  while (i > 0) {
    lines.push({ type: 'remove', text: original[i - 1]! })
    i -= 1
  }
  while (j > 0) {
    lines.push({ type: 'add', text: changed[j - 1]! })
    j -= 1
  }
  return lines.reverse()
}

export function renderUnifiedDiff(
  lines: readonly DiffLine[],
  originalLabel = 'original',
  changedLabel = 'changed',
): string {
  const header = `--- ${originalLabel}\n+++ ${changedLabel}`
  if (lines.length === 0) {
    return header
  }
  const body = lines.map((line) => `${DIFF_MARKERS[line.type]}${line.text}`).join('\n')
  return `${header}\n${body}`
}

function lcsLengths(a: string[], b: string[]): Uint32Array[] {
  const table: Uint32Array[] = [new Uint32Array(b.length + 1)]
  for (let i = 1; i <= a.length; i += 1) {
    const row = new Uint32Array(b.length + 1)
    const aLine = a[i - 1]!
    for (let j = 1; j <= b.length; j += 1) {
      if (aLine === b[j - 1]) {
        row[j] = table[i - 1]![j - 1]! + 1
      } else {
        row[j] = Math.max(row[j - 1]!, table[i - 1]![j]!)
      }
    }
    table.push(row)
  }
  return table
}
