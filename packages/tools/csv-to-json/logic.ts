export type Delimiter = ',' | ';' | '\t'

export const DELIMITER_OPTIONS: readonly Delimiter[] = [',', ';', '\t']

export const DEFAULT_DELIMITER: Delimiter = ','

export type CsvToJsonResult = { ok: true; output: string } | { ok: false; error: string }

type ParsedCsv = { ok: true; rows: string[][] } | { ok: false; error: string }

export function parseDelimiter(value: string): Delimiter | null {
  if (value === ',' || value === ';' || value === '\t') {
    return value
  }
  return null
}

function isBlankRow(row: string[]): boolean {
  return row.length === 1 && row[0]!.trim() === ''
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

export function convertCsv(
  input: string,
  delimiter: Delimiter = DEFAULT_DELIMITER,
): CsvToJsonResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const parsed = parseCsv(input, delimiter)
  if (!parsed.ok) {
    return parsed
  }
  const dataRows = parsed.rows.filter((row) => !isBlankRow(row))
  if (dataRows.length === 0) {
    return { ok: false, error: 'Input is empty.' }
  }
  const headers = dataRows[0]!
  const seenHeaders = new Set<string>()
  for (const header of headers) {
    if (seenHeaders.has(header)) {
      return { ok: false, error: `Invalid CSV: duplicate header "${header}".` }
    }
    seenHeaders.add(header)
  }
  const objects: Record<string, string>[] = []
  for (let rowIndex = 1; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex]!
    if (row.length !== headers.length) {
      return {
        ok: false,
        error: `Invalid CSV: row ${rowIndex} has ${row.length} column(s), expected ${headers.length}.`,
      }
    }
    const object: Record<string, string> = {}
    headers.forEach((header, columnIndex) => {
      object[header] = row[columnIndex]!
    })
    objects.push(object)
  }
  return { ok: true, output: JSON.stringify(objects, null, 2) }
}
