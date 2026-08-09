import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_NEXT_RUN_COUNT,
  explainCron,
  formatRun,
  nextRuns,
  type ExplainCronResult,
  type NextRunsResult,
} from './logic'
import styles from './Tool.module.css'

type ExplainCronOk = Extract<ExplainCronResult, { ok: true }>
type NextRunsOk = Extract<NextRunsResult, { ok: true }>

function buildCopyText(explanation: ExplainCronOk, runs: NextRunsOk): string {
  const lines: string[] = [explanation.summary, '']
  for (const field of explanation.fields) {
    lines.push(`${field.name}: ${field.description}`)
  }
  if (explanation.notes.length > 0) {
    lines.push('')
    for (const note of explanation.notes) {
      lines.push(`Note: ${note}`)
    }
  }
  lines.push('')
  if (runs.notFound) {
    lines.push('Next run times: none found within 400 days.')
  } else {
    lines.push('Next run times:')
    for (const run of runs.runs) {
      lines.push(formatRun(run))
    }
  }
  return lines.join('\n')
}

export function CronExplainerTool() {
  const [input, setInput] = useState('')
  const [explanation, setExplanation] = useState<ExplainCronResult | null>(null)
  const [runs, setRuns] = useState<NextRunsResult | null>(null)

  const handleExplain = () => {
    setExplanation(explainCron(input))
    setRuns(nextRuns(input, new Date(), DEFAULT_NEXT_RUN_COUNT))
  }

  const handleClear = () => {
    setInput('')
    setExplanation(null)
    setRuns(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <input
          type="text"
          className="field"
          aria-label="Cron expression"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleExplain}>Explain</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && explanation === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={
          explanation?.ok && runs?.ok ? (
            <CopyButton value={buildCopyText(explanation, runs)} />
          ) : undefined
        }
      >
        {explanation?.ok ? (
          <>
            <p className={styles.summary} data-testid="cron-summary">
              {explanation.summary}
            </p>
            <dl className={styles.fieldList} data-testid="cron-field-list">
              {explanation.fields.map((field) => (
                <div className={styles.fieldRow} key={field.name}>
                  <dt className={styles.fieldName}>{field.name}</dt>
                  <dd className={styles.fieldToken}>{field.token}</dd>
                  <dd className={styles.fieldDescription} data-testid="cron-field-description">
                    {field.description}
                  </dd>
                </div>
              ))}
            </dl>
            {explanation.notes.length > 0 ? (
              <ul className={styles.notes} data-testid="cron-notes">
                {explanation.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {runs?.ok ? (
              runs.notFound ? (
                <div data-testid="cron-no-runs">
                  <Status kind="info">No matching run times found within 400 days.</Status>
                </div>
              ) : (
                <>
                  <p className={styles.runsHeading}>Next run times</p>
                  <ol className={styles.runList} data-testid="cron-next-runs">
                    {runs.runs.map((run) => (
                      <li key={run.getTime()} data-testid="cron-next-run">
                        {formatRun(run)}
                      </li>
                    ))}
                  </ol>
                </>
              )
            ) : null}
          </>
        ) : null}
        {explanation !== null && !explanation.ok ? (
          <Status kind="error">{explanation.error}</Status>
        ) : null}
        {explanation === null ? <p className="muted">Explanation will appear here.</p> : null}
      </Panel>
    </div>
  )
}
