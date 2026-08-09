import { describe, expect, it } from 'vitest'
import { calculateSubnet, formatSubnetOutput, maskToCidr, parseIpToBigInt } from './logic'

describe('calculateSubnet', () => {
  it('calculates a typical /24 subnet', () => {
    const result = calculateSubnet('192.168.1.100', '24')
    expect(result).toEqual({
      ok: true,
      output: {
        network: '192.168.1.0',
        broadcast: '192.168.1.255',
        firstUsable: '192.168.1.1',
        lastUsable: '192.168.1.254',
        usableHosts: 254,
        totalAddresses: 256,
        mask: {
          dotted: '255.255.255.0',
          binary: '11111111.11111111.11111111.00000000',
          cidr: 24,
        },
        wildcard: '0.0.0.255',
      },
    })
  })

  it('computes the network from a non-boundary IP (192.168.1.129/25)', () => {
    const result = calculateSubnet('192.168.1.129', '25')
    expect(result).toEqual({
      ok: true,
      output: {
        network: '192.168.1.128',
        broadcast: '192.168.1.255',
        firstUsable: '192.168.1.129',
        lastUsable: '192.168.1.254',
        usableHosts: 126,
        totalAddresses: 128,
        mask: {
          dotted: '255.255.255.128',
          binary: '11111111.11111111.11111111.10000000',
          cidr: 25,
        },
        wildcard: '0.0.0.127',
      },
    })
  })

  it('handles the /0 boundary', () => {
    const result = calculateSubnet('10.20.30.40', '0')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.network).toBe('0.0.0.0')
      expect(result.output.broadcast).toBe('255.255.255.255')
      expect(result.output.firstUsable).toBe('0.0.0.1')
      expect(result.output.lastUsable).toBe('255.255.255.254')
      expect(result.output.usableHosts).toBe(4294967294)
      expect(result.output.totalAddresses).toBe(4294967296)
      expect(result.output.mask).toEqual({
        dotted: '0.0.0.0',
        binary: '00000000.00000000.00000000.00000000',
        cidr: 0,
      })
      expect(result.output.wildcard).toBe('255.255.255.255')
    }
  })

  it('handles the /32 boundary with a single usable host', () => {
    const result = calculateSubnet('10.0.0.5', '32')
    expect(result).toEqual({
      ok: true,
      output: {
        network: '10.0.0.5',
        broadcast: '10.0.0.5',
        firstUsable: '10.0.0.5',
        lastUsable: '10.0.0.5',
        usableHosts: 1,
        totalAddresses: 1,
        mask: {
          dotted: '255.255.255.255',
          binary: '11111111.11111111.11111111.11111111',
          cidr: 32,
        },
        wildcard: '0.0.0.0',
      },
    })
  })

  it('treats /31 as 2 usable addresses per RFC 3021', () => {
    const aligned = calculateSubnet('192.168.1.0', '31')
    expect(aligned.ok).toBe(true)
    if (aligned.ok) {
      expect(aligned.output.network).toBe('192.168.1.0')
      expect(aligned.output.broadcast).toBe('192.168.1.1')
      expect(aligned.output.firstUsable).toBe('192.168.1.0')
      expect(aligned.output.lastUsable).toBe('192.168.1.1')
      expect(aligned.output.usableHosts).toBe(2)
      expect(aligned.output.totalAddresses).toBe(2)
    }

    const misaligned = calculateSubnet('192.168.1.3', '31')
    expect(misaligned.ok).toBe(true)
    if (misaligned.ok) {
      expect(misaligned.output.network).toBe('192.168.1.2')
      expect(misaligned.output.broadcast).toBe('192.168.1.3')
      expect(misaligned.output.usableHosts).toBe(2)
    }
  })

  it('computes host counts for various prefixes', () => {
    const cases: Array<[prefix: string, usable: number, total: number]> = [
      ['30', 2, 4],
      ['29', 6, 8],
      ['26', 62, 64],
      ['16', 65534, 65536],
      ['0', 4294967294, 4294967296],
      ['31', 2, 2],
      ['32', 1, 1],
    ]
    for (const [prefix, usable, total] of cases) {
      const result = calculateSubnet('192.168.0.0', prefix)
      expect(result.ok, `prefix ${prefix}`).toBe(true)
      if (result.ok) {
        expect(result.output.usableHosts, `prefix ${prefix}`).toBe(usable)
        expect(result.output.totalAddresses, `prefix ${prefix}`).toBe(total)
      }
    }
  })
})

