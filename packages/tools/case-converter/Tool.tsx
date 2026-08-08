import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { CASE_TARGETS, DEFAULT_TARGET, convertCase, type CaseTarget } from './logic'
import styles from './Tool.module.css'

export function CaseConverterTool() {
  const [input, setInput] = useState('')
  const [target, setTarget] = useState<CaseTarget>(DEFAULT_TARGET)
  const [output, setOutput] = useState('')

  const handleTargetChange = (value: string) => {
    if ((CASE_TARGETS as readonly string[]).includes(value)) {
      setTarget(value as CaseTarget)
    }
  }

  const handleConvert = () => {
    setOutput(convertCase(input, target))
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Text input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. foo_bar-baz qux, XMLHttpRequest"
          rows={6}
          spellCheck={false}
        />
        <label className={styles.targetRow}>
          <span>Target case</span>
          <select
            className="field"
            value={target}
            onChange={(event) => handleTargetChange(event.target.value)}
          >
            {CASE_TARGETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleConvert}>Convert</Button>
        <Button variant="secondary" onClick={handleClear} disabled={input === '' && output === ''}>
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={output !== '' ? <CopyButton value={output} /> : undefined}>
        {output !== '' ? (
          <pre className={styles.output} data-testid="case-output">
            {output}
          </pre>
        ) : (
          <p className="muted">Converted text will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
