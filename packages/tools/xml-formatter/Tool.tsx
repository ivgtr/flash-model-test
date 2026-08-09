import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DEFAULT_INDENT,
  INDENT_OPTIONS,
  formatXml,
  parseIndent,
  type IndentOption,
  type XmlFormatResult,
} from './logic'
import styles from './Tool.module.css'

export function XmlFormatterTool() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<IndentOption>(DEFAULT_INDENT)
  const [result, setResult] = useState<XmlFormatResult | null>(null)

  const handleIndentChange = (value: string) => {
    const parsed = parseIndent(value)
    if (parsed !== null) {
      setIndent(parsed)
    }
  }

  const handleFormat = () => {
    setResult(formatXml(input, indent))
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
          aria-label="XML input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'<note>\n  <to>Alice</to>\n</note>'}
          rows={10}
          spellCheck={false}
        />
        <label className={styles.indentRow}>
          <span>Indent</span>
          <select
            className="field"
            value={indent}
            onChange={(event) => handleIndentChange(event.target.value)}
          >
            {INDENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} spaces
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleFormat}>Format</Button>
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
          <pre className={styles.output} data-testid="xml-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Formatted XML will appear here.</p> : null}
      </Panel>
    </div>
  )
}
