import { describe, expect, it } from 'vitest'
import {
  MAX_DIFF_LINES,
  computeLineDiff,
  diffLines,
  normalizeNewlines,
  renderUnifiedDiff,
  splitLines,
  type DiffLine,
} from './logic'

function typesOf(lines: DiffLine[]): string[] {
  return lines.map((line) => line.type)
}

describe('splitLines', () => {
  it('splits text into lines without a trailing empty entry', () => {
    expect(splitLines('a\nb')).toEqual(['a', 'b'])
    expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    expect(splitLines('')).toEqual([])
  })

  it('normalizes CRLF and CR line endings before splitting', () => {
    expect(splitLines('a\r\nb\r\n')).toEqual(['a', 'b'])
    expect(splitLines('a\rb')).toEqual(['a', 'b'])
  })

  it('keeps empty lines in the middle of the text', () => {
    expect(splitLines('a\n\nb')).toEqual(['a', '', 'b'])
    expect(splitLines('\n')).toEqual([''])
  })
})

describe('normalizeNewlines', () => {
  it('converts CRLF and lone CR to LF', () => {
    expect(normalizeNewlines('a\r\nb\rc')).toBe('a\nb\nc')
    expect(normalizeNewlines('a\nb')).toBe('a\nb')
  })
})

describe('computeLineDiff', () => {
  it('returns no differences for identical text', () => {
    const result = computeLineDiff('a\nb\nc', 'a\nb\nc')
    expect(result).toEqual({
      ok: true,
      lines: [
        { type: 'same', text: 'a' },
        { type: 'same', text: 'b' },
        { type: 'same', text: 'c' },
      ],
      added: 0,
      removed: 0,
    })
  })

  it('returns no differences for identical text with a trailing newline difference', () => {
    const result = computeLineDiff('a\nb\n', 'a\nb')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.added).toBe(0)
      expect(result.removed).toBe(0)
      expect(typesOf(result.lines)).toEqual(['same', 'same'])
    }
  })

  it('treats an extra trailing empty line as a difference', () => {
    const result = computeLineDiff('a\nb\n', 'a\nb\n\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.removed).toBe(0)
      expect(result.added).toBe(1)
      expect(result.lines[result.lines.length - 1]).toEqual({ type: 'add', text: '' })
    }
  })

  it('detects a single added line', () => {
    const result = computeLineDiff('a\nb', 'a\nx\nb')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'same', text: 'a' },
        { type: 'add', text: 'x' },
        { type: 'same', text: 'b' },
      ])
      expect(result.added).toBe(1)
      expect(result.removed).toBe(0)
    }
  })

  it('detects a single removed line', () => {
    const result = computeLineDiff('a\nx\nb', 'a\nb')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'same', text: 'a' },
        { type: 'remove', text: 'x' },
        { type: 'same', text: 'b' },
      ])
      expect(result.added).toBe(0)
      expect(result.removed).toBe(1)
    }
  })

  it('treats a replaced line as a removal followed by an addition', () => {
    const result = computeLineDiff('a\nb', 'a\nc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'same', text: 'a' },
        { type: 'remove', text: 'b' },
        { type: 'add', text: 'c' },
      ])
      expect(result.added).toBe(1)
      expect(result.removed).toBe(1)
    }
  })

  it('treats a one-character in-line difference as a line replacement', () => {
    const result = computeLineDiff('hello', 'hellx')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(typesOf(result.lines)).toEqual(['remove', 'add'])
      expect(result.lines[0]).toEqual({ type: 'remove', text: 'hello' })
      expect(result.lines[1]).toEqual({ type: 'add', text: 'hellx' })
    }
  })

  it('detects differences across multiple blocks', () => {
    const result = computeLineDiff('a\nb\nc\nd\ne', 'a\nB\nc\nD\ne')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'same', text: 'a' },
        { type: 'remove', text: 'b' },
        { type: 'add', text: 'B' },
        { type: 'same', text: 'c' },
        { type: 'remove', text: 'd' },
        { type: 'add', text: 'D' },
        { type: 'same', text: 'e' },
      ])
      expect(result.added).toBe(2)
      expect(result.removed).toBe(2)
    }
  })

  it('treats an empty original as all additions', () => {
    const result = computeLineDiff('', 'a\nb')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'add', text: 'a' },
        { type: 'add', text: 'b' },
      ])
      expect(result.added).toBe(2)
      expect(result.removed).toBe(0)
    }
  })

  it('treats an empty changed text as all removals', () => {
    const result = computeLineDiff('a\nb', '')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.lines).toEqual([
        { type: 'remove', text: 'a' },
        { type: 'remove', text: 'b' },
      ])
      expect(result.added).toBe(0)
      expect(result.removed).toBe(2)
    }
  })

  it('handles two empty texts without differences', () => {
    const result = computeLineDiff('', '')
    expect(result).toEqual({ ok: true, lines: [], added: 0, removed: 0 })
  })

  it('normalizes CRLF differences between the two texts', () => {
    const result = computeLineDiff('a\r\nb\r\n', 'a\nb')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(typesOf(result.lines)).toEqual(['same', 'same'])
      expect(result.added).toBe(0)
      expect(result.removed).toBe(0)
    }
  })

  it('reports an error when a text exceeds the line limit', () => {
    const tooMany = Array.from({ length: MAX_DIFF_LINES + 1 }, (_, index) => `line ${index}`).join(
      '\n',
    )
    const result = computeLineDiff(tooMany, 'a')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('too large')
      expect(result.error).toContain(String(MAX_DIFF_LINES))
    }
  })

  it('accepts texts at the line limit', () => {
    const atLimit = Array.from({ length: MAX_DIFF_LINES }, (_, index) => `line ${index}`).join('\n')
    const result = computeLineDiff(atLimit, atLimit)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.added).toBe(0)
      expect(result.removed).toBe(0)
    }
  })

  it('summarizes added and removed counts', () => {
    const result = computeLineDiff('a\nb\nc\nd', 'a\nx\nc\ny\nz')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.added).toBe(3)
      expect(result.removed).toBe(2)
    }
  })
})

