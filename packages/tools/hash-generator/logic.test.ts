import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ALGORITHM,
  HASH_ALGORITHMS,
  HEX_DIGIT_LENGTHS,
  computeHash,
  isHashAlgorithm,
  toHex,
} from './logic'

const VECTORS: Record<(typeof HASH_ALGORITHMS)[number], Record<string, string>> = {
  'SHA-1': {
    abc: 'a9993e364706816aba3e25717850c26c9cd0d89d',
    '': 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    日本語: 'c12140a0ffb4e56481b4fe0a7a25040c2eafa9ca',
  },
  'SHA-256': {
    abc: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    '': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    日本語: '77710aedc74ecfa33685e33a6c7df5cc83004da1bdcef7fb280f5c2b2e97e0a5',
  },
  'SHA-384': {
    abc: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    '': '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
    日本語:
      'd0b1adaab86b27d5d30373aa7f9642cd0695cfa4cd438f66b4006f7f807f1f8f77349e77d1d48be1afadd078d7385bde',
  },
  'SHA-512': {
    abc: 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    '': 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    日本語:
      '3df44aa21ecaedcf5b27b2d9ac97347ef57344534798de884593bed4ff920c79213d491eb5b61c07780cc485be830a1a2f6ef1347e02216d0cb560afd3f392f5',
  },
}

describe('computeHash', () => {
  it('matches known vectors for "abc" with all four algorithms', async () => {
    for (const algorithm of HASH_ALGORITHMS) {
      await expect(computeHash('abc', algorithm)).resolves.toBe(VECTORS[algorithm]['abc'])
    }
  })

  it('hashes the empty string without error', async () => {
    for (const algorithm of HASH_ALGORITHMS) {
      await expect(computeHash('', algorithm)).resolves.toBe(VECTORS[algorithm][''])
    }
  })

  it('hashes unicode input as UTF-8 bytes', async () => {
    for (const algorithm of HASH_ALGORITHMS) {
      await expect(computeHash('日本語', algorithm)).resolves.toBe(VECTORS[algorithm]['日本語'])
    }
  })

  it('hashes emoji input as UTF-8 bytes', async () => {
    await expect(computeHash('こんにちは 🌍')).resolves.toBe(
      'faaffb0c195c5f07c64e6b29dc675916eb237b3f138c0f453f805b89e9303e05',
    )
  })

  it('uses SHA-256 by default', async () => {
    expect(DEFAULT_ALGORITHM).toBe('SHA-256')
    await expect(computeHash('abc')).resolves.toBe(VECTORS['SHA-256']['abc'])
  })

  it('produces the expected output length for every algorithm', async () => {
    for (const algorithm of HASH_ALGORITHMS) {
      const digest = await computeHash('abc', algorithm)
      expect(digest).toMatch(/^[0-9a-f]+$/)
      expect(digest).toHaveLength(HEX_DIGIT_LENGTHS[algorithm])
    }
  })

  it('branches correctly for all four algorithms', async () => {
    const digests = await Promise.all(
      HASH_ALGORITHMS.map((algorithm) => computeHash('abc', algorithm)),
    )
    expect(new Set(digests).size).toBe(HASH_ALGORITHMS.length)
  })
})

describe('toHex', () => {
  it('encodes bytes as lowercase hex', () => {
    const buffer = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x0a]).buffer
    expect(toHex(buffer)).toBe('deadbeef000a')
  })

  it('encodes an empty buffer as an empty string', () => {
    expect(toHex(new ArrayBuffer(0))).toBe('')
  })
})

describe('isHashAlgorithm', () => {
  it('accepts the four supported algorithms', () => {
    for (const algorithm of HASH_ALGORITHMS) {
      expect(isHashAlgorithm(algorithm)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    expect(isHashAlgorithm('MD5')).toBe(false)
    expect(isHashAlgorithm('sha-256')).toBe(false)
    expect(isHashAlgorithm('')).toBe(false)
  })
})
