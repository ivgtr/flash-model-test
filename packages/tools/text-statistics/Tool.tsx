import { useState } from 'react'
import { Panel } from '@tool-forge/ui'
import { countTextStatistics, type TextStatistics } from './logic'
import styles from './Tool.module.css'

export function TextStatisticsTool() {
  const [input, setInput] = useState('')
  const stats: TextStatistics = countTextStatistics(input)

  const rows = [
    { label: 'Characters', value: stats.characters },
    { label: 'Words', value: stats.words },
    { label: 'Lines', value: stats.lines },
  ]

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type or paste text here…"
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <Panel title="Statistics">
        <dl className={styles.result} data-testid="text-statistics">
          {rows.map((row) => (
            <div key={row.label} className={styles.row}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  )
}
