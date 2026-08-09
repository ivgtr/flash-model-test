import { describe, expect, it } from 'vitest'
import {
  compareSemver,
  compareVersions,
  parseComparator,
  parseSemver,
  satisfies,
  sortVersions,
} from './logic'

describe('parseSemver', () => {
  it('parses a plain version into its numeric components', () => {
    const result = parseSemver('1.2.3')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.semver).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: [],
        build: [],
      })
    }
  })

  it('accepts a leading v prefix and zero components', () => {
    expect(parseSemver('v1.2.3').ok).toBe(true)
    expect(parseSemver('v0.0.0').ok).toBe(true)
    expect(parseSemver('0.0.1').ok).toBe(true)
  })

  it('parses prerelease and build identifiers with their kinds', () => {
    const result = parseSemver('1.2.3-alpha.1+build.5')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.semver.prerelease).toEqual([
        { kind: 'alphanumeric', value: 'alpha' },
        { kind: 'numeric', value: 1, text: '1' },
      ])
      expect(result.semver.build).toEqual(['build', '5'])
    }
  })

  it('parses a version with only a build identifier', () => {
    const result = parseSemver('1.2.3+build')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.semver.prerelease).toEqual([])
      expect(result.semver.build).toEqual(['build'])
    }
  })

  it('rejects empty and whitespace-only input', () => {
    expect(parseSemver('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(parseSemver('   ').ok).toBe(false)
  })

  it('rejects leading zeros in major, minor, and patch', () => {
    for (const version of ['01.2.3', '1.02.3', '1.2.03']) {
      const result = parseSemver(version)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/has a leading zero/)
      }
    }
  })

  it('rejects leading zeros in numeric prerelease identifiers', () => {
    const result = parseSemver('1.2.3-01')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/prerelease identifier has a leading zero/)
    }
  })

  it('rejects missing version components', () => {
    for (const version of ['1', '1.2', '1.2.3.4', '.1.2.3', '1..3', 'v1.2']) {
      expect(parseSemver(version).ok).toBe(false)
    }
  })

  it('rejects empty identifiers in prerelease and build', () => {
    for (const version of [
      '1.2.3-',
      '1.2.3-alpha.',
      '1.2.3-alpha..beta',
      '1.2.3+',
      '1.2.3+build.',
    ]) {
      expect(parseSemver(version).ok).toBe(false)
    }
  })

  it('accepts a hyphen-only prerelease identifier as valid per SemVer grammar', () => {
    const result = parseSemver('1.2.3--')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.semver.prerelease).toEqual([{ kind: 'alphanumeric', value: '-' }])
    }
  })

  it('rejects invalid characters and surrounding whitespace', () => {
    for (const version of [
      '1.2.3-alpha_beta',
      '1.2.3 alpha',
      '1.2.3-α',
      '1.a.3',
      '1.2.3+build#1',
      '1.2.3 ',
      ' 1.2.3',
    ]) {
      const result = parseSemver(version)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/not a valid version/)
      }
    }
  })

  it('allows leading zeros in build identifiers', () => {
    expect(parseSemver('1.2.3+01').ok).toBe(true)
  })
})

