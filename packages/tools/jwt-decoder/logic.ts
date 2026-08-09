export type JwtDecodeResult = { ok: true; output: string } | { ok: false; error: string }

const DATE_CLAIM_NAMES = ['exp', 'nbf', 'iat'] as const
type DateClaimName = (typeof DATE_CLAIM_NAMES)[number]

export type DateClaim = {
  name: DateClaimName
  value: number
  iso: string
  readable: string
}

const encoder = new TextEncoder()

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/

export function encodeBase64Url(input: string): string {
  const bytes = encoder.encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

type SegmentCheck = { ok: true; value: string } | { ok: false; error: string }

function validateSegment(input: string, partName: string): SegmentCheck {
  if (!BASE64URL_PATTERN.test(input)) {
    return {
      ok: false,
      error: `Invalid Base64URL in ${partName}: only URL-safe characters (A-Z, a-z, 0-9, -, _) are allowed.`,
    }
  }
  if (input.length % 4 === 1) {
    return { ok: false, error: `Invalid Base64URL in ${partName}: invalid length.` }
  }
  return { ok: true, value: input }
}

function padBase64Url(input: string): string {
  const padding = (4 - (input.length % 4)) % 4
  return input + '='.repeat(padding)
}

type JsonSegment = { ok: true; json: string } | { ok: false; error: string }

function decodeJsonSegment(input: string, partName: 'header' | 'payload'): JsonSegment {
  const check = validateSegment(input, partName)
  if (!check.ok) {
    return check
  }
  let binary: string
  try {
    const standard = check.value.replace(/-/g, '+').replace(/_/g, '/')
    binary = atob(padBase64Url(standard))
  } catch {
    return { ok: false, error: `Invalid Base64URL in ${partName}: could not decode.` }
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return { ok: false, error: `Invalid JWT: ${partName} is not valid JSON.` }
  }
  try {
    JSON.parse(text)
  } catch {
    return { ok: false, error: `Invalid JWT: ${partName} is not valid JSON.` }
  }
  return { ok: true, json: text }
}

export function collectDateClaims(payloadJson: string): DateClaim[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(payloadJson)
  } catch {
    return []
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return []
  }
  const claims: DateClaim[] = []
  for (const name of DATE_CLAIM_NAMES) {
    const raw = (parsed as Record<string, unknown>)[name]
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      continue
    }
    const date = new Date(raw * 1000)
    if (Number.isNaN(date.getTime())) {
      continue
    }
    claims.push({ name, value: raw, iso: date.toISOString(), readable: date.toUTCString() })
  }
  return claims
}

function formatJwtOutput(
  headerJson: string,
  payloadJson: string,
  signature: string,
  dateClaims: DateClaim[],
): string {
  const pretty = (text: string): string => JSON.stringify(JSON.parse(text), null, 2)
  const lines = ['Header', pretty(headerJson), '', 'Payload', pretty(payloadJson)]
  if (dateClaims.length > 0) {
    lines.push('', 'Date claims')
    for (const claim of dateClaims) {
      lines.push(
        `${claim.name}: ${claim.value} -> ISO 8601: ${claim.iso} | Readable: ${claim.readable}`,
      )
    }
  }
  lines.push('', 'Signature', signature)
  return lines.join('\n')
}

export function decodeJwt(input: string): JwtDecodeResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const parts = input.split('.')
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `Invalid JWT: expected 3 parts separated by '.', found ${parts.length}.`,
    }
  }
  const header = decodeJsonSegment(parts[0]!, 'header')
  if (!header.ok) {
    return header
  }
  const payload = decodeJsonSegment(parts[1]!, 'payload')
  if (!payload.ok) {
    return payload
  }
  const signature = validateSegment(parts[2]!, 'signature')
  if (!signature.ok) {
    return signature
  }
  const dateClaims = collectDateClaims(payload.json)
  return {
    ok: true,
    output: formatJwtOutput(header.json, payload.json, signature.value, dateClaims),
  }
}
