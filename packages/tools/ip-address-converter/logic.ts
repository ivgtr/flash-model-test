export type AddressFamily = 'IPv4' | 'IPv6'

export type FamilySelection = 'auto' | AddressFamily

export const FAMILY_OPTIONS: readonly FamilySelection[] = ['auto', 'IPv4', 'IPv6']

export const DEFAULT_FAMILY: FamilySelection = 'auto'

export type IpAddressResult =
  | {
      ok: true
      output: {
        family: 'IPv4'
        dotted: string
        integer: string
        binary: string
        hex: string
      }
    }
  | {
      ok: true
      output: {
        family: 'IPv6'
        compressed: string
        expanded: string
      }
    }
  | { ok: false; error: string }

const MAX_IPV4 = 0xffffffffn

const GROUP_PATTERN = /^[0-9a-f]{1,4}$/i

const BARE_HEX_PATTERN = /^[0-9a-f]{1,8}$/i

const OCTET_PATTERN = /^[0-9]+$/

export function parseFamily(value: string): FamilySelection | null {
  if (value === 'auto' || value === 'IPv4' || value === 'IPv6') {
    return value
  }
  return null
}

function ipv4Output(value: bigint): IpAddressResult {
  const octets = [
    Number((value >> 24n) & 0xffn),
    Number((value >> 16n) & 0xffn),
    Number((value >> 8n) & 0xffn),
    Number(value & 0xffn),
  ]
  return {
    ok: true,
    output: {
      family: 'IPv4',
      dotted: octets.join('.'),
      integer: value.toString(),
      binary: value.toString(2).padStart(32, '0'),
      hex: value.toString(16).padStart(8, '0'),
    },
  }
}

function parseDottedOctets(
  input: string,
): { ok: true; octets: number[] } | { ok: false; error: string } {
  const parts = input.split('.')
  if (parts.length !== 4) {
    return { ok: false, error: 'Invalid IPv4: expected exactly 4 octets.' }
  }
  const octets: number[] = []
  for (const part of parts) {
    if (part === '') {
      return { ok: false, error: 'Invalid IPv4: expected exactly 4 octets.' }
    }
    if (!OCTET_PATTERN.test(part)) {
      return { ok: false, error: 'Invalid IPv4: octets must be decimal numbers.' }
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { ok: false, error: 'Invalid IPv4: octets must not have leading zeros.' }
    }
    const value = Number(part)
    if (value > 255) {
      return { ok: false, error: 'Invalid IPv4: octet is out of range (0-255).' }
    }
    octets.push(value)
  }
  return { ok: true, octets }
}

function convertIpv4(input: string): IpAddressResult {
  if (input.includes('.')) {
    const parsed = parseDottedOctets(input)
    if (!parsed.ok) {
      return parsed
    }
    let value = 0n
    for (const octet of parsed.octets) {
      value = value * 256n + BigInt(octet)
    }
    return ipv4Output(value)
  }

  const prefixedHex = /^0x([0-9a-f]+)$/i.exec(input)
  if (prefixedHex !== null) {
    const value = BigInt(`0x${prefixedHex[1]!.toLowerCase()}`)
    if (value > MAX_IPV4) {
      return {
        ok: false,
        error: 'Invalid IPv4: hex value is out of range (0x00000000-0xffffffff).',
      }
    }
    return ipv4Output(value)
  }

  if (OCTET_PATTERN.test(input)) {
    const value = BigInt(input)
    if (value > MAX_IPV4) {
      return { ok: false, error: 'Invalid IPv4: integer must be between 0 and 4294967295.' }
    }
    return ipv4Output(value)
  }

  if (BARE_HEX_PATTERN.test(input)) {
    return ipv4Output(BigInt(`0x${input.toLowerCase()}`))
  }

  return {
    ok: false,
    error:
      'Invalid IPv4: expected dotted (192.168.0.1), integer (0-4294967295), or hex (0x...) input.',
  }
}

