import { useState } from 'react'
import { ActionArea, Button, Panel, Status } from '@tool-forge/ui'
import {
  FLAG_OPTIONS,
  testRegex,
  type GroupDetail,
  type RegexFlag,
  type RegexTestResult,
} from './logic'
import styles from './Tool.module.css'

function matchCountLabel(count: number, truncated: boolean): string {
  if (truncated) {
    return `${count}+ matches`
  }
  if (count === 0) {
    return 'No match'
  }
  if (count === 1) {
    return '1 match'
  }
  return `${count} matches`
}

function renderGroups(groups: GroupDetail[]) {
  if (groups.length === 0) {
    return <span className="muted">-</span>
  }
  return groups.map((group, index) => (
    <div key={index} className={styles.groupRow}>
      <span className={styles.groupLabel}>{group.name ?? `Group ${index + 1}`}</span>
      <span className={styles.groupValue}>{group.value ?? ''}</span>
    </div>
  ))
}

function Results({ result }: { result: Extract<RegexTestResult, { ok: true }> }) {
  const { matches, truncated } = result
  if (matches.length === 0) {
    return (
      <p className="muted" data-testid="match-count">
        No match
      </p>
    )
  }
  return (
    <>
      <p data-testid="match-count">{matchCountLabel(matches.length, truncated)}</p>
      {!result.global ? (
        <p className="muted">g flag is off - only the first match is shown.</p>
      ) : null}
      <table className={styles.table} data-testid="match-list">
        <thead>
          <tr>
            <th>Match</th>
            <th>Index</th>
            <th>Groups</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => (
            <tr key={index}>
              <td>
                <code>{match.match}</code>
              </td>
              <td>{match.index}</td>
              <td>{renderGroups(match.groups)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {truncated ? (
        <p className="muted">
          Results are truncated - only the first {matches.length} matches are shown.
        </p>
      ) : null}
    </>
  )
}

export function RegexTesterTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<RegexFlag[]>([])
  const [text, setText] = useState('')
  const [result, setResult] = useState<RegexTestResult | null>(null)

  const toggleFlag = (flag: RegexFlag) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]))
  }

  const handleTest = () => {
    setResult(testRegex(pattern, flags, text))
  }

  const handleClear = () => {
    setPattern('')
    setFlags([])
    setText('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.fieldRow}>
          <span>Pattern</span>
          <input
            className="field"
            aria-label="Pattern"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="\d+"
            spellCheck={false}
          />
        </label>
        <fieldset className={styles.flags}>
          <legend>Flags</legend>
          {FLAG_OPTIONS.map((flag) => (
            <label key={flag} className={styles.flag}>
              <input
                type="checkbox"
                checked={flags.includes(flag)}
                onChange={() => toggleFlag(flag)}
              />
              {flag}
            </label>
          ))}
        </fieldset>
        <label className={styles.fieldRow}>
          <span>Test string</span>
          <textarea
            className="field"
            aria-label="Test string"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            spellCheck={false}
          />
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleTest}>Test</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={pattern === '' && flags.length === 0 && text === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Results">
        {result === null ? <p className="muted">Test results will appear here.</p> : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result?.ok ? <Results result={result} /> : null}
      </Panel>
    </div>
  )
}
