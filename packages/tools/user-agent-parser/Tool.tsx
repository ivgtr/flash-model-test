import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { formatUserAgentResult, parseUserAgent, type UserAgentParseResult } from './logic'
import styles from './Tool.module.css'

export function UserAgentParserTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<UserAgentParseResult | null>(null)

  const handleParse = () => {
    setResult(parseUserAgent(input))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const output = result === null ? null : formatUserAgentResult(result)

  return (
    <div className={styles.layout}>
      <p className={styles.note}>
        Lightweight pattern detection — this is not a full User-Agent parser. Anything outside the
        supported set is reported as Unknown.
      </p>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="User-Agent input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
          rows={6}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleParse}>Analyze</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={input === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={output !== null ? <CopyButton value={output} /> : undefined}>
        {output !== null ? (
          <pre className={styles.output} data-testid="ua-parser-output">
            {output}
          </pre>
        ) : null}
        {result === null ? <p className="muted">Parsed result will appear here.</p> : null}
      </Panel>
    </div>
  )
}
