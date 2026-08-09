import { useState } from 'react'
import { ActionArea, Button, Panel, Status } from '@tool-forge/ui'
import { analyzePassword, type PasswordAnalysis } from './logic'
import styles from './Tool.module.css'

export function PasswordStrengthCheckerTool() {
  const [input, setInput] = useState('')
  const analysis: PasswordAnalysis = analyzePassword(input)

  const handleClear = () => {
    setInput('')
  }

  return (
    <div className={styles.layout}>
      <Panel title="Password">
        <input
          className="field"
          type="text"
          aria-label="Password input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a password to analyze…"
          autoComplete="off"
          spellCheck={false}
        />
        <ActionArea>
          <Button variant="secondary" onClick={handleClear} disabled={input === ''}>
            Clear
          </Button>
        </ActionArea>
        <Status kind="info">
          The password is processed only in your browser and never leaves your device. This is a
          heuristic estimate — no common-password dictionary is used.
        </Status>
      </Panel>

      <Panel title="Strength">
        <div className={styles.scoreRow} data-testid="password-score">
          <strong className={styles.scoreValue}>{analysis.score} / 4</strong>
          <span className={styles.scoreLabel}>{analysis.label}</span>
        </div>
        <div className={styles.scoreBar} aria-hidden="true">
          <div
            className={styles.scoreBarFill}
            style={{ width: `${(analysis.score / 4) * 100}%` }}
          />
        </div>
        <p className={styles.entropy} data-testid="password-entropy">
          Estimated entropy: {analysis.entropyBits} bits
        </p>
        <ul className={styles.checks} data-testid="password-checks">
          {analysis.checks.map((check) => (
            <li
              key={check.id}
              className={check.passed ? styles.checkPassed : styles.checkFailed}
              data-passed={check.passed}
            >
              {check.passed ? '✓' : '✗'} {check.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
