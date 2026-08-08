import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  CHARSET_ORDER,
  DEFAULT_LENGTH,
  MAX_LENGTH,
  MIN_LENGTH,
  createRandomString,
  type CharsetKey,
  type RandomStringResult,
} from './logic'
import styles from './Tool.module.css'

const CHARSET_LABELS: Record<CharsetKey, string> = {
  lowercase: 'Lowercase (a-z)',
  uppercase: 'Uppercase (A-Z)',
  digits: 'Digits (0-9)',
  symbols: 'Symbols',
}

export function RandomStringGeneratorTool() {
  const [selected, setSelected] = useState<ReadonlySet<CharsetKey>>(() => new Set(CHARSET_ORDER))
  const [lengthText, setLengthText] = useState(String(DEFAULT_LENGTH))
  const [result, setResult] = useState<RandomStringResult | null>(null)

  const toggleCharset = (key: CharsetKey, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  const handleGenerate = () => {
    setResult(
      createRandomString(
        CHARSET_ORDER.filter((key) => selected.has(key)),
        lengthText,
      ),
    )
  }

  return (
    <div className={styles.layout}>
      <Panel title="Options">
        <div className={styles.options}>
          <label className={styles.lengthRow}>
            <span>Length</span>
            <input
              className="field"
              aria-label="Length"
              type="number"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={lengthText}
              onChange={(event) => setLengthText(event.target.value)}
            />
          </label>
          <fieldset className={styles.sets}>
            <legend>Character sets</legend>
            {CHARSET_ORDER.map((key) => (
              <label key={key} className={styles.setRow}>
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={(event) => toggleCharset(key, event.target.checked)}
                />
                <span>{CHARSET_LABELS[key]}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </Panel>

      <ActionArea>
        <Button onClick={handleGenerate}>Generate</Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <p className={styles.output} data-testid="random-string-output">
            {result.output}
          </p>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Generated string will appear here.</p> : null}
      </Panel>
    </div>
  )
}
