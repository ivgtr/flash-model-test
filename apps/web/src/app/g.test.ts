import { describe, expect, it } from 'vitest'
describe('g1', () => {
  it('p', () => {
    const defs = import.meta.glob('../../../packages/tools/*/definition.ts', { eager: true })
    console.log('G1(def ../../../):', JSON.stringify(Object.keys(defs)))
    expect(1).toBe(1)
  })
})
