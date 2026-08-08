export type Base64Result = { ok: true; output: string } | { ok: false; error: string }

const encoder = new TextEncoder()

export function encodeToBase64(input: string): string {
  const bytes = encoder.encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

export function decodeFromBase64(input: string): Base64Result {
  if (input === '') {
    return { ok: true, output: '' }
  }
  if (input.length % 4 !== 0) {
    return { ok: false, error: 'Invalid Base64: length must be a multiple of 4.' }
  }
  if (!BASE64_PATTERN.test(input)) {
    return { ok: false, error: 'Invalid Base64: contains invalid characters or padding.' }
  }
  const paddingIndex = input.indexOf('=')
  if (paddingIndex !== -1 && paddingIndex < input.length - 2) {
    return { ok: false, error: 'Invalid Base64: padding must appear only at the end.' }
  }

  let binary: string
  try {
    binary = atob(input)
  } catch {
    return { ok: false, error: 'Invalid Base64: could not decode.' }
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    return { ok: true, output: decoder.decode(bytes) }
  } catch {
    return { ok: false, error: 'Invalid Base64: decoded bytes are not valid UTF-8.' }
  }
}
