import { describe, expect, it } from 'vitest'
import { escapeHtml, unescapeHtml } from './logic'

describe('escapeHtml', () => {
  it('escapes all five special characters', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('escapes special characters mixed with regular text', () => {
    expect(escapeHtml('<a href="https://example.com" title="Tom & Jerry">')).toBe(
      '&lt;a href=&quot;https://example.com&quot; title=&quot;Tom &amp; Jerry&quot;&gt;',
    )
  })

  it('turns & into &amp; first without double escaping', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes a literal entity string to a doubled form', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('returns an empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('passes non-ASCII characters through unchanged', () => {
    expect(escapeHtml('こんにちは 世界 🌍')).toBe('こんにちは 世界 🌍')
  })
})

describe('unescapeHtml', () => {
  it('unescapes all five entities', () => {
    expect(unescapeHtml('&amp;&lt;&gt;&quot;&#39;')).toBe('&<>"\'')
  })

  it('round-trips escaped text back to the original', () => {
    const input = '<p class="note">Tom & Jerry\'s</p>'
    expect(unescapeHtml(escapeHtml(input))).toBe(input)
  })

  it('returns an empty string for empty input', () => {
    expect(unescapeHtml('')).toBe('')
  })

  it('decodes &amp;amp; to &amp; in a single pass', () => {
    expect(unescapeHtml('&amp;amp;')).toBe('&amp;')
  })

  it('keeps unknown entities such as &foo; unchanged', () => {
    expect(unescapeHtml('&foo;')).toBe('&foo;')
    expect(unescapeHtml('&amp;foo;')).toBe('&foo;')
  })

  it('passes text without entities through unchanged', () => {
    expect(unescapeHtml('plain text 123')).toBe('plain text 123')
  })
})
