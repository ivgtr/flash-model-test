import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { evaluateJsonPath, type JsonPathResult } from './logic'
import styles from './Tool.module.css'

export function JsonPathExplorerTool() {
  const [jsonInput, setJsonInput] = useState('')
  const [pathInput, setPathInput] = useState('')
  const [result, setResult] = useState<JsonPathResult | null>(null)

  const handleExplore = () => {
    setResult(evaluateJsonPath(jsonInput, pathInput))
  }

  const handleClear = () => {
    setJsonInput('')
    setPathInput('')
    setResult(null)
  }

  const outputText = result?.ok ? JSON.stringify(result.value, null, 2) : ''

  return (
    <div className={styles.layout}>
      <p className={styles.scopeNote}>
        Supported syntax: <code>$</code> (root), <code>.key</code>, <code>["key"]</code> and{' '}
        <code>[n]</code> (array index). Wildcards (<code>*</code>), recursive descent (
        <code>..</code>), filters (<code>[?(...)]</code>) and slices (<code>[start:end]</code>) are{' '}
        <strong>not supported</strong> and report an error.
      </p>

      <Panel title="Input">
        <textarea
          className="field"
          aria-label="JSON input"
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          placeholder={'{"user": {"name": "Alice", "scores": [9, 8]}}'}
          rows={8}
          spellCheck={false}
        />
        <textarea
          className="field"
          aria-label="JSONPath input"
          value={pathInput}
          onChange={(event) => setPathInput(event.target.value)}
          placeholder={'$.user.scores[0]'}
          rows={2}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleExplore}>Explore</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={jsonInput === '' && pathInput === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={outputText} /> : undefined}>
        {result?.ok ? (
          <div className={styles.result} data-testid="json-path-result">
            <p className={styles.typeRow}>
              <span className={styles.typeLabel}>Type:</span>
              <span className={styles.typeValue} data-testid="json-path-type">
                {result.type}
              </span>
            </p>
            <pre className={styles.output} data-testid="json-path-value">
              {outputText}
            </pre>
          </div>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? (
          <p className="muted">Explore a JSONPath to see the value here.</p>
        ) : null}
      </Panel>
    </div>
  )
}
