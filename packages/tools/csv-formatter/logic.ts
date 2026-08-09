export type Delimiter = ',' | ';' | '\t'

export const DELIMITER_OPTIONS: readonly Delimiter[] = [',', ';', '\t']

export const DEFAULT_DELIMITER: Delimiter = ','

export type QuoteStyle = 'only-when-needed' | 'always'

export const QUOTE_STYLE_OPTIONS: readonly QuoteStyle[] = ['only-when-needed', 'always']

export const DEFAULT_QUOTE_STYLE: QuoteStyle = 'only-when-needed'

export const DEFAULT_TRIM = false

export const DEFAULT_REMOVE_BLANK_LINES = false

export interface CsvFormatterOptions {
  delimiter?: Delimiter
  quoteStyle?: QuoteStyle
  trim?: boolean
  removeBlankLines?: boolean
}

export type FormatResult = { ok: true; output: string } | { ok: false; error: string }

type ParsedCsv = { ok: true; rows: string[][] } | { ok: false; error: string }

export function parseDelimiter(value: string): Delimiter | null {
  if (value === ',' || value === ';' || value === '\t') {
    return value
  }
  return null
}

export function parseQuoteStyle(value: string): QuoteStyle | null {
  if (value === 'only-when-needed' || value === 'always') {
    return value
  }
  return null
}

function parseCsv(input: string, delimiter: Delimiter): ParsedCsv {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let afterClosingQuote = false
  let index = 0
  const length = input.length

  const endField = (): void => {
    row.push(field)
    field = ''
  }

  const endRow = (): void => {
    endField()
    rows.push(row)
    row = []
  }

  const charAt = (position: number): string => input.charAt(position)

  const consumeNewline = (): number => {
    if (charAt(index) === '\r' && charAt(index + 1) === '\n') {
      return index + 2
    }
    return index + 1
  }

  while (index < length) {
    const char = charAt(index)

    if (inQuotes) {
      if (char === '"') {
        if (charAt(index + 1) === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        afterClosingQuote = true
        index += 1
        continue
      }
      if (char === '\r' && charAt(index + 1) === '\n') {
        field += '\n'
        index += 2
        continue
      }
      field += char
      index += 1
      continue
    }

    if (afterClosingQuote) {
      if (char === delimiter) {
        endField()
        afterClosingQuote = false
        index += 1
        continue
      }
      if (char === '\r' || char === '\n') {
        endRow()
        afterClosingQuote = false
        index = consumeNewline()
        continue
      }
      return { ok: false, error: 'Invalid CSV: unexpected character after closing quote.' }
    }

    if (char === '"') {
      if (field !== '') {
        return { ok: false, error: 'Invalid CSV: unexpected quote inside a field.' }
      }
      inQuotes = true
      index += 1
      continue
    }

    if (char === delimiter) {
      endField()
      index += 1
      continue
    }

    if (char === '\r' || char === '\n') {
      endRow()
      index = consumeNewline()
      continue
    }

    field += char
    index += 1
  }

  if (inQuotes) {
    return { ok: false, error: 'Invalid CSV: unterminated quoted field.' }
  }
  if (afterClosingQuote || field !== '' || row.length > 0) {
    endRow()
  }
  return { ok: true, rows }
}

function isBlankRow(row: string[]): boolean {
  return row.length === 1 && row[0]!.trim() === ''
}

function needsQuotes(value: string, delimiter: Delimiter): boolean {
  return (
    value.includes(delimiter) || value.includes('"') || value.includes('\r') || value.includes('\n')
  )
}

function serializeField(value: string, quoteStyle: QuoteStyle, delimiter: Delimiter): string {
  if (quoteStyle === 'always') {
    return `"${value.replace(/"/g, '""')}"`
  }
  if (needsQuotes(value, delimiter)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function formatCsv(input: string, options: CsvFormatterOptions = {}): FormatResult {
  const delimiter = options.delimiter ?? DEFAULT_DELIMITER
  const quoteStyle = options.quoteStyle ?? DEFAULT_QUOTE_STYLE
  const trim = options.trim ?? DEFAULT_TRIM
  const removeBlankLines = options.removeBlankLines ?? DEFAULT_REMOVE_BLANK_LINES

  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }

  const parsed = parseCsv(input, delimiter)
  if (!parsed.ok) {
    return parsed
  }

  const rows = parsed.rows
    .map((row) => (trim ? row.map((value) => value.trim()) : row))
    .filter((row) => !removeBlankLines || !isBlankRow(row))

  if (rows.length === 0) {
    return { ok: false, error: 'Input is empty.' }
  }

  const output = rows
    .map((row) => row.map((value) => serializeField(value, quoteStyle, delimiter)).join(delimiter))
    .join('\n')

  return { ok: true, output }
}
