import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { formatUrlParts, parseUrl, type UrlParseResult, type UrlParts } from './logic'
import styles from './Tool.module.css'

type UrlPartField =
  | 'protocol'
  | 'host'
  | 'hostname'
  | 'port'
  | 'pathname'
  | 'search'
  | 'hash'
  | 'username'
  | 'password'
  | 'origin'

const PART_LABELS: ReadonlyArray<readonly [UrlPartField, string]> = [
  ['protocol', 'Protocol'],
  ['host', 'Host'],
  ['hostname', 'Hostname'],
  ['port', 'Port'],
  ['pathname', 'Pathname'],
  ['search', 'Search'],
  ['hash', 'Hash'],
  ['username', 'Username'],
  ['password', 'Password'],
  ['origin', 'Origin'],
]

function UrlPartsView({ parts }: { parts: UrlParts }) {
  return (
    <div>
      <dl className={styles.parts} data-testid="url-parts">
        {PART_LABELS.map(([field, label]) => (
          <div key={field} className={styles.partRow}>
            <dt>{label}</dt>
            <dd>{parts[field]}</dd>
          </div>
        ))}
      </dl>
      <h3 className={styles.paramsTitle}>Query params</h3>
      {parts.params.length > 0 ? (
        <ul className={styles.params} data-testid="url-params">
          {parts.params.map((param, index) => (
            <li key={`${param.key}-${index}`} className={styles.paramRow}>
              <span className={styles.paramKey}>{param.key}</span>
              <span>=</span>
              <span className={styles.paramValue}>{param.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" data-testid="url-params-empty">
          No query parameters.
        </p>
      )}
    </div>
  )
}

export function UrlParserTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<UrlParseResult | null>(null)

  const handleParse = () => {
    setResult(parseUrl(input))
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
          aria-label="URL input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="https://user:pass@example.com:8080/path?q=1#top"
          rows={4}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleParse}>Parse</Button>
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
        actions={result?.ok ? <CopyButton value={formatUrlParts(result.parts)} /> : undefined}
      >
        {result?.ok ? <UrlPartsView parts={result.parts} /> : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Parsed URL parts will appear here.</p> : null}
      </Panel>
    </div>
  )
}
