import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  DIRECTIONS,
  DIRECTION_LABELS,
  convertYamlJson,
  type Direction,
  type YamlConvertResult,
} from './logic'
import styles from './Tool.module.css'

export function YamlJsonConverterTool() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState<Direction>('yaml-to-json')
  const [result, setResult] = useState<YamlConvertResult | null>(null)

  const handleDirectionChange = (value: string) => {
    if (value === 'yaml-to-json' || value === 'json-to-yaml') {
      setDirection(value)
    }
  }

  const handleConvert = () => {
    setResult(convertYamlJson(input, direction))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.optionRow}>
          <span>Direction</span>
          <select
            className="field"
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value)}
          >
            {DIRECTIONS.map((option) => (
              <option key={option} value={option}>
                {DIRECTION_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="field"
          aria-label="YAML/JSON input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={direction === 'yaml-to-json' ? 'name: tool-forge' : '{"name": "tool-forge"}'}
          rows={12}
          spellCheck={false}
        />
        <p className="muted">
          Supported YAML subset: block mappings, block sequences, plain and quoted scalars, numbers
          / booleans / null, inline comments. Anchors, aliases, tags, multi-document, block scalars
          (| &gt;), flow collections and merge keys are not supported and are reported as errors.
        </p>
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

      <Panel title="Output" actions={result?.ok ? <CopyButton value={result.output} /> : undefined}>
        {result?.ok ? (
          <pre className={styles.output} data-testid="yaml-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Converted text will appear here.</p> : null}
      </Panel>
    </div>
  )
}
