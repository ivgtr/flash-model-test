import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status, useToolUrlState } from '@tool-forge/ui'
import { INDENT_OPTIONS, formatJson, parseIndent, type JsonFormatResult } from './logic'
import { jsonFormatterStateCodec } from './state'
import styles from './Tool.module.css'

export function JsonFormatterTool() {
  const { state, setState, shareUrl, restored } = useToolUrlState(jsonFormatterStateCodec)
  const [result, setResult] = useState<JsonFormatResult | null>(() =>
    restored && state.input.trim() !== '' ? formatJson(state.input, state.indent) : null,
  )

  const handleIndentChange = (value: string) => {
    const parsed = parseIndent(value)
    if (parsed !== null) {
      setState((prev) => ({ ...prev, indent: parsed }))
    }
  }

  const handleClear = () => {
    setState((prev) => ({ ...prev, input: '' }))
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="JSON input"
          value={state.input}
          onChange={(event) => setState((prev) => ({ ...prev, input: event.target.value }))}
          placeholder='{"hello": "world"}'
          rows={10}
          spellCheck={false}
        />
        <label className={styles.indentRow}>
          <span>Indent</span>
          <select
            className="field"
            value={state.indent}
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
        <Button onClick={() => setResult(formatJson(state.input, state.indent))}>Format</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={state.input === '' && result === null}
        >
          Clear
        </Button>
        <CopyButton value={shareUrl} label="Share" />
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
