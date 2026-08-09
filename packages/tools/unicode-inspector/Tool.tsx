import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  formatInspection,
  formatUtf16Units,
  inspectUnicode,
  type InspectUnicodeResult,
} from './logic'
import styles from './Tool.module.css'

export function UnicodeInspectorTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<InspectUnicodeResult | null>(null)
  const [copyText, setCopyText] = useState('')

  const handleInspect = () => {
    setResult(inspectUnicode(input))
    setCopyText(formatInspection(input))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
    setCopyText('')
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Text to inspect"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type or paste text here…"
          rows={8}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleInspect}>Inspect</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={copyText} /> : undefined}>
        <p className="muted" data-testid="unicode-inspector-note">
          This tool does not bundle a Unicode name or category database — only code points, UTF-16
          units, and UTF-8 bytes are shown.
        </p>
        {result?.ok ? (
          <>
            {result.chars.length > 0 ? (
              <table className={styles.table} data-testid="unicode-inspector-output">
                <thead>
                  <tr>
                    <th>Char</th>
                    <th>Display</th>
                    <th>Code point</th>
                    <th>Decimal</th>
                    <th>UTF-16 units</th>
                    <th>UTF-8 bytes (hex)</th>
                    <th>Astral</th>
                  </tr>
                </thead>
                <tbody>
                  {result.chars.map((info, index) => (
                    <tr key={index}>
                      <td>{info.char}</td>
                      <td>
                        <code>{info.display}</code>
                      </td>
                      <td>{info.hex}</td>
                      <td>{info.decimal}</td>
                      <td>
                        <code>{formatUtf16Units(info.utf16Units)}</code>
                      </td>
                      <td>
                        <code>{info.utf8Hex}</code>
                      </td>
                      <td>{info.isAstral ? 'astral' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">No characters to inspect.</p>
            )}
            <dl className={styles.stats} data-testid="unicode-inspector-stats">
              <div className={styles.statRow}>
                <dt>Code points</dt>
                <dd>{result.stats.codePoints}</dd>
              </div>
              <div className={styles.statRow}>
                <dt>UTF-16 units</dt>
                <dd>{result.stats.utf16Units}</dd>
              </div>
              <div className={styles.statRow}>
                <dt>UTF-8 bytes</dt>
                <dd>{result.stats.utf8Bytes}</dd>
              </div>
            </dl>
          </>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Inspection will appear here.</p> : null}
      </Panel>
    </div>
  )
}
