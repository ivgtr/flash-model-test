export type JsonToQueryStringResult = { ok: true; output: string } | { ok: false; error: string }

type JsonPrimitive = string | number | boolean | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

export function jsonToQueryString(
  input: string,
  withLeadingQuestionMark = false,
): JsonToQueryStringResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'could not parse'
    return { ok: false, error: `Invalid JSON: ${detail}` }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'Invalid JSON: root value must be an object.' }
  }

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(parsed)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (!isPrimitive(item)) {
          return {
            ok: false,
            error: `Invalid JSON: key "${key}" must contain only primitive values.`,
          }
        }
        if (item !== null) {
          params.append(key, String(item))
        }
      }
      continue
    }

    if (isRecord(value)) {
      return { ok: false, error: `Invalid JSON: nested objects are not supported at key "${key}".` }
    }

    params.append(key, String(value))
  }

  const body = params.toString()
  const output = withLeadingQuestionMark && body !== '' ? `?${body}` : body
  return { ok: true, output }
}
