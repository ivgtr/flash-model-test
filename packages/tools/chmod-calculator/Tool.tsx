import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { convertMode, type ConvertModeResult, type PermissionClass } from './logic'
import styles from './Tool.module.css'

const CLASS_LABELS: Record<PermissionClass, string> = {
  user: 'User (owner)',
  group: 'Group',
  other: 'Other',
}

export function ChmodCalculatorTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ConvertModeResult | null>(null)

  const handleConvert = () => {
    setResult(convertMode(input))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const copyText =
    result?.ok === true
      ? [
          `Octal: ${result.octal}`,
          `Symbolic: ${result.symbolic}`,
          `Binary: ${result.binary}`,
          `User: ${result.classes.user}`,
          `Group: ${result.classes.group}`,
          `Other: ${result.classes.other}`,
        ].join('\n')
      : ''

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <input
          className="field"
          type="text"
          aria-label="Mode input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. 755, 4755 or rwxr-xr-x"
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

      <Panel title="Output" actions={copyText !== '' ? <CopyButton value={copyText} /> : undefined}>
        {result?.ok ? (
          <table className={styles.table} data-testid="chmod-result">
            <tbody>
              <tr>
                <th scope="row">Octal</th>
                <td className={styles.mono}>{result.octal}</td>
              </tr>
              <tr>
                <th scope="row">Symbolic</th>
                <td className={styles.mono}>{result.symbolic}</td>
              </tr>
              <tr>
                <th scope="row">Binary</th>
                <td className={styles.mono}>{result.binary}</td>
              </tr>
              {(['user', 'group', 'other'] as const).map((className) => (
                <tr key={className}>
                  <th scope="row">{CLASS_LABELS[className]}</th>
                  <td className={styles.mono}>{result.classes[className]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Converted mode will appear here.</p> : null}
      </Panel>
    </div>
  )
}
