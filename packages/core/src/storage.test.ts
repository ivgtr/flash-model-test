import { describe, expect, it } from 'vitest'
import { StorageCorruptionError, createKeyValueStorage } from './storage'

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
}

describe('createKeyValueStorage', () => {
  it('round-trips a JSON value', () => {
    const store = createMemoryStorage()
    const storage = createKeyValueStorage(store)
    storage.set('tool.input', { text: 'hello', count: 3 })
    expect(storage.get<{ text: string; count: number }>('tool.input')).toEqual({
      text: 'hello',
      count: 3,
    })
  })

  it('returns null for a missing key', () => {
    const storage = createKeyValueStorage(createMemoryStorage())
    expect(storage.get('missing')).toBeNull()
  })

  it('stores primitives', () => {
    const storage = createKeyValueStorage(createMemoryStorage())
    storage.set('tool.count', 42)
    expect(storage.get<number>('tool.count')).toBe(42)
  })

  it('throws StorageCorruptionError for malformed JSON', () => {
    const store = createMemoryStorage()
    store.setItem('tool.input', '{not json')
    const storage = createKeyValueStorage(store)
    expect(() => storage.get('tool.input')).toThrow(StorageCorruptionError)
  })

  it('removes a key', () => {
    const store = createMemoryStorage()
    const storage = createKeyValueStorage(store)
    storage.set('tool.input', 'value')
    storage.remove('tool.input')
    expect(storage.get('tool.input')).toBeNull()
  })
})
