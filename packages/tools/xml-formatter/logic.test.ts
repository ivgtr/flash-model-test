import { describe, expect, it } from 'vitest'
import { DEFAULT_INDENT, INDENT_OPTIONS, formatXml, parseIndent } from './logic'

describe('formatXml', () => {
  it('formats a simple XML document with two-space indentation', () => {
    const result = formatXml('<root><item>one</item><item>two</item></root>')
    expect(result).toEqual({
      ok: true,
      output: ['<root>', '  <item>one</item>', '  <item>two</item>', '</root>'].join('\n'),
    })
  })

  it('formats with four-space indentation', () => {
    const result = formatXml('<a><b><c>x</c></b></a>', 4)
    expect(result).toEqual({
      ok: true,
      output: ['<a>', '    <b>', '        <c>x</c>', '    </b>', '</a>'].join('\n'),
    })
  })

  it('emits self-closing tags for elements without children', () => {
    const result = formatXml('<a><b/><c></c></a>')
    expect(result).toEqual({
      ok: true,
      output: ['<a>', '  <b/>', '  <c/>', '</a>'].join('\n'),
    })
  })

  it('preserves attributes and escapes attribute values', () => {
    const result = formatXml('<a x="a&lt;b&amp;c" y=\'say "hi"\'><b/></a>')
    expect(result).toEqual({
      ok: true,
      output: ['<a x="a&lt;b&amp;c" y="say &quot;hi&quot;">', '  <b/>', '</a>'].join('\n'),
    })
  })

  it('preserves CDATA sections verbatim', () => {
    const result = formatXml('<a><![CDATA[keep <raw> & stuff]]></a>')
    expect(result).toEqual({ ok: true, output: '<a><![CDATA[keep <raw> & stuff]]></a>' })
  })

  it('preserves comments', () => {
    const result = formatXml('<a><!-- hello --><b/></a>')
    expect(result).toEqual({
      ok: true,
      output: ['<a>', '  <!-- hello -->', '  <b/>', '</a>'].join('\n'),
    })
  })

  it('preserves comments outside the root element', () => {
    const result = formatXml('<!-- before --><a/><!-- after -->')
    expect(result).toEqual({
      ok: true,
      output: ['<!-- before -->', '<a/>', '<!-- after -->'].join('\n'),
    })
  })

  it('keeps text-only elements inline', () => {
    const result = formatXml('<root><a>plain text</a><b>line1&#10;line2</b></root>')
    expect(result).toEqual({
      ok: true,
      output: ['<root>', '  <a>plain text</a>', '  <b>line1\nline2</b>', '</root>'].join('\n'),
    })
  })

  it('escapes < and > in text content', () => {
    const result = formatXml('<a>1 &lt; 2 &gt; 1</a>')
    expect(result).toEqual({ ok: true, output: '<a>1 &lt; 2 &gt; 1</a>' })
  })

  it('ignores whitespace-only text nodes between elements', () => {
    const result = formatXml('<a>  <b>x</b>  </a>')
    expect(result).toEqual({
      ok: true,
      output: ['<a>', '  <b>x</b>', '</a>'].join('\n'),
    })
  })

  it('turns elements with only whitespace into self-closing tags', () => {
    const result = formatXml('<a>  </a>')
    expect(result).toEqual({ ok: true, output: '<a/>' })
  })

  it('formats deeply nested XML with correct indentation', () => {
    const result = formatXml('<a><b><c><d>deep</d></c></b></a>', 2)
    expect(result).toEqual({
      ok: true,
      output: ['<a>', '  <b>', '    <c>', '      <d>deep</d>', '    </c>', '  </b>', '</a>'].join(
        '\n',
      ),
    })
  })

  it('preserves mixed text content around child elements', () => {
    const result = formatXml('<p>hello <b>world</b>!</p>')
    expect(result).toEqual({
      ok: true,
      output: ['<p>hello ', '  <b>world</b>', '  !', '</p>'].join('\n'),
    })
  })

  it('reports an error for empty input', () => {
    expect(formatXml('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(formatXml('   \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('reports an error for mismatched closing tags', () => {
    const result = formatXml('<a><b></a>')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid XML: /)
    }
  })

  it('reports an error for an unbound namespace prefix', () => {
    const result = formatXml('<x:foo/>')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid XML: /)
    }
  })

  it('reports an error for multiple root elements', () => {
    const result = formatXml('<a/><b/>')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid XML: /)
    }
  })

  it('reports an error for text outside the root element', () => {
    const result = formatXml('just text')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/^Invalid XML: /)
    }
  })
})

describe('parseIndent', () => {
  it('parses supported indent widths', () => {
    expect(parseIndent('2')).toBe(2)
    expect(parseIndent('4')).toBe(4)
  })

  it('returns null for unsupported values', () => {
    expect(parseIndent('')).toBeNull()
    expect(parseIndent('0')).toBeNull()
    expect(parseIndent('8')).toBeNull()
    expect(parseIndent('two')).toBeNull()
  })

  it('exposes the supported options and the default indent', () => {
    expect(INDENT_OPTIONS).toEqual([2, 4])
    expect(DEFAULT_INDENT).toBe(2)
  })
})
