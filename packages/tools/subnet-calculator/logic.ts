const MAX_IP = 0xffffffffn

export interface SubnetMask {
  dotted: string
  binary: string
  cidr: number
}

export interface SubnetOutput {
  network: string
  broadcast: string
  firstUsable: string
  lastUsable: string
  usableHosts: number
  totalAddresses: number
  mask: SubnetMask
  wildcard: string
}

export type SubnetResult = { ok: true; output: SubnetOutput } | { ok: false; error: string }

const IP_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

export function parseIpToBigInt(ip: string): bigint | null {
  const match = IP_PATTERN.exec(ip)
  if (match === null) {
    return null
  }
  let value = 0n
  for (let i = 1; i <= 4; i += 1) {
    const octet = Number(match[i])
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null
    }
    value = (value << 8n) | BigInt(octet)
  }
  return value
}

export function maskToCidr(mask: string): number | null {
  if (mask.trim() === '') {
    return null
  }
  const value = parseIpToBigInt(mask)
  if (value === null) {
    return null
  }
  for (let prefix = 0; prefix <= 32; prefix += 1) {
    const expected = (MAX_IP << BigInt(32 - prefix)) & MAX_IP
    if (value === expected) {
      return prefix
    }
  }
  return null
}

function parsePrefix(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }
  const prefix = Number(value)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return null
  }
  return prefix
}

function formatIp(value: bigint): string {
  return [
    (value >> 24n) & 0xffn,
    (value >> 16n) & 0xffn,
    (value >> 8n) & 0xffn,
    value & 0xffn,
  ].join('.')
}

function formatBinary(value: bigint): string {
  const bits = value.toString(2).padStart(32, '0')
  return [bits.slice(0, 8), bits.slice(8, 16), bits.slice(16, 24), bits.slice(24, 32)].join('.')
}

export function calculateSubnet(ip: string, prefixOrMask: string): SubnetResult {
  if (ip.trim() === '' || prefixOrMask.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const ipValue = parseIpToBigInt(ip.trim())
  if (ipValue === null) {
    return { ok: false, error: `Invalid IP address: "${ip}".` }
  }

  let prefix: number
  if (prefixOrMask.includes('.')) {
    const cidr = maskToCidr(prefixOrMask.trim())
    if (cidr === null) {
      return {
        ok: false,
        error: `Invalid subnet mask: "${prefixOrMask}". Mask must be a contiguous run of ones.`,
      }
    }
    prefix = cidr
  } else {
    const parsed = parsePrefix(prefixOrMask.trim())
    if (parsed === null) {
      return {
        ok: false,
        error: `Invalid prefix: "${prefixOrMask}". Prefix must be an integer between 0 and 32.`,
      }
    }
    prefix = parsed
  }

  const netMask = (MAX_IP << BigInt(32 - prefix)) & MAX_IP
  const hostMask = MAX_IP >> BigInt(prefix)
  const networkValue = ipValue & netMask
  const broadcastValue = networkValue | hostMask
  const totalAddresses = 1n << BigInt(32 - prefix)

  const firstUsable = prefix >= 31 ? networkValue : networkValue + 1n
  const lastUsable = prefix >= 31 ? broadcastValue : broadcastValue - 1n
  const usableHosts = prefix >= 31 ? 2 ** (32 - prefix) : Number(totalAddresses - 2n)

  return {
    ok: true,
    output: {
      network: formatIp(networkValue),
      broadcast: formatIp(broadcastValue),
      firstUsable: formatIp(firstUsable),
      lastUsable: formatIp(lastUsable),
      usableHosts,
      totalAddresses: Number(totalAddresses),
      mask: {
        dotted: formatIp(netMask),
        binary: formatBinary(netMask),
        cidr: prefix,
      },
      wildcard: formatIp(MAX_IP ^ netMask),
    },
  }
}

export function formatSubnetOutput(output: SubnetOutput): string {
  return [
    `Network: ${output.network}`,
    `Broadcast: ${output.broadcast}`,
    `First usable: ${output.firstUsable}`,
    `Last usable: ${output.lastUsable}`,
    `Usable hosts: ${output.usableHosts}`,
    `Total addresses: ${output.totalAddresses}`,
    `Mask: ${output.mask.dotted} (${output.mask.binary}, /${output.mask.cidr})`,
    `Wildcard: ${output.wildcard}`,
  ].join('\n')
}
