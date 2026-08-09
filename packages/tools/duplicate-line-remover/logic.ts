export interface DuplicateLineOptions {
  ignoreCase: boolean
  trim: boolean
  removeBlankLines: boolean
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

function comparisonKey(line: string, options: DuplicateLineOptions): string {
  let key = options.trim ? line.trim() : line
  if (options.ignoreCase) {
    key = key.toLowerCase()
  }
  return key
}

export function removeDuplicateLines(input: string, options: DuplicateLineOptions): string {
  const newline = detectNewline(input)
  const lines = input.split(/\r\n|\r|\n/)
  const seen = new Set<string>()
  const output: string[] = []

  for (const line of lines) {
    if (options.removeBlankLines && line.trim() === '') {
      continue
    }
    const key = comparisonKey(line, options)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(line)
  }

  return output.join(newline)
}
