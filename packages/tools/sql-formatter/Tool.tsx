import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { formatSql, type SqlFormatResult } from './logic'
import styles from './Tool.module.css'

export function SqlFormatterTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<SqlFormatResult | null>(null)

  const handleFormat = () => {
    setResult(formatSql(input))
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
          aria-label="SQL input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'SELECT id, name FROM users\nWHERE id = 1'}
          rows={10}
          spellCheck={false}
        />
        <p className="muted">
          Lightweight formatter — not a full SQL parser. String literals and comments are preserved
          as-is.
        </p>
      </Panel>

      <ActionArea>
        <Button onClick={handleFormat}>Format</Button>
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
          <pre className={styles.output} data-testid="sql-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Formatted SQL will appear here.</p> : null}
      </Panel>
    </div>
  )
}
