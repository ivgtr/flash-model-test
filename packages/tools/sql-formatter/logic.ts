export type SqlFormatResult = { ok: true; output: string } | { ok: false; error: string }

export const KEYWORDS: readonly string[] = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'ON',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'LIKE',
  'BETWEEN',
  'EXISTS',
  'UNION',
  'INSERT',
  'INTO',
  'VALUES',
  'SET',
  'DELETE',
  'UPDATE',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
]

const KEYWORD_SET = new Set(KEYWORDS)

const CLAUSE_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'ON',
  'UNION',
  'INSERT',
  'VALUES',
  'SET',
  'DELETE',
  'UPDATE',
])

const JOIN_MODIFIERS = new Set(['INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS'])

const STATEMENT_STARTERS = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE'])

const LIST_CONTEXTS = new Set(['select', 'from', 'values'])

const INLINE_WORDS = new Set(['BY', 'INTO'])

type Token =
  | { type: 'word'; value: string }
  | { type: 'symbol'; value: string }
  | { type: 'string'; value: string }
  | { type: 'comment'; value: string }

type TokenizeResult = { ok: true; tokens: Token[] } | { ok: false; error: string }

type SplitResult = { ok: true; statements: Token[][] } | { ok: false; error: string }

type ClauseContext = 'select' | 'from' | 'values' | 'other'

type ParenFrame = {
  subquery: boolean
  closeIndent: number
  savedContext: ClauseContext
  savedSplitDepth: number
  savedBodyIndent: number
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\r' || char === '\n'
}

function isSymbol(char: string): boolean {
  return char === '(' || char === ')' || char === ',' || char === ';'
}

function scanString(
  input: string,
  start: number,
  quote: string,
): { ok: true; value: string; next: number } | { ok: false; error: string } {
  let index = start + 1
  const length = input.length
  while (index < length) {
    const char = input.charAt(index)
    if (char === quote) {
      if (input.charAt(index + 1) === quote) {
        index += 2
        continue
      }
      return { ok: true, value: input.slice(start, index + 1), next: index + 1 }
    }
    if (char === '\\') {
      index += 2
      continue
    }
    index += 1
  }
  return { ok: false, error: 'Unterminated string literal.' }
}

function scanLineComment(input: string, start: number): { value: string; next: number } {
  let index = start
  const length = input.length
  while (index < length && input.charAt(index) !== '\n' && input.charAt(index) !== '\r') {
    index += 1
  }
  return { value: input.slice(start, index), next: index }
}

function scanBlockComment(
  input: string,
  start: number,
): { ok: true; value: string; next: number } | { ok: false; error: string } {
  let index = start + 2
  const length = input.length
  while (index + 1 < length) {
    if (input.charAt(index) === '*' && input.charAt(index + 1) === '/') {
      return { ok: true, value: input.slice(start, index + 2), next: index + 2 }
    }
    index += 1
  }
  return { ok: false, error: 'Unterminated block comment.' }
}

function scanWord(input: string, start: number): { value: string; next: number } {
  let index = start
  const length = input.length
  while (index < length) {
    const char = input.charAt(index)
    if (isWhitespace(char) || isSymbol(char) || char === "'" || char === '"') {
      break
    }
    if (char === '-' && input.charAt(index + 1) === '-') {
      break
    }
    if (char === '/' && input.charAt(index + 1) === '*') {
      break
    }
    index += 1
  }
  return { value: input.slice(start, index), next: index }
}

