import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  computeDateDifference,
  formatDateDifference,
  type DateDifferenceOutput,
  type DateDifferenceResult,
} from './logic'
import styles from './Tool.module.css'

function DateDifferenceResultView({ result }: { result: DateDifferenceResult }) {
  return (
    <div className={styles.result} data-testid="date-difference-result">
      <p className={styles.calendar}>
        {result.years} 年 {result.months} ヶ月 {result.days} 日
      </p>
      <dl className={styles.totals}>
        <div>
          <dt>総時間</dt>
          <dd>{result.totalHours} 時間</dd>
        </div>
        <div>
          <dt>総分数</dt>
          <dd>{result.totalMinutes} 分</dd>
        </div>
        <div>
          <dt>総秒数</dt>
          <dd>{result.totalSeconds} 秒</dd>
        </div>
        <div>
          <dt>総日数</dt>
          <dd>{result.totalDays} 日</dd>
        </div>
      </dl>
    </div>
  )
}

export function DateDifferenceTool() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [output, setOutput] = useState<DateDifferenceOutput | null>(null)

  const handleCalculate = () => {
    setOutput(computeDateDifference(start, end))
  }

  const handleClear = () => {
    setStart('')
    setEnd('')
    setOutput(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.fieldLabel}>
          <span>Start</span>
          <input
            type="datetime-local"
            className="field"
            aria-label="Start"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>End</span>
          <input
            type="datetime-local"
            className="field"
            aria-label="End"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleCalculate}>Calculate</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={start === '' && end === '' && output === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={
          output?.status === 'ok' ? (
            <CopyButton value={formatDateDifference(output.result)} />
          ) : undefined
        }
      >
        {output?.status === 'ok' ? <DateDifferenceResultView result={output.result} /> : null}
        {output?.status === 'error' ? <Status kind="error">{output.error}</Status> : null}
        {output === null || output.status === 'empty' ? (
          <p className="muted">Difference will appear here.</p>
        ) : null}
      </Panel>
    </div>
  )
}
