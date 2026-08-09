const ALLOWED_LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isCodeFenceLine(line: string): boolean {
  return /^\s{0,3}```\s*$/.test(line)
}

function parseHeading(line: string): { level: 1 | 2 | 3; text: string } | null {
  const match = /^\s{0,3}(#{1,3})\s+(.+)$/.exec(line)
  if (match === null) {
    return null
  }
  const marks = match[1]!
  const level = marks.length === 2 ? 2 : marks.length === 3 ? 3 : 1
  return { level, text: match[2]! }
}

function isHorizontalRule(line: string): boolean {
  return /^\s{0,3}---\s*$/.test(line)
}

const BLOCKQUOTE_RE = /^\s{0,3}>( ?)(.*)$/

function isQuoteLine(line: string): boolean {
  return BLOCKQUOTE_RE.test(line)
}

function quoteContent(line: string): string {
  const match = BLOCKQUOTE_RE.exec(line)!
  return match[2]!
}

function isUnorderedItem(line: string): boolean {
  return /^-\s/.test(line) || /^\*\s/.test(line)
}

function isOrderedItem(line: string): boolean {
  return /^\d+\.\s/.test(line)
}

function listItemContent(line: string): string {
  return line.slice(2)
}

function orderedItemContent(line: string): string {
  const match = /^\d+\.\s+(.*)$/.exec(line)!
  return match[1]!
}

function startsBlock(line: string): boolean {
  return (
    isCodeFenceLine(line) ||
    parseHeading(line) !== null ||
    isHorizontalRule(line) ||
    isQuoteLine(line) ||
    isUnorderedItem(line) ||
    isOrderedItem(line)
  )
}

function isAllowedLink(url: string): boolean {
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url.trim())
  if (schemeMatch === null) {
    return true
  }
  return ALLOWED_LINK_SCHEMES.has(schemeMatch[1]!.toLowerCase())
}

function parseInline(text: string): string {
  let output = ''
  let index = 0
  while (index < text.length) {
    const char = text.charAt(index)

    if (char === '`') {
      let openRun = 0
      while (text.charAt(index + openRun) === '`') {
        openRun += 1
      }
      let close = -1
      let scan = index + openRun
      while (scan < text.length) {
        if (text.charAt(scan) === '`') {
          let closeRun = 0
          while (text.charAt(scan + closeRun) === '`') {
            closeRun += 1
          }
          if (closeRun === openRun) {
            close = scan
            break
          }
          scan += closeRun
        } else {
          scan += 1
        }
      }
      const content = close === -1 ? '' : text.slice(index + openRun, close)
      if (close === -1 || content === '') {
        output += escapeHtml(text.slice(index, index + openRun))
        index += openRun
        continue
      }
      output += `<code>${escapeHtml(content)}</code>`
      index = close + openRun
      continue
    }

    if (char === '*' && text.charAt(index + 1) === '*') {
      const close = text.indexOf('**', index + 2)
      if (close === -1 || close === index + 2) {
        output += escapeHtml('**')
        index += 2
        continue
      }
      output += `<strong>${parseInline(text.slice(index + 2, close))}</strong>`
      index = close + 2
      continue
    }

    if (char === '*') {
      let close = -1
      for (let scan = index + 1; scan < text.length; scan += 1) {
        if (text.charAt(scan) === '*') {
          if (text.charAt(scan + 1) === '*') {
            scan += 1
            continue
          }
          close = scan
          break
        }
      }
      if (close === -1 || close === index + 1) {
        output += escapeHtml('*')
        index += 1
        continue
      }
      output += `<em>${parseInline(text.slice(index + 1, close))}</em>`
      index = close + 1
      continue
    }

    if (char === '!' && text.charAt(index + 1) === '[') {
      output += escapeHtml('![')
      index += 2
      continue
    }

    if (char === '[') {
      const closeBracket = text.indexOf(']', index + 1)
      if (closeBracket !== -1 && text.charAt(closeBracket + 1) === '(') {
        let depth = 0
        let scan = closeBracket + 2
        let candidateClose = -1
        while (scan < text.length) {
          const current = text.charAt(scan)
          if (current === ' ' || current === '\t' || current === '\n') {
            break
          }
          if (current === ')' && depth === 0) {
            break
          }
          if (current === '(') {
            depth += 1
          } else if (current === ')') {
            depth -= 1
            candidateClose = scan
          }
          scan += 1
        }
        let closeAt = -1
        if (scan < text.length && text.charAt(scan) === ')') {
          closeAt = scan
        } else if (depth === 0 && candidateClose !== -1) {
          closeAt = candidateClose
        }
        if (closeAt !== -1) {
          const label = text.slice(index + 1, closeBracket)
          const url = text.slice(closeBracket + 2, closeAt)
          if (isAllowedLink(url)) {
            output += `<a href="${escapeHtml(url.trim())}">${parseInline(label)}</a>`
            index = closeAt + 1
            continue
          }
        }
      }
      output += escapeHtml('[')
      index += 1
      continue
    }

    output += escapeHtml(char)
    index += 1
  }
  return output
}

export function renderMarkdown(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const blocks: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]!
    if (line.trim() === '') {
      index += 1
      continue
    }

    if (isCodeFenceLine(line)) {
      const content: string[] = []
      index += 1
      while (index < lines.length && !isCodeFenceLine(lines[index]!)) {
        content.push(lines[index]!)
        index += 1
      }
      index += 1
      blocks.push(`<pre><code>${escapeHtml(content.join('\n'))}</code></pre>`)
      continue
    }

    const heading = parseHeading(line)
    if (heading !== null) {
      blocks.push(`<h${heading.level}>${parseInline(heading.text)}</h${heading.level}>`)
      index += 1
      continue
    }

    if (isHorizontalRule(line)) {
      blocks.push('<hr />')
      index += 1
      continue
    }

    if (isQuoteLine(line)) {
      const content: string[] = []
      while (index < lines.length && isQuoteLine(lines[index]!)) {
        content.push(quoteContent(lines[index]!))
        index += 1
      }
      blocks.push(`<blockquote>${parseInline(content.join('\n'))}</blockquote>`)
      continue
    }

    if (isUnorderedItem(line)) {
      const items: string[] = []
      while (index < lines.length && isUnorderedItem(lines[index]!)) {
        items.push(parseInline(listItemContent(lines[index]!)))
        index += 1
      }
      blocks.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`)
      continue
    }

    if (isOrderedItem(line)) {
      const items: string[] = []
      while (index < lines.length && isOrderedItem(lines[index]!)) {
        items.push(parseInline(orderedItemContent(lines[index]!)))
        index += 1
      }
      blocks.push(`<ol>${items.map((item) => `<li>${item}</li>`).join('')}</ol>`)
      continue
    }

    const paragraph: string[] = []
    while (index < lines.length && lines[index]!.trim() !== '' && !startsBlock(lines[index]!)) {
      paragraph.push(lines[index]!)
      index += 1
    }
    blocks.push(`<p>${parseInline(paragraph.join('\n'))}</p>`)
  }
  return blocks.join('\n')
}
