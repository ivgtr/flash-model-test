import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './logic'

describe('renderMarkdown: headings', () => {
  it('renders h1, h2, and h3 headings', () => {
    expect(renderMarkdown('# Title\n## Sub\n### Subsub')).toBe(
      '<h1>Title</h1>\n<h2>Sub</h2>\n<h3>Subsub</h3>',
    )
  })

  it('parses inline formatting inside heading text', () => {
    expect(renderMarkdown('# Hello **world**')).toBe('<h1>Hello <strong>world</strong></h1>')
  })

  it('treats a lone hash and four-plus hashes as literal text', () => {
    expect(renderMarkdown('#\n\n#### not a heading\n\n#no space')).toBe(
      '<p>#</p>\n<p>#### not a heading</p>\n<p>#no space</p>',
    )
  })
})

describe('renderMarkdown: emphasis', () => {
  it('renders bold, italic, and nested emphasis', () => {
    expect(renderMarkdown('**bold** *italic*')).toBe('<p><strong>bold</strong> <em>italic</em></p>')
    expect(renderMarkdown('**a *b* c**')).toBe('<p><strong>a <em>b</em> c</strong></p>')
    expect(renderMarkdown('*a **b** c*')).toBe('<p><em>a <strong>b</strong> c</em></p>')
  })

  it('treats unterminated emphasis as literal text', () => {
    expect(renderMarkdown('**open *stray')).toBe('<p>**open *stray</p>')
  })

  it('treats an italic-only line as a paragraph, not a list', () => {
    expect(renderMarkdown('*italic*')).toBe('<p><em>italic</em></p>')
  })
})

describe('renderMarkdown: inline code', () => {
  it('renders inline code and does not interpret its content', () => {
    expect(renderMarkdown('`*a*` and `b`')).toBe('<p><code>*a*</code> and <code>b</code></p>')
    expect(renderMarkdown('`**not bold**`')).toBe('<p><code>**not bold**</code></p>')
  })

  it('allows a literal backtick inside code using a longer delimiter run', () => {
    expect(renderMarkdown('``a`b``')).toBe('<p><code>a`b</code></p>')
  })

  it('treats an unterminated backtick as literal text', () => {
    expect(renderMarkdown('an `unclosed')).toBe('<p>an `unclosed</p>')
  })
})

describe('renderMarkdown: links', () => {
  it('renders links with balanced parentheses inside the URL', () => {
    expect(renderMarkdown('[Docs](https://example.com/a_(b)')).toBe(
      '<p><a href="https://example.com/a_(b">Docs</a></p>',
    )
  })

  it('parses inline formatting inside link text', () => {
    expect(renderMarkdown('[**bold** text](https://example.com)')).toBe(
      '<p><a href="https://example.com"><strong>bold</strong> text</a></p>',
    )
  })

  it('escapes special characters in the href', () => {
    expect(renderMarkdown('[x](https://a.com/?q=1&b=2)')).toBe(
      '<p><a href="https://a.com/?q=1&amp;b=2">x</a></p>',
    )
  })

  it('rejects unsafe link schemes by rendering them as literal text', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).toBe('<p>[x](javascript:alert(1))</p>')
    expect(renderMarkdown('[x](JaVaScRiPt:alert(1))')).toBe('<p>[x](JaVaScRiPt:alert(1))</p>')
  })

  it('treats malformed link syntax as literal text', () => {
    expect(renderMarkdown('[text](https://example.com')).toBe('<p>[text](https://example.com</p>')
    expect(renderMarkdown('[text] https://example.com')).toBe('<p>[text] https://example.com</p>')
  })
})

describe('renderMarkdown: code blocks', () => {
  it('renders fenced code blocks', () => {
    expect(renderMarkdown('```\nline1\nline2\n```')).toBe('<pre><code>line1\nline2</code></pre>')
  })

  it('escapes content inside code blocks and does not parse markdown', () => {
    expect(
      renderMarkdown('```\n# not a heading\n<script>alert(1)</script>\n**not bold**\n```'),
    ).toBe(
      '<pre><code># not a heading\n&lt;script&gt;alert(1)&lt;/script&gt;\n**not bold**</code></pre>',
    )
  })

  it('treats an unclosed code fence as code to the end of input', () => {
    expect(renderMarkdown('```\na\nb')).toBe('<pre><code>a\nb</code></pre>')
    expect(renderMarkdown('```')).toBe('<pre><code></code></pre>')
  })
})

