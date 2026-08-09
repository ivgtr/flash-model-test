import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { normalizeWhitespace, type WhitespaceNormalizerOptions } from './logic'
import styles from './Tool.module.css'

const OPTION_LABELS: ReadonlyArray<{
  key: keyof WhitespaceNormalizerOptions
  label: string
}> = [
  { key: 'trim', label: 'Trim leading and trailing whitespace on each line' },
  { key: 'collapseSpaces', label: 'Collapse runs of spaces and tabs to a single space' },
  { key: 'stripTrailing', label: 'Strip trailing whitespace from each line' },
  { key: 'unifyLineEndings', label: 'Convert CRLF / CR line endings to LF' },
  { key: 'removeBlankLines', label: 'Remove blank lines (including whitespace-only lines)' },
]

const DEFAULT_OPTIONS: WhitespaceNormalizerOptions = {
  trim: true,
  collapseSpaces: true,
  stripTrailing: true,
  unifyLineEndings: true,
  removeBlankLines: true,
}

export function WhitespaceNormalizerTool() {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<WhitespaceNormalizerOptions>(DEFAULT_OPTIONS)
  const [output, setOutput] = useState<string | null>(null)

  const handleOptionChange = (key: keyof WhitespaceNormalizerOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleNormalize = () => {
    setOutput(normalizeWhitespace(input, options))
  }

  const handleClear = () => {
    setInput('')
    setOutput(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <div className={styles.options}>
          {OPTION_LABELS.map(({ key, label }) => (
            <label key={key} className={styles.optionRow}>
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => handleOptionChange(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'  Hello   World\n\nSecond  line  '}
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleNormalize}>Normalize</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && output === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={output !== null ? <CopyButton value={output} /> : undefined}>
        {output !== null ? (
          <pre className={styles.output} data-testid="normalized-output">
            {output}
          </pre>
        ) : (
          <p className="muted">Normalized text will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
