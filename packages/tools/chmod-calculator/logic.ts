export type PermissionClass = 'user' | 'group' | 'other'

export type ParseModeResult =
  { ok: true; special: number; permission: number } | { ok: false; error: string }

export type ConvertModeResult =
  | {
      ok: true
      octal: string
      symbolic: string
      binary: string
      classes: Record<PermissionClass, string>
    }
  | { ok: false; error: string }

const SETUID = 4
const SETGID = 2
const STICKY = 1

const READ_BIT = 4
const WRITE_BIT = 2
const EXECUTE_BIT = 1

export function parseMode(input: string): ParseModeResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  if (/^\d+$/.test(trimmed)) {
    return parseOctal(trimmed)
  }
  return parseSymbolic(trimmed)
}

function parseOctal(digits: string): ParseModeResult {
  if (/[89]/.test(digits)) {
    return { ok: false, error: 'Invalid octal mode: digits 8 and 9 are not allowed.' }
  }
  if (digits.length !== 3 && digits.length !== 4) {
    return { ok: false, error: 'Invalid octal mode: expected 3 or 4 digits.' }
  }
  const special = digits.length === 4 ? Number(digits[0]) : 0
  const permission = parseInt(digits.slice(-3), 8)
  return { ok: true, special, permission }
}

function parseSymbolic(symbols: string): ParseModeResult {
  if (symbols.length !== 9) {
    return { ok: false, error: 'Invalid symbolic mode: expected exactly 9 characters.' }
  }

  const groups: readonly { start: number; special: number }[] = [
    { start: 0, special: SETUID },
    { start: 3, special: SETGID },
    { start: 6, special: STICKY },
  ]

  let special = 0
  let permission = 0

  for (const group of groups) {
    let classBits = 0
    for (let offset = 0; offset < 3; offset += 1) {
      const char = symbols[group.start + offset]!
      if (offset === 0) {
        if (char === 'r') {
          classBits |= READ_BIT
        } else if (char !== '-') {
          return {
            ok: false,
            error: `Invalid symbolic mode: "${char}" is only allowed at an execute position.`,
          }
        }
      } else if (offset === 1) {
        if (char === 'w') {
          classBits |= WRITE_BIT
        } else if (char !== '-') {
          return {
            ok: false,
            error: `Invalid symbolic mode: "${char}" is only allowed at an execute position.`,
          }
        }
      } else {
        if (char === 'x') {
          classBits |= EXECUTE_BIT
        } else if (char === 's' || char === 'S') {
          if (group.special === STICKY) {
            return {
              ok: false,
              error: 'Invalid symbolic mode: "s" is only allowed at the user or group class.',
            }
          }
          special |= group.special
          if (char === 's') {
            classBits |= EXECUTE_BIT
          }
        } else if (char === 't' || char === 'T') {
          if (group.special !== STICKY) {
            return {
              ok: false,
              error: 'Invalid symbolic mode: "t" is only allowed at the other class.',
            }
          }
          special |= STICKY
          if (char === 't') {
            classBits |= EXECUTE_BIT
          }
        } else if (char !== '-') {
          return { ok: false, error: `Invalid symbolic mode: character "${char}" is not allowed.` }
        }
      }
    }
    permission = permission * 8 + classBits
  }

  return { ok: true, special, permission }
}

export function convertMode(input: string): ConvertModeResult {
  const parsed = parseMode(input)
  if (!parsed.ok) {
    return parsed
  }
  const { special, permission } = parsed
  return {
    ok: true,
    octal: formatOctal(special, permission),
    symbolic: formatSymbolic(special, permission),
    binary: formatBinary(special, permission),
    classes: formatClasses(special, permission),
  }
}

function formatOctal(special: number, permission: number): string {
  return `${special}${permission.toString(8).padStart(3, '0')}`
}

function formatBinary(special: number, permission: number): string {
  return ((special << 9) | permission).toString(2).padStart(12, '0')
}

function executeChar(hasExecute: boolean, specialBit: number | null): string {
  if (specialBit === STICKY) {
    if (hasExecute) {
      return 't'
    }
    return 'T'
  }
  if (specialBit === SETUID || specialBit === SETGID) {
    if (hasExecute) {
      return 's'
    }
    return 'S'
  }
  return hasExecute ? 'x' : '-'
}

function formatClass(special: number, permission: number, specialBit: number): string {
  const hasRead = (permission & READ_BIT) !== 0
  const hasWrite = (permission & WRITE_BIT) !== 0
  const hasExecute = (permission & EXECUTE_BIT) !== 0
  const hasSpecial = (special & specialBit) !== 0
  return (
    (hasRead ? 'r' : '-') +
    (hasWrite ? 'w' : '-') +
    executeChar(hasExecute, hasSpecial ? specialBit : null)
  )
}

function formatSymbolic(special: number, permission: number): string {
  const user = formatClass(special, (permission >> 6) & 7, SETUID)
  const group = formatClass(special, (permission >> 3) & 7, SETGID)
  const other = formatClass(special, permission & 7, STICKY)
  return user + group + other
}

function formatClasses(special: number, permission: number): Record<PermissionClass, string> {
  return {
    user: formatClass(special, (permission >> 6) & 7, SETUID),
    group: formatClass(special, (permission >> 3) & 7, SETGID),
    other: formatClass(special, permission & 7, STICKY),
  }
}
