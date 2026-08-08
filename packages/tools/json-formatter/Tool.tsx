import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_INDENT,
  INDENT_OPTIONS,
  formatJson,
  parseIndent,
  type IndentOption,
  type JsonFormatResult,
} from './logic'
import styles from './Tool.module.css'

export function JsonFormatterTool() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<IndentOption>(DEFAULT_INDENT)
  const [result, setResult] = useState<JsonFormatResult | null>(null)

  const handleIndentChange = (value: string) => {
    const parsed = parseIndent(value)
    if (parsed !== null) {
      setIndent(parsed)
    }
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
          aria-label="JSON input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"hello": "world"}'
          rows={10}
          spellCheck={false}
        />
        <label className={styles.indentRow}>
          <span>Indent</span>
          <select
            className="field"
            value={indent}
            onChange={(event) => handleIndentChange(event.target.value)}
          >
            {INDENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 0 ? 'Minified' : `${option} spaces`}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(formatJson(input, indent))}>Format</Button>
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
          <pre className={styles.output} data-testid="json-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Formatted JSON will appear here.</p> : null}
      </Panel>
    </div>
  )
}
