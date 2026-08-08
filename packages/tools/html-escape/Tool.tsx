import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { escapeHtml, unescapeHtml } from './logic'
import styles from './Tool.module.css'

type Direction = 'escape' | 'unescape'

export function HtmlEscapeTool() {
  const [direction, setDirection] = useState<Direction>('escape')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string | null>(null)

  const handleDirectionChange = (value: string) => {
    if (value === 'escape' || value === 'unescape') {
      setDirection(value)
      setOutput(null)
    }
  }

  const handleConvert = () => {
    setOutput(direction === 'escape' ? escapeHtml(input) : unescapeHtml(input))
  }

  const handleClear = () => {
    setInput('')
    setOutput(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.directionRow}>
          <span>Direction</span>
          <select
            className="field"
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            <option value="escape">Escape (text → entities)</option>
            <option value="unescape">Unescape (entities → text)</option>
          </select>
        </label>
        <textarea
          className="field"
          aria-label="HTML text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            direction === 'escape'
              ? '<p>Hello & welcome</p>'
              : '&lt;p&gt;Hello &amp; welcome&lt;/p&gt;'
          }
          rows={6}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>{direction === 'escape' ? 'Escape' : 'Unescape'}</Button>
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
          <pre className={styles.output} data-testid="html-escape-output">
            {output}
          </pre>
        ) : null}
        {output === null ? <p className="muted">Converted text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
