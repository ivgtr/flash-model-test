export const CASE_TARGETS = [
  'camelCase',
  'PascalCase',
  'snake_case',
  'kebab-case',
  'SCREAMING_SNAKE_CASE',
  'Title Case',
] as const

export type CaseTarget = (typeof CASE_TARGETS)[number]

export const DEFAULT_TARGET: CaseTarget = 'camelCase'

const SEPARATOR_PATTERN = /[^a-zA-Z0-9]/

export function splitWords(input: string): string[] {
  const words: string[] = []
  let current = ''

  const flush = () => {
    if (current !== '') {
      words.push(current)
      current = ''
    }
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === undefined) {
      continue
    }
    if (SEPARATOR_PATTERN.test(char)) {
      flush()
      continue
    }
    if (char >= 'A' && char <= 'Z') {
      const last = current[current.length - 1]
      const next = input[i + 1]
      const lastIsLower = last !== undefined && last >= 'a' && last <= 'z'
      const lastIsUpper = last !== undefined && last >= 'A' && last <= 'Z'
      const nextIsLower = next !== undefined && next >= 'a' && next <= 'z'
      if (lastIsLower || (lastIsUpper && nextIsLower)) {
        flush()
      }
    }
    current += char
  }
  flush()
  return words
}

const toLowerCase = (word: string) => word.toLowerCase()
const toUpperCase = (word: string) => word.toUpperCase()
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

export function convertCase(input: string, target: CaseTarget = DEFAULT_TARGET): string {
  const words = splitWords(input)
  switch (target) {
    case 'camelCase':
      return words
        .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word)))
        .join('')
    case 'PascalCase':
      return words.map(capitalize).join('')
    case 'snake_case':
      return words.map(toLowerCase).join('_')
    case 'kebab-case':
      return words.map(toLowerCase).join('-')
    case 'SCREAMING_SNAKE_CASE':
      return words.map(toUpperCase).join('_')
    case 'Title Case':
      return words.map(capitalize).join(' ')
  }
}