function tokenize(input: string): TokenizeResult {
  const tokens: Token[] = []
  let index = 0
  const length = input.length
  while (index < length) {
    const char = input.charAt(index)
    if (isWhitespace(char)) {
      index += 1
      continue
    }
    if (char === "'" || char === '"') {
      const scanned = scanString(input, index, char)
      if (!scanned.ok) {
        return scanned
      }
      tokens.push({ type: 'string', value: scanned.value })
      index = scanned.next
      continue
    }
    if (char === '-' && input.charAt(index + 1) === '-') {
      const comment = scanLineComment(input, index)
      tokens.push({ type: 'comment', value: comment.value })
      index = comment.next
      continue
    }
    if (char === '/' && input.charAt(index + 1) === '*') {
      const comment = scanBlockComment(input, index)
      if (!comment.ok) {
        return comment
      }
      tokens.push({ type: 'comment', value: comment.value })
      index = comment.next
      continue
    }
    if (isSymbol(char)) {
      tokens.push({ type: 'symbol', value: char })
      index += 1
      continue
    }
    const word = scanWord(input, index)
    tokens.push({ type: 'word', value: word.value })
    index = word.next
  }
  return { ok: true, tokens }
}

function splitStatements(tokens: readonly Token[]): SplitResult {
  const statements: Token[][] = []
  let current: Token[] = []
  let depth = 0
  for (const token of tokens) {
    if (token.type === 'symbol') {
      if (token.value === '(') {
        depth += 1
      } else if (token.value === ')') {
        depth -= 1
        if (depth < 0) {
          return { ok: false, error: 'Unexpected closing parenthesis.' }
        }
      } else if (token.value === ';' && depth === 0) {
        current.push(token)
        statements.push(current)
        current = []
        continue
      }
    }
    current.push(token)
  }
  if (depth > 0) {
    return { ok: false, error: 'Unclosed parenthesis.' }
  }
  if (current.length > 0) {
    statements.push(current)
  }
  return { ok: true, statements }
}

function nextMeaningfulIndex(tokens: readonly Token[], from: number): number {
  let index = from
  while (index < tokens.length && tokens[index]?.type === 'comment') {
    index += 1
  }
  return index
}

function spaceBefore(token: Token, prevToken: Token | null): boolean {
  if (prevToken === null) {
    return false
  }
  if (token.type === 'symbol') {
    if (token.value === ')' || token.value === ',' || token.value === ';') {
      return false
    }
    if (token.value === '(') {
      if (prevToken.type === 'symbol') {
        return prevToken.value === ','
      }
      if (prevToken.type === 'word') {
        return KEYWORD_SET.has(prevToken.value.toUpperCase())
      }
      return false
    }
  }
  if (prevToken.type === 'symbol' && prevToken.value === '(') {
    return false
  }
  return true
}

