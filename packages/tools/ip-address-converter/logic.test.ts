import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FAMILY,
  FAMILY_OPTIONS,
  compressIpv6,
  convertIpAddress,
  expandIpv6,
  parseFamily,
} from './logic'

const IPV4_192_168_0_1 = {
  ok: true,
  output: {
    family: 'IPv4',
    dotted: '192.168.0.1',
    integer: '3232235521',
    binary: '11000000101010000000000000000001',
    hex: 'c0a80001',
  },
}

describe('convertIpAddress - IPv4', () => {
  it('converts dotted input to integer, binary, and hex', () => {
    expect(convertIpAddress('192.168.0.1')).toEqual(IPV4_192_168_0_1)
  })

  it('converts integer input to dotted, binary, and hex', () => {
    expect(convertIpAddress('3232235521')).toEqual(IPV4_192_168_0_1)
  })

  it('converts 0x-prefixed hex input', () => {
    expect(convertIpAddress('0xc0a80001')).toEqual(IPV4_192_168_0_1)
    expect(convertIpAddress('0XC0A80001')).toEqual(IPV4_192_168_0_1)
  })

  it('converts bare hex input', () => {
    expect(convertIpAddress('c0a80001')).toEqual(IPV4_192_168_0_1)
  })

  it('converts the lower boundary 0.0.0.0 / 0', () => {
    const expected = {
      ok: true,
      output: {
        family: 'IPv4',
        dotted: '0.0.0.0',
        integer: '0',
        binary: '00000000000000000000000000000000',
        hex: '00000000',
      },
    }
    expect(convertIpAddress('0.0.0.0')).toEqual(expected)
    expect(convertIpAddress('0')).toEqual(expected)
    expect(convertIpAddress('0x0')).toEqual(expected)
  })

  it('converts the upper boundary 255.255.255.255 / 4294967295', () => {
    const expected = {
      ok: true,
      output: {
        family: 'IPv4',
        dotted: '255.255.255.255',
        integer: '4294967295',
        binary: '11111111111111111111111111111111',
        hex: 'ffffffff',
      },
    }
    expect(convertIpAddress('255.255.255.255')).toEqual(expected)
    expect(convertIpAddress('4294967295')).toEqual(expected)
    expect(convertIpAddress('0xffffffff')).toEqual(expected)
  })

  it('round-trips dotted, integer, and hex forms', () => {
    for (const input of ['192.168.0.1', '3232235521', '0xc0a80001', 'c0a80001']) {
      const result = convertIpAddress(input)
      expect(result.ok).toBe(true)
      if (!result.ok) {
        continue
      }
      expect(result.output).toEqual(IPV4_192_168_0_1.output)
    }
  })

  it('trims surrounding whitespace', () => {
    expect(convertIpAddress('  192.168.0.1  ')).toEqual(IPV4_192_168_0_1)
  })

  it('reports an error for empty input', () => {
    expect(convertIpAddress('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(convertIpAddress('   ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error when an octet is out of range', () => {
    expect(convertIpAddress('192.168.0.256')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octet is out of range (0-255).',
    })
    expect(convertIpAddress('256.0.0.1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octet is out of range (0-255).',
    })
  })

  it('rejects octets with leading zeros', () => {
    expect(convertIpAddress('192.168.001.1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octets must not have leading zeros.',
    })
    expect(convertIpAddress('192.168.00.1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octets must not have leading zeros.',
    })
    expect(convertIpAddress('192.168.0.01')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octets must not have leading zeros.',
    })
  })

  it('reports an error when the octet count is not 4', () => {
    expect(convertIpAddress('192.168.0')).toEqual({
      ok: false,
      error: 'Invalid IPv4: expected exactly 4 octets.',
    })
    expect(convertIpAddress('192.168.0.1.2')).toEqual({
      ok: false,
      error: 'Invalid IPv4: expected exactly 4 octets.',
    })
    expect(convertIpAddress('192..0.1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: expected exactly 4 octets.',
    })
    expect(convertIpAddress('192.168.0.')).toEqual({
      ok: false,
      error: 'Invalid IPv4: expected exactly 4 octets.',
    })
  })

  it('reports an error for non-decimal octet content', () => {
    expect(convertIpAddress('192.168.0.x1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octets must be decimal numbers.',
    })
  })

  it('reports an error when the integer is out of range', () => {
    expect(convertIpAddress('4294967296')).toEqual({
      ok: false,
      error: 'Invalid IPv4: integer must be between 0 and 4294967295.',
    })
    expect(convertIpAddress('999999999999')).toEqual({
      ok: false,
      error: 'Invalid IPv4: integer must be between 0 and 4294967295.',
    })
  })

  it('reports an error for negative integers', () => {
    expect(convertIpAddress('-1')).toEqual({
      ok: false,
      error:
        'Invalid IPv4: expected dotted (192.168.0.1), integer (0-4294967295), or hex (0x...) input.',
    })
  })

  it('reports an error when the hex value is out of range', () => {
    expect(convertIpAddress('0x100000000')).toEqual({
      ok: false,
      error: 'Invalid IPv4: hex value is out of range (0x00000000-0xffffffff).',
    })
  })

  it('reports an error for invalid hex characters', () => {
    expect(convertIpAddress('0xgg')).toEqual({
      ok: false,
      error:
        'Invalid IPv4: expected dotted (192.168.0.1), integer (0-4294967295), or hex (0x...) input.',
    })
  })

  it('reports an error for a lone 0x prefix', () => {
    expect(convertIpAddress('0x')).toEqual({
      ok: false,
      error:
        'Invalid IPv4: expected dotted (192.168.0.1), integer (0-4294967295), or hex (0x...) input.',
    })
  })
})

