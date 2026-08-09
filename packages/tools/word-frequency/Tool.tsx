import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import {
  DEFAULT_LIMIT,
  LIMIT_OPTIONS,
  countWords,
  type TopN,
  type WordFrequencyResult,
} from './logic'
import styles from './Tool.module.css'

const LIMIT_LABELS: Record<TopN, string> = {
  10: '10',
  20: '20',
  50: '50',
  all: 'All',
}

function formatShare(count: number, total: number): string {
  if (total === 0) {
    return '0.0%'
  }
  return `${((count / total) * 100).toFixed(1)}%`
}

function formatCopyValue(result: WordFrequencyResult): string {
  return result.entries.map((entry) => `${entry.word}\t${entry.count}`).join('\n')
}

export function WordFrequencyTool() {
  const [input, setInput] = useState('')
  const [caseInsensitive, setCaseInsensitive] = useState(false)
  const [limit, setLimit] = useState<TopN>(DEFAULT_LIMIT)
  const [result, setResult] = useState<WordFrequencyResult | null>(null)

  const handleLimitChange = (value: string) => {
    if ((LIMIT_OPTIONS as readonly string[]).includes(value)) {
      setLimit(value as TopN)
    }
  }

  const handleCount = () => {
    setResult(countWords(input, { caseInsensitive, limit }))
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
          aria-label="Word frequency input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste text to analyze…"
          rows={10}
          spellCheck={false}
        />
        <div className={styles.options}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={caseInsensitive}
              onChange={(event) => setCaseInsensitive(event.target.checked)}
            />
            <span>Ignore case (The / the counted together)</span>
          </label>
          <label className={styles.limitRow}>
            <span>Show top</span>
            <select
              className="field"
              aria-label="Show top"
              value={limit}
              onChange={(event) => handleLimitChange(event.target.value)}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {LIMIT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      <ActionArea>
        <Button onClick={handleCount}>Count</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={result !== null ? <CopyButton value={formatCopyValue(result)} /> : undefined}
      >
        {result !== null ? (
          <div data-testid="word-frequency-output">
            <p className={styles.totals} data-testid="word-frequency-totals">
              Total words: {result.totals.words} · Unique words: {result.totals.unique}
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Count</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.map((entry) => (
                  <tr key={entry.word}>
                    <td>{entry.word}</td>
                    <td>{entry.count}</td>
                    <td>{formatShare(entry.count, result.totals.words)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">The word frequency table will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
