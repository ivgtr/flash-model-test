export const MIN_COUNT = 1
export const MAX_COUNT = 100

export type UuidCase = 'lower' | 'upper'

export const DEFAULT_CASE: UuidCase = 'lower'

export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export type UuidGenerateResult = { ok: true; uuids: string[] } | { ok: false; error: string }

export function parseCount(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '' || !/^\d+$/.test(trimmed)) {
    return null
  }
  const parsed = Number(trimmed)
  if (parsed < MIN_COUNT || parsed > MAX_COUNT) {
    return null
  }
  return parsed
}

export function generateUuids(
  count: number,
  uuidCase: UuidCase = DEFAULT_CASE,
): UuidGenerateResult {
  if (!Number.isInteger(count) || count < MIN_COUNT || count > MAX_COUNT) {
    return {
      ok: false,
      error: `Count must be an integer between ${MIN_COUNT} and ${MAX_COUNT}.`,
    }
  }
  const uuids = Array.from({ length: count }, () => {
    const uuid = crypto.randomUUID()
    return uuidCase === 'upper' ? uuid.toUpperCase() : uuid.toLowerCase()
  })
  return { ok: true, uuids }
}

export function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value)
}
