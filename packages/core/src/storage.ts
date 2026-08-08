export interface KeyValueStorage {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
}

export class StorageCorruptionError extends Error {
  constructor(key: string) {
    super(`Stored value for "${key}" is not valid JSON`)
    this.name = 'StorageCorruptionError'
  }
}

export function createKeyValueStorage(store: Storage): KeyValueStorage {
  return {
    get<T>(key: string): T | null {
      const raw = store.getItem(key)
      if (raw === null) {
        return null
      }
      try {
        return JSON.parse(raw) as T
      } catch {
        throw new StorageCorruptionError(key)
      }
    },
    set<T>(key: string, value: T): void {
      store.setItem(key, JSON.stringify(value))
    },
    remove(key: string): void {
      store.removeItem(key)
    },
  }
}