describe('compareVersions', () => {
  it('compares major, minor, and patch numerically', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.0', '1.3.0')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3', '1.2.4')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('2.0.0', '1.9.9')).toEqual({ ok: true, comparison: 1 })
    expect(compareVersions('1.2.3', '1.2.3')).toEqual({ ok: true, comparison: 0 })
  })

  it('compares numeric identifiers numerically, not lexically', () => {
    expect(compareVersions('1.2.3-2', '1.2.3-10')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-2.2', '1.2.3-2.10')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-10', '1.2.3-2')).toEqual({ ok: true, comparison: 1 })
  })

  it('compares alphanumeric identifiers lexically', () => {
    expect(compareVersions('1.2.3-alpha', '1.2.3-beta')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-a', '1.2.3-aa')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-rc.1', '1.2.3-rc.1')).toEqual({ ok: true, comparison: 0 })
  })

  it('orders numeric identifiers below alphanumeric identifiers', () => {
    expect(compareVersions('1.2.3-1', '1.2.3-alpha')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-alpha', '1.2.3-1')).toEqual({ ok: true, comparison: 1 })
  })

  it('orders shorter prerelease sequences below longer equal prefixes', () => {
    expect(compareVersions('1.2.3-alpha', '1.2.3-alpha.1')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.2.3-alpha.1', '1.2.3-alpha')).toEqual({ ok: true, comparison: 1 })
  })

  it('orders a release above any prerelease of the same core', () => {
    expect(compareVersions('1.0.0-alpha', '1.0.0')).toEqual({ ok: true, comparison: -1 })
    expect(compareVersions('1.0.0', '1.0.0-alpha')).toEqual({ ok: true, comparison: 1 })
    expect(compareVersions('1.2.3-alpha', '1.2.3')).toEqual({ ok: true, comparison: -1 })
  })

  it('ignores build metadata in comparisons', () => {
    expect(compareVersions('1.0.0+build.1', '1.0.0')).toEqual({ ok: true, comparison: 0 })
    expect(compareVersions('1.0.0+zzz', '1.0.0+aaa')).toEqual({ ok: true, comparison: 0 })
    expect(compareVersions('1.0.0+2', '1.0.0+1')).toEqual({ ok: true, comparison: 0 })
  })

  it('follows the full precedence chain from the spec', () => {
    const chain = ['1.2.3-alpha', '1.2.3-alpha.1', '1.2.3-alpha.beta', '1.2.3-beta', '1.2.3']
    for (let index = 0; index < chain.length - 1; index += 1) {
      expect(compareVersions(chain[index]!, chain[index + 1]!)).toEqual({
        ok: true,
        comparison: -1,
      })
    }
  })

  it('compares large numeric identifiers beyond safe integers', () => {
    expect(compareVersions('9999999999999999999999.0.0', '99999999999999999999999.0.0')).toEqual({
      ok: true,
      comparison: -1,
    })
  })

  it('compares v-prefixed versions equivalently', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toEqual({ ok: true, comparison: 0 })
    expect(compareVersions('v1.2.4', '1.2.3')).toEqual({ ok: true, comparison: 1 })
  })

  it('reports an error for an invalid version', () => {
    expect(compareVersions('01.2.3', '1.2.3').ok).toBe(false)
    expect(compareVersions('1.2.3', 'nope').ok).toBe(false)
  })
})

describe('compareSemver', () => {
  it('returns -1, 0, or 1 for parsed versions', () => {
    const a = parseSemver('1.0.0')
    const b = parseSemver('1.0.1')
    const c = parseSemver('1.0.1')
    expect(a.ok && b.ok && c.ok).toBe(true)
    if (a.ok && b.ok && c.ok) {
      expect(compareSemver(a.semver, b.semver)).toBe(-1)
      expect(compareSemver(b.semver, c.semver)).toBe(0)
      expect(compareSemver(b.semver, a.semver)).toBe(1)
    }
  })
})

