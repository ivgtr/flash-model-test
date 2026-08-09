export type Delimiter = ',' | ';' | '\t'

export const DELIMITER_OPTIONS: readonly Delimiter[] = [',', ';', '\t']

export const DEFAULT_DELIMITER: Delimiter = ','

export type JsonToCsvResult = { ok: true; output: string } | { ok: false; error: string }

export function parseDelimiter(value: string): Delimiter | null {
  if (value === ',' || value === ';' || value === '\t') {
    return value
  }
  return null
}

function isScalar(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function needsQuoting(value: string, delimiter: Delimiter): boolean {
  return (
    value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')
  )
}

function escapeField(value: string, delimiter: Delimiter): string {
  if (!needsQuoting(value, delimiter)) {
    return value
  }
  return `"${value.replace(/"/g, '""')}"`
}

function parseJson(input: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(input) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Invalid JSON: ${message}` }
  }
}

export function jsonToCsv(
  input: string,
  delimiter: Delimiter = DEFAULT_DELIMITER,
): JsonToCsvResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const parsed = parseJson(input)
  if (!parsed.ok) {
    return parsed
  }
  if (!Array.isArray(parsed.data)) {
    return { ok: false, error: 'Invalid JSON: top-level value must be an array of objects.' }
  }
  if (parsed.data.length === 0) {
    return { ok: true, output: '' }
  }

  const objects: Record<string, unknown>[] = []
  const keys: string[] = []
  const seen = new Set<string>()

  for (let index = 0; index < parsed.data.length; index += 1) {
    const item = parsed.data[index]
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { ok: false, error: `Invalid JSON: item at index ${index} must be an object.` }
    }
    const object = item as Record<string, unknown>
    for (const key of Object.keys(object)) {
      if (!seen.has(key)) {
        seen.add(key)
        keys.push(key)
      }
    }
    for (const key of Object.keys(object)) {
      if (!isScalar(object[key])) {
        return {
          ok: false,
          error: `Invalid JSON: value of key "${key}" in item ${index} must be a string, number, boolean, or null.`,
        }
      }
    }
    objects.push(object)
  }

  const rows: string[] = [keys.map((key) => escapeField(key, delimiter)).join(delimiter)]
  for (const object of objects) {
    const fields = keys.map((key) => {
      const value = object[key]
      if (value === undefined || value === null) {
        return ''
      }
      return escapeField(String(value), delimiter)
    })
    rows.push(fields.join(delimiter))
  }
  return { ok: true, output: rows.join('\n') }
}