describe('diffLines', () => {
  it('keeps shared lines in order around changed blocks', () => {
    const lines = diffLines(['one', 'two', 'three'], ['one', 'THREE', 'four'])
    expect(typesOf(lines)).toEqual(['same', 'remove', 'remove', 'add', 'add'])
    expect(lines[0]).toEqual({ type: 'same', text: 'one' })
    expect(lines[1]).toEqual({ type: 'remove', text: 'two' })
    expect(lines[2]).toEqual({ type: 'remove', text: 'three' })
    expect(lines[3]).toEqual({ type: 'add', text: 'THREE' })
    expect(lines[4]).toEqual({ type: 'add', text: 'four' })
  })

  it('produces a valid diff for duplicated lines', () => {
    const lines = diffLines(['a', 'a', 'b'], ['a', 'b', 'b'])
    const added = lines.filter((line) => line.type === 'add').length
    const removed = lines.filter((line) => line.type === 'remove').length
    const same = lines.filter((line) => line.type === 'same').map((line) => line.text)
    expect(added).toBe(1)
    expect(removed).toBe(1)
    expect(same).toEqual(['a', 'b'])
  })
})

describe('renderUnifiedDiff', () => {
  it('renders unified-diff headers with --- and +++', () => {
    const output = renderUnifiedDiff([{ type: 'add', text: 'x' }])
    expect(output).toContain('--- original')
    expect(output).toContain('+++ changed')
    expect(output.startsWith('--- original\n+++ changed\n')).toBe(true)
  })

  it('prefixes lines with +, -, and space markers', () => {
    const lines: DiffLine[] = [
      { type: 'same', text: 'a' },
      { type: 'add', text: 'x' },
      { type: 'remove', text: 'b' },
    ]
    expect(renderUnifiedDiff(lines)).toBe('--- original\n+++ changed\n a\n+x\n-b')
  })

  it('renders only the headers for an empty diff', () => {
    expect(renderUnifiedDiff([])).toBe('--- original\n+++ changed')
  })

  it('supports custom labels', () => {
    const output = renderUnifiedDiff([{ type: 'same', text: 'a' }], 'before.txt', 'after.txt')
    expect(output.startsWith('--- before.txt\n+++ after.txt\n a')).toBe(true)
  })

  it('renders a full unified diff for a small change', () => {
    const result = computeLineDiff('a\nb\nc', 'a\nB\nc')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(renderUnifiedDiff(result.lines)).toBe('--- original\n+++ changed\n a\n-b\n+B\n c')
    }
  })
})
