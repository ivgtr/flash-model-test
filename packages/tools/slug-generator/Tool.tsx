import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel } from '@tool-forge/ui'
import { slugify } from './logic'
import styles from './Tool.module.css'

export function SlugGeneratorTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')

  const handleClear = () => {
    setInput('')
    setResult('')
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <textarea
          className="field"
          aria-label="Slug input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. Hello World!"
          rows={6}
          spellCheck={false}
        />
      </Panel>

      <ActionArea>
        <Button onClick={() => setResult(slugify(input))}>Convert</Button>
        <Button variant="secondary" onClick={handleClear} disabled={input === '' && result === ''}>
          Clear
        </Button>
      </ActionArea>

      <Panel title="Output" actions={result !== '' ? <CopyButton value={result} /> : undefined}>
        {result !== '' ? (
          <pre className={styles.output} data-testid="slug-output">
            {result}
          </pre>
        ) : (
          <p className="muted">The generated slug will appear here.</p>
        )}
      </Panel>
    </div>
  )
}
