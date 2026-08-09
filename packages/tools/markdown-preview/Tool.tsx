import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { renderMarkdown } from './logic'
import styles from './Tool.module.css'

export function MarkdownPreviewTool() {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const handleRender = () => {
    setPreview(renderMarkdown(input))
  }

  const handleClear = () => {
    setInput('')
    setPreview(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Markdown input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'# Title\n\n**bold** and *italic*, `code`\n\n- item 1\n- item 2'}
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleRender}>Render</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && preview === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={preview !== null ? <CopyButton value={preview} label="Copy HTML" /> : undefined}
      >
        {preview !== null ? (
          <div className={styles.preview} data-testid="markdown-preview">
            {preview === '' ? (
              <p className="muted">Nothing to preview.</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            )}
          </div>
        ) : (
          <p className="muted">Rendered HTML will appear here.</p>
        )}
        <p className={styles.note} data-testid="supported-subset">
          This tool renders a Markdown subset: h1-h3 headings (#, ##, ###), bold (**text**), italic
          (*text*), inline code (`code`), fenced code blocks (```), links ([text](url)), unordered
          lists (- / *), ordered lists (1. / 2.), blockquotes (&gt;), horizontal rules (---), and
          paragraphs. Other syntax such as tables, images, nested lists, and raw HTML is shown as
          literal text.
        </p>
      </Panel>
    </div>
  )
}