function formatStatement(tokens: readonly Token[]): string {
  const lines: string[] = []
  let cur = ''
  let curIndent = 0
  let bodyIndent = 2
  let nextLineIndent: number | null = null
  let context: ClauseContext = 'other'
  let splitDepth = 0
  let lastWasJoinModifier = false
  let prevWord: string | null = null
  let prevToken: Token | null = null
  const parenStack: ParenFrame[] = []

  const flush = (): void => {
    if (cur !== '') {
      lines.push(' '.repeat(curIndent) + cur)
      cur = ''
    }
  }

  const startLine = (indent: number): void => {
    flush()
    curIndent = indent
  }

  const append = (text: string, withSpace: boolean): void => {
    if (withSpace && cur !== '') {
      cur += ' '
    }
    cur += text
  }

  const emit = (token: Token): void => {
    if (nextLineIndent !== null) {
      startLine(nextLineIndent)
      nextLineIndent = null
    }
    append(token.value, spaceBefore(token, prevToken))
  }

  const clauseIndent = (): number => {
    const top = parenStack[parenStack.length - 1]
    if (top !== undefined && top.subquery) {
      return top.closeIndent + 2
    }
    return 0
  }

  const listContext = (upper: string): ClauseContext => {
    if (upper === 'SELECT') {
      return 'select'
    }
    if (upper === 'FROM') {
      return 'from'
    }
    if (upper === 'VALUES') {
      return 'values'
    }
    return 'other'
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!

    if (token.type === 'symbol') {
      const symbol = token.value
      if (symbol === '(') {
        const nextIndex = nextMeaningfulIndex(tokens, index + 1)
        const next = tokens[nextIndex]
        const isSubquery = next?.type === 'word' && STATEMENT_STARTERS.has(next.value.toUpperCase())
        parenStack.push({
          subquery: isSubquery,
          closeIndent: curIndent,
          savedContext: context,
          savedSplitDepth: splitDepth,
          savedBodyIndent: bodyIndent,
        })
        if (!isSubquery) {
          context = 'other'
        }
        emit(token)
      } else if (symbol === ')') {
        const frame = parenStack.pop()!
        if (frame.subquery) {
          startLine(frame.closeIndent)
        }
        append(symbol, spaceBefore(token, prevToken))
        context = frame.savedContext
        splitDepth = frame.savedSplitDepth
        bodyIndent = frame.savedBodyIndent
      } else if (symbol === ',') {
        emit(token)
        if (LIST_CONTEXTS.has(context) && parenStack.length === splitDepth) {
          nextLineIndent = bodyIndent
          flush()
        }
      } else {
        emit(token)
      }
      prevToken = token
      continue
    }

    if (token.type === 'word') {
      const upper = token.value.toUpperCase()
      const isKeyword = KEYWORD_SET.has(upper)
      const word = isKeyword ? upper : token.value

      if (isKeyword && upper === 'FROM' && prevWord === 'DELETE') {
        append('FROM', true)
        prevWord = upper
        prevToken = token
        continue
      }

      if (isKeyword && INLINE_WORDS.has(upper) && nextLineIndent !== null) {
        append(word, true)
        prevWord = upper
        prevToken = token
        continue
      }

      if (isKeyword && JOIN_MODIFIERS.has(upper)) {
        const nextIndex = nextMeaningfulIndex(tokens, index + 1)
        const next = tokens[nextIndex]
        const followedByJoin = next?.type === 'word' && next.value.toUpperCase() === 'JOIN'
        if (followedByJoin) {
          startLine(curIndent)
          append(upper, false)
          lastWasJoinModifier = true
          context = 'other'
        } else {
          emit(token)
        }
        prevWord = upper
        prevToken = token
        continue
      }

      if (isKeyword && upper === 'JOIN') {
        if (lastWasJoinModifier) {
          append('JOIN', true)
          lastWasJoinModifier = false
        } else {
          startLine(curIndent)
          append('JOIN', false)
        }
        context = 'other'
        prevWord = upper
        prevToken = token
        continue
      }

      if (isKeyword && upper === 'ON') {
        startLine(curIndent)
        append('ON', false)
        context = 'other'
        prevWord = upper
        prevToken = token
        continue
      }

      if (isKeyword && CLAUSE_KEYWORDS.has(upper)) {
        const indent = clauseIndent()
        startLine(indent)
        append(upper, false)
        if (upper === 'LIMIT' || upper === 'OFFSET' || upper === 'UNION') {
          nextLineIndent = null
        } else {
          nextLineIndent = indent + 2
        }
        bodyIndent = indent + 2
        context = listContext(upper)
        splitDepth = parenStack.length
        prevWord = upper
        prevToken = token
        continue
      }

      emit({ ...token, value: word })
      prevWord = isKeyword ? upper : word
      prevToken = token
      continue
    }

    emit(token)
    prevToken = token
  }

  flush()
  return lines.join('\n')
}

export function formatSql(input: string): SqlFormatResult {
  if (input.trim() === '') {
    return { ok: false, error: 'Input is empty.' }
  }
  const tokens = tokenize(input)
  if (!tokens.ok) {
    return tokens
  }
  const statements = splitStatements(tokens.tokens)
  if (!statements.ok) {
    return statements
  }
  const meaningful = statements.statements.filter((statement) =>
    statement.some((token) => !(token.type === 'symbol' && token.value === ';')),
  )
  if (meaningful.length === 0) {
    return { ok: false, error: 'Input is empty.' }
  }
  return { ok: true, output: meaningful.map(formatStatement).join('\n') }
}
