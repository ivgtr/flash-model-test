export type QueryPair = [key: string, value: string]

export type QueryParseResult = { ok: true; output: QueryPair[] } | { ok: false; error: string }

export type QuerySerializeResult = { ok: true; output: string } | { ok: false; error: string }

const PERCENT_SEQUENCE = /%[0-9A-Fa-f]{2}/g

function hasMalformedPercentEncoding(input: string): boolean {
  return input.replace(PERCENT_SEQUENCE, '').includes('%')
}

type DecodeResult = { ok: true; output: string } | { ok: false; error: string }

function decodeComponent(input: string): DecodeResult {
  if (hasMalformedPercentEncoding(input)) {
    return {
      ok: false,
      error: 'Invalid percent-encoding: every % must be followed by two hex digits.',
    }
  }
  try {
    return { ok: true, output: decodeURIComponent(input) }
  } catch {
    return { ok: false, error: 'Invalid percent-encoding: could not decode.' }
  }
}

export function parseQueryString(input: string): QueryParseResult {
  if (input === '') {
    return { ok: true, output: [] }
  }
  const body = input.startsWith('?') ? input.slice(1) : input
  if (body === '') {
    return { ok: true, output: [] }
  }
  const pairs: QueryPair[] = []
  for (const segment of body.split('&')) {
    const eqIndex = segment.indexOf('=')
    const rawKey = eqIndex === -1 ? segment : segment.slice(0, eqIndex)
    const rawValue = eqIndex === -1 ? '' : segment.slice(eqIndex + 1)
    const key = decodeComponent(rawKey)
    if (!key.ok) {
      return key
    }
    const value = decodeComponent(rawValue)
    if (!value.ok) {
      return value
    }
    pairs.push([key.output, value.output])
  }
  return { ok: true, output: pairs }
}

export function serializeQueryString(pairs: QueryPair[]): QuerySerializeResult {
  try {
    const output = pairs
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    return { ok: true, output }
  } catch {
    return { ok: false, error: 'Could not serialize: contains unencodable characters.' }
  }
}
