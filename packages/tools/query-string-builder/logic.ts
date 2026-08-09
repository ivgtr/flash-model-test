export interface KeyValueRow {
  key: string
  value: string
}

export const MAX_ROWS = 100

export function buildQueryString(rows: readonly KeyValueRow[]): string {
  const params = new URLSearchParams()
  for (const row of rows) {
    if (row.key.trim() === '') {
      continue
    }
    params.append(row.key, row.value)
  }
  return params.toString()
}

export function parseQueryString(input: string): KeyValueRow[] {
  const normalized = input.startsWith('?') ? input.slice(1) : input
  const params = new URLSearchParams(normalized)
  const rows: KeyValueRow[] = []
  for (const [key, value] of params.entries()) {
    rows.push({ key, value })
  }
  return rows
}
