import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { jsonToQueryString, type JsonToQueryStringResult } from './logic'
import styles from './Tool.module.css'

export function JsonToQueryStringTool() {
  const [input, setInput] = useState('')
  const [leadingQuestionMark, setLeadingQuestionMark] = useState(false)
  const [result, setResult] = useState<JsonToQueryStringResult | null>(null)

  const handleConvert = () => {
    setResult(jsonToQueryString(input, leadingQuestionMark))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.optionRow}>
          <input
            type="checkbox"
            checked={leadingQuestionMark}
            onChange={(event) => setLeadingQuestionMark(event.target.checked)}
          />
          <span>Prepend leading ?</span>
        </label>
        <textarea
          className="field"
          aria-label="JSON input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'{"name":"Alice","tags":["a","b"]}'}
          rows={8}
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
          <pre className={styles.output} data-testid="query-string-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Query string will appear here.</p> : null}
      </Panel>
    </div>
  )
}