describe('renderMarkdown: lists', () => {
  it('renders unordered lists with - and * markers', () => {
    expect(renderMarkdown('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>')
    expect(renderMarkdown('* x')).toBe('<ul><li>x</li></ul>')
    expect(renderMarkdown('- a\n* b')).toBe('<ul><li>a</li><li>b</li></ul>')
  })

  it('renders ordered lists', () => {
    expect(renderMarkdown('1. first\n2. second')).toBe('<ol><li>first</li><li>second</li></ol>')
  })

  it('treats deeply indented list items as literal text', () => {
    expect(renderMarkdown('- a\n  - b\n- c')).toBe(
      '<ul><li>a</li></ul>\n<p>  - b</p>\n<ul><li>c</li></ul>',
    )
  })

  it('parses inline formatting inside list items', () => {
    expect(renderMarkdown('- **bold** item')).toBe('<ul><li><strong>bold</strong> item</li></ul>')
  })

  it('treats a marker without a following space as literal text', () => {
    expect(renderMarkdown('-no-space')).toBe('<p>-no-space</p>')
  })
})

describe('renderMarkdown: blockquote and horizontal rule', () => {
  it('renders blockquotes with inline formatting', () => {
    expect(renderMarkdown('> quoted **text**')).toBe(
      '<blockquote>quoted <strong>text</strong></blockquote>',
    )
  })

  it('groups consecutive blockquote lines into one blockquote', () => {
    expect(renderMarkdown('> a\n> b')).toBe('<blockquote>a\nb</blockquote>')
  })

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toBe('<hr />')
    expect(renderMarkdown('   ---   ')).toBe('<hr />')
  })

  it('breaks a paragraph before a horizontal rule', () => {
    expect(renderMarkdown('some text\n---\nmore')).toBe('<p>some text</p>\n<hr />\n<p>more</p>')
  })
})

describe('renderMarkdown: paragraphs', () => {
  it('groups consecutive lines into a single paragraph', () => {
    expect(renderMarkdown('line one\nline two')).toBe('<p>line one\nline two</p>')
  })

  it('splits paragraphs on blank lines', () => {
    expect(renderMarkdown('a\n\nb')).toBe('<p>a</p>\n<p>b</p>')
  })

  it('handles CRLF line endings', () => {
    expect(renderMarkdown('# Hi\r\n\r\n- a\r\n- b')).toBe(
      '<h1>Hi</h1>\n<ul><li>a</li><li>b</li></ul>',
    )
  })

  it('renders a full mixed document', () => {
    const input = [
      '# Title',
      '',
      'Some **bold** and *italic* text with `code` and a [link](https://example.com).',
      '',
      '- one',
      '- two',
      '',
      '> quoted line',
      '',
      '---',
      '',
      '1. first',
      '2. second',
    ].join('\n')
    expect(renderMarkdown(input)).toBe(
      [
        '<h1>Title</h1>',
        '<p>Some <strong>bold</strong> and <em>italic</em> text with <code>code</code> and a <a href="https://example.com">link</a>.</p>',
        '<ul><li>one</li><li>two</li></ul>',
        '<blockquote>quoted line</blockquote>',
        '<hr />',
        '<ol><li>first</li><li>second</li></ol>',
      ].join('\n'),
    )
  })
})

describe('renderMarkdown: out-of-scope syntax is literal', () => {
  it('renders tables as literal text', () => {
    expect(renderMarkdown('| a | b |\n| --- | --- |')).toBe('<p>| a | b |\n| --- | --- |</p>')
  })

  it('renders images as literal text', () => {
    expect(renderMarkdown('![alt](https://example.com/img.png)')).toBe(
      '<p>![alt](https://example.com/img.png)</p>',
    )
  })

  it('renders raw HTML as escaped literal text', () => {
    expect(renderMarkdown('<div onclick="x">hello</div>')).toBe(
      '<p>&lt;div onclick=&quot;x&quot;&gt;hello&lt;/div&gt;</p>',
    )
  })

  it('renders definition-list style lines as literal text', () => {
    expect(renderMarkdown('term\n: definition')).toBe('<p>term\n: definition</p>')
  })
})

describe('renderMarkdown: HTML escaping', () => {
  it('escapes angle brackets and ampersands in text', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    )
  })

  it('escapes quotes in text', () => {
    expect(renderMarkdown('& < > " \'')).toBe('<p>&amp; &lt; &gt; &quot; &#39;</p>')
  })
})

describe('renderMarkdown: empty input', () => {
  it('renders an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('renders an empty string for whitespace-only input', () => {
    expect(renderMarkdown('  \n\t \n  ')).toBe('')
  })
})
