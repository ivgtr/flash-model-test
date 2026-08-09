export type ReverseMode = 'chars' | 'lines' | 'words'

export const MODE_OPTIONS: readonly ReverseMode[] = ['chars', 'lines', 'words']

export const DEFAULT_MODE: ReverseMode = 'chars'

export function parseMode(value: string): ReverseMode | null {
  if (value === 'chars' || value === 'lines' || value === 'words') {
    return value
  }
  return null
}

function splitLines(input: string): string[] {
  return input.split('\n').map((line) => line.replace(/\r$/, ''))
}

function reverseWords(line: string): string {
  return line
    .split(/\s+/)
    .filter((word) => word !== '')
    .reverse()
    .join(' ')
}

export function reverseText(input: string, mode: ReverseMode = DEFAULT_MODE): string {
  if (mode === 'chars') {
    return Array.from(input).reverse().join('')
  }
  const lines = splitLines(input)
  if (mode === 'lines') {
    return lines.reverse().join('\n')
  }
  return lines.map(reverseWords).join('\n')
}
