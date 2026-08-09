import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { DEFAULT_SORT_OPTIONS, parseDirection, sortLines, type SortDirection } from './logic'
import styles from './Tool.module.css'

const DIRECTION_OPTIONS: readonly SortDirection[] = ['asc', 'desc']

const DIRECTION_LABELS: Record<SortDirection, string> = {
  asc: 'Ascending',
  desc: 'Descending',
}

export function LineSorterTool() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_SORT_OPTIONS.direction)
  const [caseSensitive, setCaseSensitive] = useState(DEFAULT_SORT_OPTIONS.caseSensitive)
  const [natural, setNatural] = useState(DEFAULT_SORT_OPTIONS.natural)
  const [ignoreLeadingWhitespace, setIgnoreLeadingWhitespace] = useState(
    DEFAULT_SORT_OPTIONS.ignoreLeadingWhitespace,
  )
  const [removeBlankLines, setRemoveBlankLines] = useState(DEFAULT_SORT_OPTIONS.removeBlankLines)
  const [result, setResult] = useState<string | null>(null)

  const handleDirectionChange = (value: string) => {
    const parsed = parseDirection(value)
    if (parsed !== null) {
      setDirection(parsed)
    }
  }

  const handleSort = () => {
    setResult(
      sortLines(input, {
        direction,
        caseSensitive,
        natural,
        ignoreLeadingWhitespace,
        removeBlankLines,
      }),
    )
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.fieldRow}>
          <span>Direction</span>
          <select
            className="field"
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className={styles.options}>
          <legend>Options</legend>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(event) => setCaseSensitive(event.target.checked)}
            />
            Case-sensitive
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={natural}
              onChange={(event) => setNatural(event.target.checked)}
            />
            Natural sort
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={ignoreLeadingWhitespace}
              onChange={(event) => setIgnoreLeadingWhitespace(event.target.checked)}
            />
            Ignore leading whitespace
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={removeBlankLines}
              onChange={(event) => setRemoveBlankLines(event.target.checked)}
            />
            Remove blank lines
          </label>
        </fieldset>
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'banana\napple\ncherry'}
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleSort}>Sort</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result !== null ? <CopyButton value={result} /> : undefined}>
        {result !== null ? (
          <pre className={styles.output} data-testid="line-sorter-output">
            {result}
          </pre>
        ) : (
          <p className="muted">Sorted lines will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