describe('convertIpAddress - IPv6', () => {
  it('expands a compressed address to 8 groups', () => {
    expect(convertIpAddress('::1')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '::1',
        expanded: '0000:0000:0000:0000:0000:0000:0000:0001',
      },
    })
  })

  it('compresses a fully expanded address', () => {
    expect(convertIpAddress('2001:0db8:0000:0000:0000:ff00:0042:8329')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '2001:db8::ff00:42:8329',
        expanded: '2001:0db8:0000:0000:0000:ff00:0042:8329',
      },
    })
  })

  it('handles the all-zero address', () => {
    expect(convertIpAddress('::')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '::',
        expanded: '0000:0000:0000:0000:0000:0000:0000:0000',
      },
    })
    expect(convertIpAddress('0:0:0:0:0:0:0:0')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '::',
        expanded: '0000:0000:0000:0000:0000:0000:0000:0000',
      },
    })
  })

  it('compresses the first of equally long zero runs', () => {
    expect(convertIpAddress('1:0:0:2:0:0:3:4')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '1::2:0:0:3:4',
        expanded: '0001:0000:0000:0002:0000:0000:0003:0004',
      },
    })
  })

  it('keeps single zero groups uncompressed', () => {
    expect(convertIpAddress('1:0:2:3:4:5:6:7')).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '1:0:2:3:4:5:6:7',
        expanded: '0001:0000:0002:0003:0004:0005:0006:0007',
      },
    })
  })

  it('normalizes uppercase hex to lowercase', () => {
    const result = convertIpAddress('2001:0DB8:0000:0000:0000:FF00:0042:8329')
    expect(result.ok).toBe(true)
    if (result.ok && result.output.family === 'IPv6') {
      expect(result.output.compressed).toBe('2001:db8::ff00:42:8329')
      expect(result.output.expanded).toBe('2001:0db8:0000:0000:0000:ff00:0042:8329')
    }
  })

  it('handles fe80 link-local style input', () => {
    const result = convertIpAddress('fe80::1')
    expect(result.ok).toBe(true)
    if (result.ok && result.output.family === 'IPv6') {
      expect(result.output.compressed).toBe('fe80::1')
      expect(result.output.expanded).toBe('fe80:0000:0000:0000:0000:0000:0000:0001')
    }
  })

  it('expands an IPv4-mapped IPv6 address', () => {
    const result = convertIpAddress('::ffff:192.168.0.1')
    expect(result).toEqual({
      ok: true,
      output: {
        family: 'IPv6',
        compressed: '::ffff:c0a8:1',
        expanded: '0000:0000:0000:0000:0000:ffff:c0a8:0001',
      },
    })
  })

  it('round-trips compression and expansion', () => {
    const addresses = [
      '::',
      '::1',
      '2001:db8::1',
      '2001:0db8:0000:0000:0000:ff00:0042:8329',
      'fe80::1',
      '1:0:0:2:0:0:3:4',
      '::ffff:192.168.0.1',
      'abcd:ef01:2345:6789:abcd:ef01:2345:6789',
    ]
    for (const address of addresses) {
      const result = convertIpAddress(address)
      if (!result.ok || result.output.family !== 'IPv6') {
        continue
      }
      const { compressed, expanded } = result.output
      const recompressed = convertIpAddress(expanded)
      if (recompressed.ok && recompressed.output.family === 'IPv6') {
        expect(recompressed.output.compressed).toBe(compressed)
      }
      const reexpanded = convertIpAddress(compressed)
      if (reexpanded.ok && reexpanded.output.family === 'IPv6') {
        expect(reexpanded.output.expanded).toBe(expanded)
      }
    }
  })

  it('expandIpv6 and compressIpv6 round-trip on literal groups', () => {
    const groups = [0x2001n, 0x0db8n, 0n, 0n, 0n, 0xff00n, 0x42n, 0x8329n]
    expect(expandIpv6(groups)).toBe('2001:0db8:0000:0000:0000:ff00:0042:8329')
    expect(compressIpv6(groups)).toBe('2001:db8::ff00:42:8329')
    expect(
      compressIpv6(
        expandIpv6(groups)
          .split(':')
          .map((group) => BigInt(`0x${group}`)),
      ),
    ).toBe('2001:db8::ff00:42:8329')
  })

  it('round-trips expanded form back to itself', () => {
    const result = convertIpAddress('fe80::1')
    expect(result.ok).toBe(true)
    if (!result.ok || result.output.family !== 'IPv6') {
      return
    }
    const again = convertIpAddress(result.output.expanded)
    expect(again).toEqual(result)
  })

  it('reports an error when there are not 8 groups', () => {
    expect(convertIpAddress('1:2:3:4:5:6:7')).toEqual({
      ok: false,
      error: 'Invalid IPv6: expected exactly 8 groups.',
    })
    expect(convertIpAddress('1:2:3:4:5:6:7:8:9')).toEqual({
      ok: false,
      error: 'Invalid IPv6: too many groups.',
    })
  })

  it('reports an error when "::" appears more than once', () => {
    expect(convertIpAddress('1::2::3')).toEqual({
      ok: false,
      error: 'Invalid IPv6: "::" may appear at most once.',
    })
    expect(convertIpAddress('::1::')).toEqual({
      ok: false,
      error: 'Invalid IPv6: "::" may appear at most once.',
    })
  })

  it('reports an error when "::" does not replace any group', () => {
    expect(convertIpAddress('1:2:3:4:5:6:7:8::')).toEqual({
      ok: false,
      error: 'Invalid IPv6: "::" must replace at least one group.',
    })
    expect(convertIpAddress('::1:2:3:4:5:6:7:8')).toEqual({
      ok: false,
      error: 'Invalid IPv6: "::" must replace at least one group.',
    })
  })

  it('reports an error for invalid hex characters', () => {
    expect(convertIpAddress('2001:db8::g')).toEqual({
      ok: false,
      error: 'Invalid IPv6: group must be 1-4 hex digits.',
    })
    expect(convertIpAddress('2001:db8::12g4')).toEqual({
      ok: false,
      error: 'Invalid IPv6: group must be 1-4 hex digits.',
    })
  })

  it('reports an error for groups longer than 4 hex digits', () => {
    expect(convertIpAddress('12345::')).toEqual({
      ok: false,
      error: 'Invalid IPv6: group must be 1-4 hex digits.',
    })
  })

  it('reports an error for stray colons', () => {
    expect(convertIpAddress('1:::2')).toEqual({
      ok: false,
      error: 'Invalid IPv6: empty group.',
    })
    expect(convertIpAddress(':1:2:3:4:5:6:7:8')).toEqual({
      ok: false,
      error: 'Invalid IPv6: empty group.',
    })
    expect(convertIpAddress('1:2:3:4:5:6:7:8:')).toEqual({
      ok: false,
      error: 'Invalid IPv6: empty group.',
    })
  })

  it('reports an error for an embedded IPv4 with leading zeros', () => {
    expect(convertIpAddress('::ffff:192.168.001.1')).toEqual({
      ok: false,
      error: 'Invalid IPv4: octets must not have leading zeros.',
    })
  })

  it('reports an error when the embedded IPv4 is not the last part', () => {
    expect(convertIpAddress('::192.168.0.1:1')).toEqual({
      ok: false,
      error: 'Invalid IPv6: embedded IPv4 must be the last part.',
    })
  })
})

