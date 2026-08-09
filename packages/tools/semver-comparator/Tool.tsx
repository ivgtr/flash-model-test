import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { compareVersions, satisfies, sortVersions, type SortDirection } from './logic'
import styles from './Tool.module.css'

type Mode = 'compare' | 'sort' | 'range'

type ToolResult = { ok: true; output: string } | { ok: false; error: string }

const MODE_OPTIONS: readonly { value: Mode; label: string }[] = [
  { value: 'compare', label: 'Compare two versions' },
  { value: 'sort', label: 'Sort a list of versions' },
  { value: 'range', label: 'Check a range comparator' },
]

const RUN_LABELS: Record<Mode, string> = {
  compare: 'Compare',
  sort: 'Sort',
  range: 'Check',
}

export function SemverComparatorTool() {
  const [mode, setMode] = useState<Mode>('compare')
  const [versionA, setVersionA] = useState('')
  const [versionB, setVersionB] = useState('')
  const [sortInput, setSortInput] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [version, setVersion] = useState('')
  const [comparator, setComparator] = useState('')
  const [result, setResult] = useState<ToolResult | null>(null)

  const handleModeChange = (value: string) => {
    if (value === 'compare' || value === 'sort' || value === 'range') {
      setMode(value)
      setResult(null)
    }
  }

  const handleRun = () => {
    if (mode === 'compare') {
      const compared = compareVersions(versionA, versionB)
      setResult(
        compared.ok
          ? {
              ok: true,
              output:
                compared.comparison === 0
                  ? `${versionA.trim()} = ${versionB.trim()}`
                  : compared.comparison < 0
                    ? `${versionA.trim()} < ${versionB.trim()}`
                    : `${versionA.trim()} > ${versionB.trim()}`,
            }
          : { ok: false, error: compared.error },
      )
      return
    }
    if (mode === 'sort') {
      const sorted = sortVersions(sortInput.split(/\r?\n/), sortDirection)
      setResult(
        sorted.ok
          ? { ok: true, output: sorted.lines.join('\n') }
          : { ok: false, error: sorted.error },
      )
      return
    }
    const checked = satisfies(version, comparator)
    setResult(
      checked.ok
        ? {
            ok: true,
            output: checked.satisfies
              ? `${version.trim()} satisfies ${comparator.trim()}`
              : `${version.trim()} does not satisfy ${comparator.trim()}`,
          }
        : { ok: false, error: checked.error },
    )
  }

  const handleClear = () => {
    setVersionA('')
    setVersionB('')
    setSortInput('')
    setVersion('')
    setComparator('')
    setResult(null)
  }

  const hasInput =
    versionA !== '' || versionB !== '' || sortInput !== '' || version !== '' || comparator !== ''

  const outputTestId = `${mode}-output`

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.modeRow}>
          <span>Mode</span>
          <select
            className="field"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value)}
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {mode === 'compare' ? (
          <div className={styles.inputRow}>
            <input
              className="field"
              aria-label="Version A"
              value={versionA}
              onChange={(event) => setVersionA(event.target.value)}
              placeholder="1.2.3"
              spellCheck={false}
            />
            <input
              className="field"
              aria-label="Version B"
              value={versionB}
              onChange={(event) => setVersionB(event.target.value)}
              placeholder="2.0.0"
              spellCheck={false}
            />
          </div>
        ) : null}

        {mode === 'sort' ? (
          <>
            <label className={styles.modeRow}>
              <span>Order</span>
              <select
                className="field"
                aria-label="Sort direction"
                value={sortDirection}
                onChange={(event) => {
                  if (event.target.value === 'asc' || event.target.value === 'desc') {
                    setSortDirection(event.target.value)
                  }
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <textarea
              className="field"
              aria-label="Versions to sort"
              value={sortInput}
              onChange={(event) => setSortInput(event.target.value)}
              placeholder={'1.0.0\n1.2.3-alpha\n2.0.0'}
              rows={8}
              spellCheck={false}
            />
          </>
        ) : null}

        {mode === 'range' ? (
          <div className={styles.inputRow}>
            <input
              className="field"
              aria-label="Version to check"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="1.2.3"
              spellCheck={false}
            />
            <input
              className="field"
              aria-label="Comparator"
              value={comparator}
              onChange={(event) => setComparator(event.target.value)}
              placeholder=">=1.0.0"
              spellCheck={false}
            />
          </div>
        ) : null}
      </Panel>

      <ActionArea>
        <Button onClick={handleRun}>{RUN_LABELS[mode]}</Button>
        <Button variant="secondary" onClick={handleClear} disabled={!hasInput && result === null}>
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <pre className={styles.output} data-testid={outputTestId}>
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Result will appear here.</p> : null}
      </Panel>
    </div>
  )
}
