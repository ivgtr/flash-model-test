import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_ALGORITHM,
  HASH_ALGORITHMS,
  computeHash,
  isHashAlgorithm,
  type HashAlgorithm,
} from './logic'
import styles from './Tool.module.css'

export function HashGeneratorTool() {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(DEFAULT_ALGORITHM)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleHash = async () => {
    setPending(true)
    setError(null)
    try {
      const digest = await computeHash(input, algorithm)
      setResult(digest)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unknown hash error')
    } finally {
      setPending(false)
    }
  }

  const handleAlgorithmChange = (value: string) => {
    if (isHashAlgorithm(value)) {
      setAlgorithm(value)
    }
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
    setError(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Text to hash"
          rows={6}
          spellCheck={false}
        />
        <label className={styles.algorithmRow}>
          <span>Algorithm</span>
          <select
            className="field"
            aria-label="Algorithm"
            value={algorithm}
            onChange={(event) => handleAlgorithmChange(event.target.value)}
          >
            {HASH_ALGORITHMS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleHash} disabled={pending}>
          Hash
        </Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null && error === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result !== null ? <CopyButton value={result} /> : undefined}>
        {result !== null ? (
          <pre className={styles.output} data-testid="hash-output">
            {result}
          </pre>
        ) : null}
        {error !== null ? <Status kind="error">{error}</Status> : null}
        {result === null && error === null ? (
          <p className="muted">The hash will appear here.</p>
        ) : null}
      </Panel>
    </div>
  )
}
