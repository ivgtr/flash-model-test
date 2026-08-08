import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_CASE,
  MAX_COUNT,
  MIN_COUNT,
  generateUuids,
  parseCount,
  type UuidCase,
} from './logic'
import styles from './Tool.module.css'

export function UuidGeneratorTool() {
  const [countInput, setCountInput] = useState('1')
  const [uuidCase, setUuidCase] = useState<UuidCase>(DEFAULT_CASE)
  const [uuids, setUuids] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    const count = parseCount(countInput)
    if (count === null) {
      setError(`Count must be an integer between ${MIN_COUNT} and ${MAX_COUNT}.`)
      setUuids(null)
      return
    }
    const result = generateUuids(count, uuidCase)
    if (result.ok) {
      setUuids(result.uuids)
      setError(null)
    } else {
      setError(result.error)
      setUuids(null)
    }
  }

  const handleClear = () => {
    setCountInput('1')
    setUuids(null)
    setError(null)
  }

  const hasOutput = uuids !== null || error !== null

  return (
    <div className={styles.layout}>
      <Panel title="Options">
        <label className={styles.row}>
          <span>Count</span>
          <input
            className="field"
            aria-label="Count"
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={countInput}
            onChange={(event) => setCountInput(event.target.value)}
          />
        </label>
        <label className={styles.row}>
          <span>Case</span>
          <select
            className="field"
            aria-label="Case"
            value={uuidCase}
            onChange={(event) => setUuidCase(event.target.value as UuidCase)}
          >
            <option value="lower">Lowercase</option>
            <option value="upper">Uppercase</option>
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleGenerate}>Generate</Button>
        <Button variant="secondary" onClick={handleClear} disabled={!hasOutput}>
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={
          uuids !== null && uuids.length > 0 ? <CopyButton value={uuids.join('\n')} /> : undefined
        }
      >
        {uuids !== null ? (
          <div className={styles.list} data-testid="uuid-output">
            {uuids.map((uuid) => (
              <div key={uuid} className={styles.item}>
                <code className={styles.uuid}>{uuid}</code>
                <CopyButton value={uuid} label="Copy UUID" />
              </div>
            ))}
          </div>
        ) : null}
        {error !== null ? <Status kind="error">{error}</Status> : null}
        {!hasOutput ? <p className="muted">Generated UUIDs will appear here.</p> : null}
      </Panel>
    </div>
  )
}
