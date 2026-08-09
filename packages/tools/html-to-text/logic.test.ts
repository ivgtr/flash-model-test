import { describe, expect, it } from 'vitest'
import { convertHtmlToText } from './logic'

describe('convertHtmlToText', () => {
  it('extracts text from simple HTML', () => {
    expect(convertHtmlToText('<p>Hello, world!</p>')).toEqual({ ok: true, output: 'Hello, world!' })
    expect(convertHtmlToText('<b>bold</b> and <i>italic</i>')).toEqual({
      ok: true,
      output: 'bold and italic',
    })
    expect(convertHtmlToText('<a href="https://example.com">example</a>')).toEqual({
      ok: true,
      output: 'example',
    })
  })

  it('inserts newlines at block element boundaries', () => {
    expect(convertHtmlToText('<p>First</p><p>Second</p>')).toEqual({
      ok: true,
      output: 'First\nSecond',
    })
    expect(convertHtmlToText('<h1>Title</h1><h2>Subtitle</h2>')).toEqual({
      ok: true,
      output: 'Title\nSubtitle',
    })
    expect(convertHtmlToText('<div>One</div><div>Two</div>')).toEqual({
      ok: true,
      output: 'One\nTwo',
    })
    expect(convertHtmlToText('<ul><li>One</li><li>Two</li></ul>')).toEqual({
      ok: true,
      output: 'One\nTwo',
    })
    expect(convertHtmlToText('<blockquote>Quote</blockquote><section>Body</section>')).toEqual({
      ok: true,
      output: 'Quote\nBody',
    })
  })

  it('treats br elements as newlines', () => {
    expect(convertHtmlToText('<p>Line 1<br>Line 2</p>')).toEqual({
      ok: true,
      output: 'Line 1\nLine 2',
    })
    expect(convertHtmlToText('a<br><br>b')).toEqual({ ok: true, output: 'a\nb' })
  })

  it('excludes script and style content', () => {
    expect(
      convertHtmlToText('<p>Hello</p><script>alert("x")</script><style>p { color: red }</style>'),
    ).toEqual({ ok: true, output: 'Hello' })
    expect(convertHtmlToText('<style>.a{}</style>')).toEqual({ ok: true, output: '' })
  })

  it('excludes noscript and template content', () => {
    expect(convertHtmlToText('<noscript>No JS</noscript><template>tpl</template>')).toEqual({
      ok: true,
      output: '',
    })
    expect(convertHtmlToText('<p>a</p><noscript>No JS</noscript><template>tpl</template>')).toEqual(
      {
        ok: true,
        output: 'a',
      },
    )
  })

  it('decodes HTML entities via the DOM parser', () => {
    expect(convertHtmlToText('<p>&amp; &lt; &gt; &quot; &#39;</p>')).toEqual({
      ok: true,
      output: '& < > " \'',
    })
    expect(convertHtmlToText('<p>a&nbsp;&nbsp;b</p>')).toEqual({ ok: true, output: 'a b' })
  })

  it('collapses whitespace runs into a single space', () => {
    expect(convertHtmlToText('<p>a    b   c</p>')).toEqual({ ok: true, output: 'a b c' })
    expect(convertHtmlToText('<p>  leading and trailing  </p>')).toEqual({
      ok: true,
      output: 'leading and trailing',
    })
    expect(convertHtmlToText('line1\n  line2\t\tline3')).toEqual({
      ok: true,
      output: 'line1 line2 line3',
    })
  })

  it('preserves whitespace inside pre elements', () => {
    expect(convertHtmlToText('<pre>a    b\n  c</pre>')).toEqual({ ok: true, output: 'a    b\n  c' })
    expect(convertHtmlToText('<pre>  padded  </pre>')).toEqual({ ok: true, output: '  padded  ' })
  })

  it('preserves whitespace inside code elements', () => {
    expect(convertHtmlToText('<p>Use <code>foo    bar</code> here</p>')).toEqual({
      ok: true,
      output: 'Use foo    bar here',
    })
  })

  it('reports an error for empty input', () => {
    expect(convertHtmlToText('')).toEqual({ ok: false, error: 'Input is empty.' })
    expect(convertHtmlToText('   \n\t ')).toEqual({ ok: false, error: 'Input is empty.' })
  })

  it('returns plain text input unchanged', () => {
    expect(convertHtmlToText('Hello, world')).toEqual({ ok: true, output: 'Hello, world' })
    expect(convertHtmlToText('a + b < c && d')).toEqual({ ok: true, output: 'a + b < c && d' })
  })

  it('returns an empty string for tag-only HTML with no text', () => {
    expect(convertHtmlToText('<div><p></p></div>')).toEqual({ ok: true, output: '' })
    expect(convertHtmlToText('<span></span>')).toEqual({ ok: true, output: '' })
  })

  it('returns an empty string for script-only input without an error', () => {
    expect(convertHtmlToText('<script>const x = 1</script>')).toEqual({ ok: true, output: '' })
  })

  it('leaves no trace of void elements like img and input', () => {
    expect(convertHtmlToText('<p>pic: <img src="a.png" alt="A picture"> done</p>')).toEqual({
      ok: true,
      output: 'pic:  done',
    })
    expect(convertHtmlToText('<input type="text" value="secret">')).toEqual({
      ok: true,
      output: '',
    })
  })

  it('tolerates malformed HTML without reporting an error', () => {
    expect(convertHtmlToText('<p>unclosed<b>strong</p>')).toEqual({
      ok: true,
      output: 'unclosedstrong',
    })
    expect(convertHtmlToText('<div>a<div>b')).toEqual({ ok: true, output: 'a\nb' })
  })
})