describe('convertIpAddress - family selection', () => {
  it('forces IPv4 parsing when family is IPv4', () => {
    expect(convertIpAddress('255.255.255.255', 'IPv4').ok).toBe(true)
    expect(convertIpAddress('2001:db8::1', 'IPv4').ok).toBe(false)
  })

  it('forces IPv6 parsing when family is IPv6', () => {
    expect(convertIpAddress('2001:db8::1', 'IPv6').ok).toBe(true)
    expect(convertIpAddress('192.168.0.1', 'IPv6').ok).toBe(false)
  })

  it('auto-detects by the presence of colons', () => {
    expect(convertIpAddress('::ffff:192.168.0.1', 'auto').ok).toBe(true)
    const result = convertIpAddress('192.168.0.1', 'auto')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.family).toBe('IPv4')
    }
  })
})

describe('parseFamily', () => {
  it('parses supported family selections', () => {
    expect(parseFamily('auto')).toBe('auto')
    expect(parseFamily('IPv4')).toBe('IPv4')
    expect(parseFamily('IPv6')).toBe('IPv6')
  })

  it('returns null for unsupported values', () => {
    expect(parseFamily('ipv6')).toBeNull()
    expect(parseFamily('')).toBeNull()
    expect(parseFamily('inet')).toBeNull()
  })

  it('exposes supported options and the default family', () => {
    expect(FAMILY_OPTIONS).toEqual(['auto', 'IPv4', 'IPv6'])
    expect(DEFAULT_FAMILY).toBe('auto')
  })
})
