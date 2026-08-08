export const INDENT_OPTIONS = [0, 2, 4] as const

export type IndentOption = (typeof INDENT_OPTIONS)[number]

export const DEFAULT_INDENT: IndentOption = 2

export type JsonFormatResult = { ok: true; output: string } | { ok: false; error: string }

export function formatJson(input: string, indent: IndentOption = DEFAULT_INDENT): JsonFormatResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  try {
    const value: unknown = JSON.parse(input)
    return { ok: true, output: JSON.stringify(value, null, indent) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error'
    return { ok: false, error: `Invalid JSON: ${message}` }
  }
}

export function parseIndent(value: string): IndentOption | null {
  if (value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  if (parsed === 0 || parsed === 2 || parsed === 4) {
    return parsed
  }
  return null
}
