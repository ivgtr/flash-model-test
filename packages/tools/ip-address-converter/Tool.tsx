import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_FAMILY,
  FAMILY_OPTIONS,
  convertIpAddress,
  parseFamily,
  type FamilySelection,
  type IpAddressResult,
} from './logic'
import styles from './Tool.module.css'

const FAMILY_LABELS: Record<FamilySelection, string> = {
  auto: 'Auto-detect',
  IPv4: 'IPv4',
  IPv6: 'IPv6',
}

export function IpAddressConverterTool() {
  const [input, setInput] = useState('')
  const [family, setFamily] = useState<FamilySelection>(DEFAULT_FAMILY)
  const [result, setResult] = useState<IpAddressResult | null>(null)

  const handleFamilyChange = (value: string) => {
    const parsed = parseFamily(value)
    if (parsed !== null) {
      setFamily(parsed)
    }
  }

  const handleConvert = () => {
    setResult(convertIpAddress(input, family))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const showPlaceholder = result === null

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.familyRow}>
          <span>Address family</span>
          <select
            className="field"
            aria-label="Address family"
            value={family}
            onChange={(event) => handleFamilyChange(event.target.value)}
          >
            {FAMILY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {FAMILY_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <input
          className="field"
          aria-label="IP address input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. 192.168.0.1 or 2001:db8::1"
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>Convert</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output">
        {result?.ok && result.output.family === 'IPv4' ? (
          <dl className={styles.rows} data-testid="ipv4-output">
            <div className={styles.row}>
              <dt className={styles.label}>Dotted</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="dotted">
                  {result.output.dotted}
                </pre>
              </dd>
              <CopyButton value={result.output.dotted} label="Copy Dotted" />
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Integer</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="int">
                  {result.output.integer}
                </pre>
              </dd>
              <CopyButton value={result.output.integer} label="Copy Integer" />
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Binary</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="bin">
                  {result.output.binary}
                </pre>
              </dd>
              <CopyButton value={result.output.binary} label="Copy Binary" />
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Hex</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="hex">
                  {result.output.hex}
                </pre>
              </dd>
              <CopyButton value={result.output.hex} label="Copy Hex" />
            </div>
          </dl>
        ) : null}
        {result?.ok && result.output.family === 'IPv6' ? (
          <dl className={styles.rows} data-testid="ipv6-output">
            <div className={styles.row}>
              <dt className={styles.label}>Compressed</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="compressed">
                  {result.output.compressed}
                </pre>
              </dd>
              <CopyButton value={result.output.compressed} label="Copy Compressed" />
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Expanded</dt>
              <dd className={styles.value}>
                <pre className={styles.output} data-testid="expanded">
                  {result.output.expanded}
                </pre>
              </dd>
              <CopyButton value={result.output.expanded} label="Copy Expanded" />
            </div>
          </dl>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {showPlaceholder ? <p className="muted">Converted address will appear here.</p> : null}
      </Panel>
    </div>
  )
}
