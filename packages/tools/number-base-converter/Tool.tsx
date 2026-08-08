import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_INPUT_RADIX,
  DEFAULT_OUTPUT_RADIX,
  RADICES,
  convertBase,
  parseRadix,
  type ConvertResult,
  type Radix,
} from './logic'
import styles from './Tool.module.css'

export function NumberBaseConverterTool() {
  const [input, setInput] = useState('')
  const [inputRadix, setInputRadix] = useState<Radix>(DEFAULT_INPUT_RADIX)
  const [outputRadix, setOutputRadix] = useState<Radix>(DEFAULT_OUTPUT_RADIX)
  const [result, setResult] = useState<ConvertResult | null>(null)

  const handleInputRadixChange = (value: string) => {
    const parsed = parseRadix(value)
    if (parsed !== null) {
      setInputRadix(parsed)
    }
  }

  const handleOutputRadixChange = (value: string) => {
    const parsed = parseRadix(value)
    if (parsed !== null) {
      setOutputRadix(parsed)
    }
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const output = result?.ok ? result.output : ''
  const showPlaceholder = result === null || (result.ok && output === '')

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <div className={styles.radixRow}>
          <label>
            <span>Input base</span>
            <select
              className="field"
              value={inputRadix}
              onChange={(event) => handleInputRadixChange(event.target.value)}
            >
              {RADICES.map((radix) => (
                <option key={radix} value={radix}>
                  {radix}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Output base</span>
            <select
              className="field"
              value={outputRadix}
              onChange={(event) => handleOutputRadixChange(event.target.value)}
            >
              {RADICES.map((radix) => (
                <option key={radix} value={radix}>
                  {radix}
                </option>
              ))}
            </select>
          </label>
        </div>
        <input
          className="field"
          aria-label="Number input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. 255"
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(convertBase(input, inputRadix, outputRadix))}>
          Convert
        </Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={output !== '' ? <CopyButton value={output} /> : undefined}>
        {result?.ok && output !== '' ? (
          <pre className={styles.output} data-testid="number-output">
            {output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {showPlaceholder ? <p className="muted">Converted number will appear here.</p> : null}
      </Panel>
    </div>
  )
}
