import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { removeDuplicateLines, type DuplicateLineOptions } from './logic'
import styles from './Tool.module.css'

const DEFAULT_OPTIONS: DuplicateLineOptions = {
  ignoreCase: false,
  trim: false,
  removeBlankLines: false,
}

export function DuplicateLineRemoverTool() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<DuplicateLineOptions>(DEFAULT_OPTIONS)
  const [result, setResult] = useState<string | null>(null)

  const toggleOption = (key: keyof DuplicateLineOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleRemove = () => {
    setResult(removeDuplicateLines(input, options))
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
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'apple\nbanana\napple'}
          rows={10}
          spellCheck={false}
        />
        <fieldset className={styles.options}>
          <legend>Options</legend>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={() => toggleOption('ignoreCase')}
            />
            Ignore case
          </label>
          <label className={styles.option}>
            <input type="checkbox" checked={options.trim} onChange={() => toggleOption('trim')} />
            Trim whitespace before comparing
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={options.removeBlankLines}
              onChange={() => toggleOption('removeBlankLines')}
            />
            Remove blank lines
          </label>
        </fieldset>
      </Panel>

      <ActionArea>
        <Button onClick={handleRemove}>Remove duplicates</Button>
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
          <pre className={styles.output} data-testid="dedup-output">
            {result}
          </pre>
        ) : (
          <p className="muted">Deduplicated text will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
