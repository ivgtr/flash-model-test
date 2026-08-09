export interface WhitespaceNormalizerOptions {
  trim: boolean
  collapseSpaces: boolean
  stripTrailing: boolean
  unifyLineEndings: boolean
  removeBlankLines: boolean
}

const LINE_SEPARATOR_PATTERN = /(\r\n|\r|\n)/

const LEADING_WHITESPACE_PATTERN = /^[ \t\v\f]+/
const TRAILING_WHITESPACE_PATTERN = /[ \t\v\f]+$/
const SPACE_OR_TAB_RUN_PATTERN = /[ \t]+/g
const ASCII_WHITESPACE_PATTERN = /[ \t\v\f]/g

function isBlankLine(line: string): boolean {
  return line.replace(ASCII_WHITESPACE_PATTERN, '') === ''
}

export function normalizeWhitespace(input: string, options: WhitespaceNormalizerOptions): string {
  const parts = input.split(LINE_SEPARATOR_PATTERN)
  const lineCount = Math.ceil(parts.length / 2)
  const output: string[] = []
  for (let index = 0; index < lineCount; index += 1) {
    let line = parts[index * 2]!
    if (options.trim) {
      line = line.replace(LEADING_WHITESPACE_PATTERN, '').replace(TRAILING_WHITESPACE_PATTERN, '')
    }
    if (options.collapseSpaces) {
      line = line.replace(SPACE_OR_TAB_RUN_PATTERN, ' ')
    }
    if (options.stripTrailing) {
      line = line.replace(TRAILING_WHITESPACE_PATTERN, '')
    }
    const separator = parts[index * 2 + 1]
    if (options.removeBlankLines && isBlankLine(line)) {
      continue
    }
    output.push(line)
    if (separator !== undefined) {
      output.push(options.unifyLineEndings ? '\n' : separator)
    }
  }
  return output.join('')
}
