export const FLAG_OPTIONS = ['g', 'i', 'm', 's', 'u'] as const

export type RegexFlag = (typeof FLAG_OPTIONS)[number]

export const MAX_MATCHES = 1000

export interface GroupDetail {
  name: string | null
  value: string | undefined
}

export interface MatchDetail {
  match: string
  index: number
  groups: GroupDetail[]
}

export type RegexTestResult =
  | { ok: true; matches: MatchDetail[]; global: boolean; truncated: boolean }
  | { ok: false; error: string }

function toMatchDetail(match: RegExpExecArray): MatchDetail {
  const groups: GroupDetail[] = []
  for (let i = 1; i < match.length; i += 1) {
    groups.push({ name: null, value: match[i] })
  }
  if (match.groups !== undefined) {
    for (const [name, value] of Object.entries(match.groups)) {
      groups.push({ name, value })
    }
  }
  return { match: match[0], index: match.index, groups }
}

export function testRegex(
  pattern: string,
  flags: readonly RegexFlag[],
  text: string,
): RegexTestResult {
  if (pattern === '') {
    return { ok: false, error: 'Pattern is empty.' }
  }

  const flagString = FLAG_OPTIONS.filter((flag) => flags.includes(flag)).join('')

  let regex: RegExp
  try {
    regex = new RegExp(pattern, flagString)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: `Invalid pattern: ${message}` }
  }

  const matches: MatchDetail[] = []
  let truncated = false

  if (regex.global) {
    // matchAll handles empty matches safely (a manual exec loop can hang on /^/g).
    for (const match of text.matchAll(regex)) {
      if (matches.length >= MAX_MATCHES) {
        truncated = true
        break
      }
      matches.push(toMatchDetail(match))
    }
  } else {
    const match = regex.exec(text)
    if (match !== null) {
      matches.push(toMatchDetail(match))
    }
  }

  return { ok: true, matches, global: regex.global, truncated }
}
