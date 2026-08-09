import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { computeLineDiff, renderUnifiedDiff, type DiffLineType, type DiffResult } from './logic'
import styles from './Tool.module.css'

const MARKERS: Record<DiffLineType, string> = {
  add: '+',
  remove: '-',
  same: ' ',
}

export function TextDiffTool() {
  const [original, setOriginal] = useState('')
  const [changed, setChanged] = useState('')
  const [result, setResult] = useState<DiffResult | null>(null)

  const handleDiff = () => {
    setResult(computeLineDiff(original, changed))
  }

  const handleClear = () => {
    setOriginal('')
    setChanged('')
    setResult(null)
  }

  const unifiedText = result?.ok ? renderUnifiedDiff(result.lines) : ''

  return (
    <div className={styles.layout}>
      <div className={styles.inputs}>
        <Panel title="Original">
          <textarea
            className="field"
            aria-label="Original text"
            value={original}
            onChange={(event) => setOriginal(event.target.value)}
            placeholder={'alpha\nbeta\ngamma'}
            rows={10}
            spellCheck={false}
          />
        </Panel>
        <Panel title="Changed">
          <textarea
            className="field"
            aria-label="Changed text"
            value={changed}
            onChange={(event) => setChanged(event.target.value)}
            placeholder={'alpha\nBETA\ngamma'}
            rows={10}
            spellCheck={false}
          />
        </Panel>
      </div>

      <ActionArea>
        <Button onClick={handleDiff}>Diff</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={original === '' && changed === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={unifiedText} /> : undefined}>
        {result?.ok ? (
          <div data-testid="text-diff-output">
            <p className={styles.summary} data-testid="diff-summary">
              Added: {result.added}, Removed: {result.removed}
            </p>
            <ul className={styles.diffList}>
              {result.lines.map((line, index) => (
                <li
                  key={index}
                  className={`${styles.line} ${styles[line.type]}`}
                  data-testid="diff-line"
                  data-type={line.type}
                >
                  <span className={styles.marker} data-testid="diff-marker" aria-hidden="true">
                    {MARKERS[line.type]}
                  </span>
                  <span className={styles.text} data-testid="diff-line-text">
                    {line.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Diff will appear here.</p> : null}
      </Panel>
    </div>
  )
}
