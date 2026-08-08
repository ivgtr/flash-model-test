export type UrlResult = { ok: true; output: string } | { ok: false; error: string }

export function encodeUrl(input: string): string {
  return encodeURIComponent(input)
}

const PERCENT_SEQUENCE = /%[0-9A-Fa-f]{2}/g

function hasMalformedPercentEncoding(input: string): boolean {
  return input.replace(PERCENT_SEQUENCE, '').includes('%')
}

export function decodeUrl(input: string): UrlResult {
  if (input === '') {
    return { ok: true, output: '' }
  }
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
