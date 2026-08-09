import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { decodeJwt, type JwtDecodeResult } from './logic'
import styles from './Tool.module.css'

export function JwtDecoderTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<JwtDecodeResult | null>(null)

  const handleDecode = () => {
    setResult(decodeJwt(input))
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
          aria-label="JWT input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
          }
          rows={10}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleDecode}>Decode</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <>
            <Status kind="info">Signature is not verified</Status>
            <pre className={styles.output} data-testid="jwt-output">
              {result.output}
            </pre>
          </>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Decoded JWT will appear here.</p> : null}
      </Panel>
    </div>
  )
}
