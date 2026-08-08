import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  BYTE_UNITS,
  convertBytes,
  type ByteConvertResult,
  type ByteUnit,
  type ByteUnitSystem,
} from './logic'
import styles from './Tool.module.css'

const SYSTEM_LABELS: Record<ByteUnitSystem, string> = {
  decimal: 'Decimal (×1000)',
  binary: 'Binary (×1024)',
}

export function ByteSizeConverterTool() {
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState<ByteUnit>('B')
  const [result, setResult] = useState<ByteConvertResult | null>(null)

  const rows = result?.ok && result.bytes !== null ? result.rows : null
  const copyText = rows === null ? '' : rows.map((row) => `${row.unit} = ${row.value}`).join('\n')

  const handleClear = () => {
    setValue('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <div className={styles.inputRow}>
          <input
            className="field"
            type="text"
            inputMode="decimal"
            aria-label="Byte value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. 1.5"
            spellCheck={false}
          />
          <select
            className="field"
            aria-label="Byte unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value as ByteUnit)}
          >
            {(['decimal', 'binary'] as const).map((system) => (
              <optgroup key={system} label={SYSTEM_LABELS[system]}>
                {BYTE_UNITS.filter((candidate) => candidate.system === system).map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(convertBytes(value, unit))}>Convert</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={value === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={copyText !== '' ? <CopyButton value={copyText} /> : undefined}>
        {rows !== null ? (
          <table className={styles.table} data-testid="byte-conversion-table">
            <tbody>
              {(['decimal', 'binary'] as const).map((system) => (
                <tr key={system} className={styles.groupHeader}>
                  <th colSpan={2}>{SYSTEM_LABELS[system]}</th>
                </tr>
              ))}
            </tbody>
            <tbody>
              {rows.map((row) => (
                <tr key={row.unit}>
                  <th scope="row">{row.unit}</th>
                  <td className={styles.value}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null || rows === null ? (
          <p className="muted">Converted values will appear here.</p>
        ) : null}
      </Panel>
    </div>
  )
}
