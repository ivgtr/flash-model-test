import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { MAX_ROWS, buildQueryString, parseQueryString, type KeyValueRow } from './logic'
import styles from './Tool.module.css'

export function QueryStringBuilderTool() {
  const [rows, setRows] = useState<KeyValueRow[]>(() => [{ key: '', value: '' }])
  const [importInput, setImportInput] = useState('')
  const [importNotice, setImportNotice] = useState<string | null>(null)

  const output = buildQueryString(rows)

  const updateRow = (index: number, field: keyof KeyValueRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      return
    }
    setRows((prev) => [...prev, { key: '', value: '' }])
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImport = () => {
    const parsed = parseQueryString(importInput)
    setRows(parsed.slice(0, MAX_ROWS))
    setImportNotice(parsed.length > MAX_ROWS ? `Imported the first ${MAX_ROWS} rows.` : null)
  }

  const handleClearAll = () => {
    setRows([])
    setImportNotice(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Pairs">
        <div className={styles.rows}>
          {rows.map((row, index) => (
            <div className={styles.row} key={index}>
              <input
                className="field"
                aria-label={`Key ${index + 1}`}
                value={row.key}
                onChange={(event) => updateRow(index, 'key', event.target.value)}
                placeholder="key"
                spellCheck={false}
              />
              <input
                className="field"
                aria-label={`Value ${index + 1}`}
                value={row.value}
                onChange={(event) => updateRow(index, 'value', event.target.value)}
                placeholder="value"
                spellCheck={false}
              />
              <Button
                variant="secondary"
                aria-label={`Remove row ${index + 1}`}
                onClick={() => removeRow(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="muted">No pairs. Add a row or import a query string.</p>
          ) : null}
        </div>

        <ActionArea>
          <Button onClick={addRow} disabled={rows.length >= MAX_ROWS}>
            Add row
          </Button>
          <Button variant="secondary" onClick={handleClearAll} disabled={rows.length === 0}>
            Clear all
          </Button>
        </ActionArea>

        <div className={styles.importArea}>
          <label className={styles.importLabel}>
            Import from a query string
            <textarea
              className="field"
              aria-label="Query string"
              value={importInput}
              onChange={(event) => setImportInput(event.target.value)}
              placeholder={'?page=1&sort=asc&q=hello+world'}
              rows={3}
              spellCheck={false}
            />
          </label>
          <Button variant="secondary" onClick={handleImport} disabled={importInput === ''}>
            Import
          </Button>
        </div>
        {importNotice !== null ? <Status kind="info">{importNotice}</Status> : null}
      </Panel>

      <Panel title="Output" actions={<CopyButton value={output} />}>
        <pre className={styles.output} data-testid="query-string-output">
          {output}
        </pre>
        {output === '' ? <p className="muted">Query string will appear here.</p> : null}
      </Panel>
    </div>
  )
}
