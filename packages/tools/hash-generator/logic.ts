export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

export const DEFAULT_ALGORITHM: HashAlgorithm = 'SHA-256'

export const HEX_DIGIT_LENGTHS: Record<HashAlgorithm, number> = {
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-384': 96,
  'SHA-512': 128,
}

export function isHashAlgorithm(value: string): value is HashAlgorithm {
  return (HASH_ALGORITHMS as readonly string[]).includes(value)
}

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function computeHash(
  input: string,
  algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest(algorithm, data)
  return toHex(digest)
}
