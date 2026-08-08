import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { dateToTimestamp, parseTimestamp, type TimestampInfo, type TimestampResult } from './logic'
import styles from './Tool.module.css'

interface TimestampResultViewProps {
  result: TimestampInfo
}

function TimestampResultView({ result }: TimestampResultViewProps) {
  const rows = [
    { label: 'Seconds', value: result.seconds.toString() },
    { label: 'Milliseconds', value: result.milliseconds.toString() },
    { label: 'Local time', value: result.local },
    { label: 'UTC time', value: result.utc },
  ]
  return (
    <dl className={styles.result} data-testid="timestamp-result">
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          <CopyButton value={row.value} />
        </div>
      ))}
    </dl>
  )
}

interface ConversionSectionProps {
  title: string
  inputLabel: string
  placeholder: string
  inputType: string
  convertLabel: string
  inputValue: string
  onInputChange: (value: string) => void
  onConvert: () => void
  result: TimestampResult | null
}

function ConversionSection({
  title,
  inputLabel,
  placeholder,
  inputType,
  convertLabel,
  inputValue,
  onInputChange,
  onConvert,
  result,
}: ConversionSectionProps) {
  return (
    <Panel title={title}>
      <input
        className="field"
        type={inputType}
        aria-label={inputLabel}
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      <ActionArea>
        <Button onClick={onConvert}>{convertLabel}</Button>
      </ActionArea>
      {result?.ok ? <TimestampResultView result={result.output} /> : null}
      {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
      {result === null ? <p className="muted">Converted date will appear here.</p> : null}
    </Panel>
  )
}

export function UnixTimestampTool() {
  const [timestampInput, setTimestampInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [tsResult, setTsResult] = useState<TimestampResult | null>(null)
  const [dateResult, setDateResult] = useState<TimestampResult | null>(null)

  return (
    <div className={styles.layout}>
      <ConversionSection
        title="Timestamp to Date"
        inputLabel="Timestamp input"
        placeholder="1700000000 or 1700000000000"
        inputType="text"
        convertLabel="Convert"
        inputValue={timestampInput}
        onInputChange={setTimestampInput}
        onConvert={() => setTsResult(parseTimestamp(timestampInput))}
        result={tsResult}
      />

      <ConversionSection
        title="Date to Timestamp"
        inputLabel="Date input"
        placeholder=""
        inputType="datetime-local"
        convertLabel="Convert"
        inputValue={dateInput}
        onInputChange={setDateInput}
        onConvert={() => setDateResult(dateToTimestamp(dateInput))}
        result={dateResult}
      />
    </div>
  )
}