function parseIpv6Groups(
  segments: readonly string[],
): { ok: true; groups: bigint[] } | { ok: false; error: string } {
  const groups: bigint[] = []
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!
    const isLast = index === segments.length - 1
    if (segment === '') {
      return { ok: false, error: 'Invalid IPv6: empty group.' }
    }
    if (segment.includes('.')) {
      if (!isLast) {
        return { ok: false, error: 'Invalid IPv6: embedded IPv4 must be the last part.' }
      }
      const parsed = parseDottedOctets(segment)
      if (!parsed.ok) {
        return parsed
      }
      groups.push(BigInt(parsed.octets[0]! * 256 + parsed.octets[1]!))
      groups.push(BigInt(parsed.octets[2]! * 256 + parsed.octets[3]!))
      continue
    }
    if (!GROUP_PATTERN.test(segment)) {
      return { ok: false, error: 'Invalid IPv6: group must be 1-4 hex digits.' }
    }
    groups.push(BigInt(`0x${segment}`))
  }
  return { ok: true, groups }
}

function convertIpv6(input: string): IpAddressResult {
  const colonColonCount = input.split('::').length - 1
  if (colonColonCount > 1) {
    return { ok: false, error: 'Invalid IPv6: "::" may appear at most once.' }
  }

  const split = input.split('::')
  const beforePart = split[0]!
  const afterPart = split[1]

  const beforeSegments = beforePart === '' ? [] : beforePart.split(':')
  const afterSegments = afterPart === undefined || afterPart === '' ? [] : afterPart.split(':')

  const before = parseIpv6Groups(beforeSegments)
  if (!before.ok) {
    return before
  }
  const after = parseIpv6Groups(afterSegments)
  if (!after.ok) {
    return after
  }

  const totalGroups = before.groups.length + after.groups.length
  if (totalGroups > 8) {
    return { ok: false, error: 'Invalid IPv6: too many groups.' }
  }
  if (colonColonCount === 1 && totalGroups === 8) {
    return { ok: false, error: 'Invalid IPv6: "::" must replace at least one group.' }
  }
  if (colonColonCount === 0 && totalGroups !== 8) {
    return { ok: false, error: 'Invalid IPv6: expected exactly 8 groups.' }
  }

  const missingGroups = 8 - totalGroups
  const groups = [...before.groups, ...new Array<bigint>(missingGroups).fill(0n), ...after.groups]
  return {
    ok: true,
    output: {
      family: 'IPv6',
      compressed: compressIpv6(groups),
      expanded: expandIpv6(groups),
    },
  }
}

export function expandIpv6(groups: readonly bigint[]): string {
  return groups.map((group) => group.toString(16).padStart(4, '0')).join(':')
}

export function compressIpv6(groups: readonly bigint[]): string {
  const hexGroups = groups.map((group) => group.toString(16))
  let bestStart = -1
  let bestLength = 0
  let runStart = -1
  for (let index = 0; index <= groups.length; index += 1) {
    if (index < groups.length && groups[index] === 0n) {
      if (runStart === -1) {
        runStart = index
      }
      continue
    }
    if (runStart !== -1) {
      const runLength = index - runStart
      if (runLength >= 2 && runLength > bestLength) {
        bestLength = runLength
        bestStart = runStart
      }
      runStart = -1
    }
  }
  if (bestStart === -1) {
    return hexGroups.join(':')
  }
  const before = hexGroups.slice(0, bestStart).join(':')
  const after = hexGroups.slice(bestStart + bestLength).join(':')
  return `${before}::${after}`
}

export function convertIpAddress(
  input: string,
  family: FamilySelection = DEFAULT_FAMILY,
): IpAddressResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const resolved: AddressFamily =
    family === 'auto' ? (trimmed.includes(':') ? 'IPv6' : 'IPv4') : family
  return resolved === 'IPv4' ? convertIpv4(trimmed) : convertIpv6(trimmed)
}
