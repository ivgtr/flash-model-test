export type CharacterClass = 'lower' | 'upper' | 'digit' | 'symbol' | 'other'

export const CHARACTER_CLASS_POOL_SIZES: Record<CharacterClass, number> = {
  lower: 26,
  upper: 26,
  digit: 10,
  symbol: 33,
  other: 100,
}

export const MAX_ENTROPY_LENGTH = 100
export const MAX_ENTROPY_BITS = 500

export type PasswordScore = 0 | 1 | 2 | 3 | 4

export const SCORE_LABELS: Record<PasswordScore, string> = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

export interface PasswordCheck {
  id: string
  label: string
  passed: boolean
}

export interface PasswordAnalysis {
  score: PasswordScore
  label: string
  checks: PasswordCheck[]
  entropyBits: number
}

export function classifyCharacter(char: string): CharacterClass {
  const code = char.charCodeAt(0)
  if (code >= 97 && code <= 122) return 'lower'
  if (code >= 65 && code <= 90) return 'upper'
  if (code >= 48 && code <= 57) return 'digit'
  if (code >= 32 && code <= 126) return 'symbol'
  return 'other'
}

function countClasses(input: string): number {
  const present = new Set<CharacterClass>()
  for (const char of input) {
    present.add(classifyCharacter(char))
  }
  return present.size
}

function hasClass(input: string, cls: CharacterClass): boolean {
  for (const char of input) {
    if (classifyCharacter(char) === cls) return true
  }
  return false
}

function maxRepeatedRun(input: string): number {
  let maxRun = 0
  let run = 0
  let previous = ''
  for (const char of input) {
    run = char === previous ? run + 1 : 1
    if (run > maxRun) maxRun = run
    previous = char
  }
  return maxRun
}

function longestSequence(input: string): number {
  if (input.length < 2) return 0
  let maxRun = 1
  let run = 1
  for (let index = 1; index < input.length; index += 1) {
    const previous = input[index - 1]!
    const current = input[index]!
    const previousClass = classifyCharacter(previous)
    const currentClass = classifyCharacter(current)
    const step = current.charCodeAt(0) - previous.charCodeAt(0)
    const isLetterOrDigit =
      previousClass !== 'symbol' && previousClass !== 'other' && currentClass === previousClass
    if (isLetterOrDigit && (step === 1 || step === -1)) {
      run += 1
      if (run > maxRun) maxRun = run
    } else {
      run = 1
    }
  }
  return maxRun
}

export function estimateEntropyBits(input: string): number {
  if (input === '') return 0
  const classes = new Set<CharacterClass>()
  for (const char of input) {
    classes.add(classifyCharacter(char))
  }
  let poolSize = 0
  for (const cls of classes) {
    poolSize += CHARACTER_CLASS_POOL_SIZES[cls]
  }
  const length = Math.min(input.length, MAX_ENTROPY_LENGTH)
  const bits = Math.min(MAX_ENTROPY_BITS, length * Math.log2(poolSize))
  return Math.round(bits * 10) / 10
}

function computeScore(length: number, classCount: number, penalty: number): PasswordScore {
  const lengthScore = Math.min(4, Math.floor(length / 4))
  const varietyBonus = Math.max(0, classCount - 2)
  const raw = lengthScore + varietyBonus - penalty
  const clamped = Math.min(4, Math.max(0, raw))
  return clamped as PasswordScore
}

export function analyzePassword(input: string): PasswordAnalysis {
  const length = input.length
  const classCount = countClasses(input)
  const repetitionPenalty = Math.max(0, maxRepeatedRun(input) - 2)
  const sequencePenalty = Math.max(0, longestSequence(input) - 2)
  const penalty = repetitionPenalty + sequencePenalty
  const score = computeScore(length, classCount, penalty)

  const checks: PasswordCheck[] = [
    { id: 'length-8', label: 'At least 8 characters', passed: length >= 8 },
    { id: 'length-12', label: 'At least 12 characters', passed: length >= 12 },
    { id: 'uppercase', label: 'Contains an uppercase letter', passed: hasClass(input, 'upper') },
    { id: 'lowercase', label: 'Contains a lowercase letter', passed: hasClass(input, 'lower') },
    { id: 'digit', label: 'Contains a digit', passed: hasClass(input, 'digit') },
    { id: 'symbol', label: 'Contains a symbol', passed: hasClass(input, 'symbol') },
    {
      id: 'repetition',
      label: 'Few repeated or sequential characters',
      passed: length > 0 && penalty === 0,
    },
  ]

  return {
    score,
    label: SCORE_LABELS[score],
    checks,
    entropyBits: estimateEntropyBits(input),
  }
}
