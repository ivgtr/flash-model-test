export type Identifier =
  { kind: 'numeric'; value: number; text: string } | { kind: 'alphanumeric'; value: string }

export interface SemVer {
  major: number
  minor: number
  patch: number
  prerelease: readonly Identifier[]
  build: readonly string[]
}

export type ParseResult = { ok: true; semver: SemVer } | { ok: false; error: string }

export type CompareResult = { ok: true; comparison: -1 | 0 | 1 } | { ok: false; error: string }

export type SortDirection = 'asc' | 'desc'

export type SortResult = { ok: true; lines: readonly string[] } | { ok: false; error: string }

export type ComparatorOperator = '>' | '>=' | '<' | '<=' | '='

export type RangeResult = { ok: true; satisfies: boolean } | { ok: false; error: string }

const VERSION_PATTERN =
  /^v?([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

const NUMERIC_IDENTIFIER = /^[0-9]+$/

function hasLeadingZero(value: string): boolean {
  return value.length > 1 && value.startsWith('0')
}

function parsePrerelease(raw: string | undefined): readonly Identifier[] | null {
  if (raw === undefined) {
    return []
  }
  const identifiers: Identifier[] = []
  for (const part of raw.split('.')) {
    if (NUMERIC_IDENTIFIER.test(part)) {
      if (hasLeadingZero(part)) {
        return null
      }
      identifiers.push({ kind: 'numeric', value: Number(part), text: part })
    } else {
      identifiers.push({ kind: 'alphanumeric', value: part })
    }
  }
  return identifiers
}

function parseBuild(raw: string | undefined): readonly string[] {
  return raw === undefined ? [] : raw.split('.')
}

export function parseSemver(version: string): ParseResult {
  if (version.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  if (version !== version.trim()) {
    return { ok: false, error: `Invalid SemVer: "${version}" is not a valid version.` }
  }
  const match = VERSION_PATTERN.exec(version)
  if (match === null) {
    return { ok: false, error: `Invalid SemVer: "${version}" is not a valid version.` }
  }
  const majorText = match[1]!
  const minorText = match[2]!
  const patchText = match[3]!
  for (const [name, text] of [
    ['major', majorText],
    ['minor', minorText],
    ['patch', patchText],
  ] as const) {
    if (hasLeadingZero(text)) {
      return {
        ok: false,
        error: `Invalid SemVer: ${name} identifier "${text}" has a leading zero.`,
      }
    }
  }
  const prerelease = parsePrerelease(match[4])
  if (prerelease === null) {
    return { ok: false, error: 'Invalid SemVer: prerelease identifier has a leading zero.' }
  }
  return {
    ok: true,
    semver: {
      major: Number(majorText),
      minor: Number(minorText),
      patch: Number(patchText),
      prerelease,
      build: parseBuild(match[5]),
    },
  }
}

function compareNumbers(a: number, b: number): -1 | 0 | 1 {
  if (a === b) {
    return 0
  }
  return a < b ? -1 : 1
}

function compareNumericText(a: string, b: string): -1 | 0 | 1 {
  if (a === b) {
    return 0
  }
  if (a.length !== b.length) {
    return a.length < b.length ? -1 : 1
  }
  return a < b ? -1 : 1
}

function compareIdentifiers(a: Identifier, b: Identifier): -1 | 0 | 1 {
  if (a.kind === 'numeric' && b.kind === 'numeric') {
    if (Number.isSafeInteger(a.value) && Number.isSafeInteger(b.value)) {
      return compareNumbers(a.value, b.value)
    }
    return compareNumericText(a.text, b.text)
  }
  if (a.kind === 'numeric') {
    return -1
  }
  if (b.kind === 'numeric') {
    return 1
  }
  if (a.value === b.value) {
    return 0
  }
  return a.value < b.value ? -1 : 1
}

function comparePrerelease(a: readonly Identifier[], b: readonly Identifier[]): -1 | 0 | 1 {
  if (a.length === 0 && b.length === 0) {
    return 0
  }
  if (a.length === 0) {
    return 1
  }
  if (b.length === 0) {
    return -1
  }
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a[index]
    const right = b[index]
    if (left !== undefined && right === undefined) {
      return 1
    }
    if (left === undefined && right !== undefined) {
      return -1
    }
    const compared = compareIdentifiers(left!, right!)
    if (compared !== 0) {
      return compared
    }
  }
  return 0
}

export function compareSemver(a: SemVer, b: SemVer): -1 | 0 | 1 {
  const major = compareNumbers(a.major, b.major)
  if (major !== 0) {
    return major
  }
  const minor = compareNumbers(a.minor, b.minor)
  if (minor !== 0) {
    return minor
  }
  const patch = compareNumbers(a.patch, b.patch)
  if (patch !== 0) {
    return patch
  }
  return comparePrerelease(a.prerelease, b.prerelease)
}

export function compareVersions(a: string, b: string): CompareResult {
  const parsedA = parseSemver(a.trim())
  if (!parsedA.ok) {
    return parsedA
  }
  const parsedB = parseSemver(b.trim())
  if (!parsedB.ok) {
    return parsedB
  }
  return { ok: true, comparison: compareSemver(parsedA.semver, parsedB.semver) }
}

export function sortVersions(
  lines: readonly string[],
  direction: SortDirection = 'asc',
): SortResult {
  const entries: { raw: string; semver: SemVer }[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') {
      continue
    }
    const parsed = parseSemver(line)
    if (!parsed.ok) {
      return { ok: false, error: parsed.error }
    }
    entries.push({ raw: line, semver: parsed.semver })
  }
  if (entries.length === 0) {
    return { ok: false, error: 'Input is empty.' }
  }
  const factor = direction === 'asc' ? 1 : -1
  entries.sort((a, b) => compareSemver(a.semver, b.semver) * factor)
  return { ok: true, lines: entries.map((entry) => entry.raw) }
}

export const COMPARATOR_OPERATORS: readonly ComparatorOperator[] = ['>=', '<=', '>', '<', '=']

export type ParseComparatorResult =
  { ok: true; operator: ComparatorOperator; version: SemVer } | { ok: false; error: string }

export function parseComparator(comparator: string): ParseComparatorResult {
  const trimmed = comparator.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Invalid comparator: empty comparator.' }
  }
  const operator = COMPARATOR_OPERATORS.find((candidate) => trimmed.startsWith(candidate))
  if (operator === undefined) {
    return {
      ok: false,
      error: `Invalid comparator: "${comparator}" must start with >, >=, <, <=, or =.`,
    }
  }
  const versionText = trimmed.slice(operator.length).trim()
  if (versionText === '') {
    return { ok: false, error: 'Invalid comparator: missing version.' }
  }
  const parsed = parseSemver(versionText)
  if (!parsed.ok) {
    return parsed
  }
  return { ok: true, operator, version: parsed.semver }
}

export function satisfies(version: string, comparator: string): RangeResult {
  const parsedVersion = parseSemver(version.trim())
  if (!parsedVersion.ok) {
    return parsedVersion
  }
  const parsedComparator = parseComparator(comparator)
  if (!parsedComparator.ok) {
    return parsedComparator
  }
  const comparison = compareSemver(parsedVersion.semver, parsedComparator.version)
  switch (parsedComparator.operator) {
    case '>':
      return { ok: true, satisfies: comparison === 1 }
    case '>=':
      return { ok: true, satisfies: comparison >= 0 }
    case '<':
      return { ok: true, satisfies: comparison === -1 }
    case '<=':
      return { ok: true, satisfies: comparison <= 0 }
    case '=':
      return { ok: true, satisfies: comparison === 0 }
  }
}
