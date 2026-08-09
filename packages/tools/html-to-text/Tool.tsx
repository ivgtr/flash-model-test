import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { convertHtmlToText, type HtmlToTextResult } from './logic'
import styles from './Tool.module.css'

export function HtmlToTextTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<HtmlToTextResult | null>(null)

  const handleConvert = () => {
    setResult(convertHtmlToText(input))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="HTML input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'<p>Hello <b>world</b></p>'}
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>Convert</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <pre className={styles.output} data-testid="html-to-text-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Plain text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