describe('sortVersions', () => {
  it('sorts versions in ascending order', () => {
    const result = sortVersions(['3.0.0', '1.0.0', '2.0.0'])
    expect(result).toEqual({ ok: true, lines: ['1.0.0', '2.0.0', '3.0.0'] })
  })

  it('sorts versions in descending order', () => {
    const result = sortVersions(['1.0.0', '3.0.0', '2.0.0'], 'desc')
    expect(result).toEqual({ ok: true, lines: ['3.0.0', '2.0.0', '1.0.0'] })
  })

  it('sorts prerelease versions before their release', () => {
    const result = sortVersions(['1.0.0', '1.0.0-beta', '1.0.0-alpha'])
    expect(result).toEqual({ ok: true, lines: ['1.0.0-alpha', '1.0.0-beta', '1.0.0'] })
  })

  it('sorts v-prefixed and plain versions together', () => {
    const result = sortVersions(['v2.0.0', '1.0.0', '1.5.0'])
    expect(result).toEqual({ ok: true, lines: ['1.0.0', '1.5.0', 'v2.0.0'] })
  })

  it('keeps input order for versions that compare equal', () => {
    const result = sortVersions(['1.0.0+b', '1.0.0+a', '1.0.0'])
    expect(result).toEqual({ ok: true, lines: ['1.0.0+b', '1.0.0+a', '1.0.0'] })
  })

  it('reports an error when an invalid line is present', () => {
    const result = sortVersions(['1.0.0', 'not-a-version', '2.0.0'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/Invalid SemVer/)
    }
  })

  it('reports an error for leading-zero lines instead of ignoring them', () => {
    const result = sortVersions(['1.0.0', '01.2.3'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/leading zero/)
    }
  })

  it('reports an error for empty input', () => {
    expect(sortVersions([])).toEqual({ ok: false, error: 'Input is empty.' })
    expect(sortVersions(['', '  '])).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('ignores blank lines between versions', () => {
    const result = sortVersions(['2.0.0', '', '1.0.0', '  ', '3.0.0'])
    expect(result).toEqual({ ok: true, lines: ['1.0.0', '2.0.0', '3.0.0'] })
  })
})

describe('parseComparator', () => {
  it('parses each supported operator', () => {
    const ge = parseComparator('>=1.2.3')
    expect(ge.ok).toBe(true)
    if (ge.ok) {
      expect(ge).toEqual({
        ok: true,
        operator: '>=',
        version: expect.objectContaining({ major: 1, minor: 2, patch: 3 }),
      })
    }
    const operators: string[] = []
    for (const comparator of ['<=1.2.3', '>1.2.3', '<1.2.3', '=1.2.3']) {
      const parsed = parseComparator(comparator)
      expect(parsed.ok).toBe(true)
      if (parsed.ok) {
        operators.push(parsed.operator)
      }
    }
    expect(operators).toEqual(['<=', '>', '<', '='])
  })

  it('rejects comparators without an operator', () => {
    const result = parseComparator('1.2.3')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/must start with/)
    }
  })

  it('rejects empty comparators and missing versions', () => {
    expect(parseComparator('').ok).toBe(false)
    expect(parseComparator('>=').ok).toBe(false)
    expect(parseComparator('!!1.2.3').ok).toBe(false)
  })

  it('rejects comparators with an invalid version', () => {
    expect(parseComparator('>=01.2.3').ok).toBe(false)
    expect(parseComparator('>=nope').ok).toBe(false)
  })
})

describe('satisfies', () => {
  it('evaluates the greater-than operator', () => {
    expect(satisfies('1.2.4', '>1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.3', '>1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('evaluates the greater-than-or-equal operator', () => {
    expect(satisfies('1.2.3', '>=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.4', '>=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.2', '>=1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('evaluates the less-than operator', () => {
    expect(satisfies('1.2.2', '<1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.3', '<1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('evaluates the less-than-or-equal operator', () => {
    expect(satisfies('1.2.3', '<=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.2', '<=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.4', '<=1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('evaluates the equals operator', () => {
    expect(satisfies('1.2.3', '=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.3+build', '=1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.4', '=1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('applies prerelease precedence in range checks', () => {
    expect(satisfies('1.2.3-alpha', '<1.2.3')).toEqual({ ok: true, satisfies: true })
    expect(satisfies('1.2.3-alpha', '>=1.2.3')).toEqual({ ok: true, satisfies: false })
  })

  it('trims surrounding whitespace from both inputs', () => {
    expect(satisfies(' 1.2.3 ', ' >=1.0.0 ')).toEqual({ ok: true, satisfies: true })
  })

  it('reports an error for an invalid version', () => {
    expect(satisfies('oops', '>=1.0.0').ok).toBe(false)
    expect(satisfies('1.2.3', '>=01.0.0').ok).toBe(false)
  })

  it('reports an error for an invalid comparator', () => {
    const result = satisfies('1.2.3', '1.2.3')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/must start with/)
    }
  })
})