describe('mask conversion', () => {
  it('converts a dotted mask to a CIDR prefix', () => {
    expect(calculateSubnet('192.168.1.5', '255.255.255.0')).toEqual(
      calculateSubnet('192.168.1.5', '24'),
    )
    expect(calculateSubnet('10.0.0.1', '255.255.255.252').ok).toBe(true)
    if (calculateSubnet('10.0.0.1', '255.255.255.252').ok) {
      expect(calculateSubnet('10.0.0.1', '255.255.255.252')).toEqual(
        calculateSubnet('10.0.0.1', '30'),
      )
    }
  })

  it('converts boundary masks via maskToCidr', () => {
    expect(maskToCidr('0.0.0.0')).toBe(0)
    expect(maskToCidr('255.0.0.0')).toBe(8)
    expect(maskToCidr('255.255.128.0')).toBe(17)
    expect(maskToCidr('255.255.255.0')).toBe(24)
    expect(maskToCidr('255.255.255.252')).toBe(30)
    expect(maskToCidr('255.255.255.255')).toBe(32)
  })

  it('rejects non-contiguous and invalid masks', () => {
    expect(maskToCidr('255.255.255.1')).toBeNull()
    expect(maskToCidr('255.0.255.0')).toBeNull()
    expect(maskToCidr('255.255.254.1')).toBeNull()
    expect(maskToCidr('128.0.0.1')).toBeNull()
    expect(maskToCidr('255.256.255.0')).toBeNull()
    expect(maskToCidr('255.255.255')).toBeNull()
    expect(maskToCidr('')).toBeNull()
  })
})

describe('parseIpToBigInt', () => {
  it('parses valid IPv4 addresses', () => {
    expect(parseIpToBigInt('0.0.0.0')).toBe(0n)
    expect(parseIpToBigInt('255.255.255.255')).toBe(0xffffffffn)
    expect(parseIpToBigInt('192.168.1.129')).toBe(0xc0a80181n)
  })

  it('rejects malformed IPv4 addresses', () => {
    expect(parseIpToBigInt('')).toBeNull()
    expect(parseIpToBigInt('abc')).toBeNull()
    expect(parseIpToBigInt('1.2.3')).toBeNull()
    expect(parseIpToBigInt('1.2.3.4.5')).toBeNull()
    expect(parseIpToBigInt('256.1.1.1')).toBeNull()
    expect(parseIpToBigInt('1.2.3.999')).toBeNull()
    expect(parseIpToBigInt('-1.2.3.4')).toBeNull()
    expect(parseIpToBigInt('1.2.3.4.')).toBeNull()
  })
})

describe('calculateSubnet errors', () => {
  it('reports an error for empty input', () => {
    expect(calculateSubnet('', '24')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(calculateSubnet('192.168.1.1', '')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(calculateSubnet('   ', '  ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for an invalid IP address', () => {
    expect(calculateSubnet('not-an-ip', '24').ok).toBe(false)
    expect(calculateSubnet('256.1.1.1', '24').ok).toBe(false)
    expect(calculateSubnet('1.2.3', '24').ok).toBe(false)
    expect(calculateSubnet('1.2.3.4.5', '24').ok).toBe(false)
  })

  it('reports an error for a prefix out of range or malformed', () => {
    expect(calculateSubnet('192.168.1.1', '33').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', '-1').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', 'abc').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', '1.5').ok).toBe(false)
    const outOfRange = calculateSubnet('192.168.1.1', '33')
    if (!outOfRange.ok) {
      expect(outOfRange.error).toMatch(/between 0 and 32/)
    }
  })

  it('reports an error for a non-contiguous mask', () => {
    expect(calculateSubnet('192.168.1.1', '255.255.255.1').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', '255.0.255.0').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', '255.255.254.1').ok).toBe(false)
  })

  it('reports an error for an invalid mask value', () => {
    expect(calculateSubnet('192.168.1.1', '255.256.255.0').ok).toBe(false)
    expect(calculateSubnet('192.168.1.1', '255.255.255').ok).toBe(false)
  })

  it('does not mutate the input IP when host bits are set', () => {
    const result = calculateSubnet('192.168.1.129', '24')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.network).toBe('192.168.1.0')
      expect(result.output.broadcast).toBe('192.168.1.255')
    }
  })
})

describe('formatSubnetOutput', () => {
  it('formats the output as a copyable summary', () => {
    const result = calculateSubnet('192.168.1.129', '25')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(formatSubnetOutput(result.output)).toContain('Network: 192.168.1.128')
      expect(formatSubnetOutput(result.output)).toContain('Usable hosts: 126')
      expect(formatSubnetOutput(result.output)).toContain('Mask: 255.255.255.128 (11111111.')
      expect(formatSubnetOutput(result.output)).toContain(', /25)')
    }
  })
})
