const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const

const UNESCAPE_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
} as const

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char as keyof typeof ESCAPE_MAP])
}

export function unescapeHtml(input: string): string {
  return input.replace(
    /&(?:amp|lt|gt|quot|#39);/g,
    (entity) => UNESCAPE_MAP[entity as keyof typeof UNESCAPE_MAP],
  )
}
