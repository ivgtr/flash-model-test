import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  parseQueryString,
  serializeQueryString,
  type QueryPair,
  type QueryParseResult,
  type QuerySerializeResult,
} from './logic'
import styles from './Tool.module.css'

type Mode = 'parse' | 'serialize'

const makeEmptyPair = (): QueryPair => ['', '']

export function QueryStringParserTool() {
  const [mode, setMode] = useState<Mode>('parse')
  const [parseInput, setParseInput] = useState('')
  const [parseResult, setParseResult] = useState<QueryParseResult | null>(null)
  const [pairs, setPairs] = useState<QueryPair[]>([makeEmptyPair()])
  const [serializeResult, setSerializeResult] = useState<QuerySerializeResult | null>(null)

  const handleModeChange = (value: string) => {
    if (value === 'parse' || value === 'serialize') {
      setMode(value)
      setParseResult(null)
      setSerializeResult(null)
    }
  }

  const handleParse = () => {
    setParseResult(parseQueryString(parseInput))
  }

  const handleSerialize = () => {
    setSerializeResult(serializeQueryString(pairs))
  }

  const updatePair = (index: number, field: 'key' | 'value', value: string) => {
    setPairs((prev) =>
      prev.map((pair, i): QueryPair =>
        i === index ? (field === 'key' ? [value, pair[1]] : [pair[0], value]) : pair,
      ),
    )
  }

  const addPair = () => {
    setPairs((prev) => [...prev, makeEmptyPair()])
  }

  const removePair = (index: number) => {
    setPairs((prev) => prev.filter((_, i) => i !== index))
  }

  const serializedForCopy =
    parseResult?.ok === true ? serializeQueryString(parseResult.output) : undefined

  return (
    <div className={styles.layout}>
      <Panel title="Mode">
        <select
          className="field"
          aria-label="Mode"
          value={mode}
          onChange={(event) => handleModeChange(event.target.value)}
        >
          <option value="parse">Parse (query string → pairs)</option>
          <option value="serialize">Serialize (pairs → query string)</option>
        </select>
      </Panel>

      {mode === 'parse' ? (
        <>
          <Panel title="Input">
            <textarea
              className="field"
              aria-label="Query string input"
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
              placeholder="?a=1&b=2"
              rows={5}
              spellCheck={false}
            />
            <ActionArea>
              <Button onClick={handleParse}>Parse</Button>
            </ActionArea>
          </Panel>

          <Panel
            title="Output"
            actions={
              parseResult?.ok && serializedForCopy?.ok === true ? (
                <CopyButton value={serializedForCopy.output} />
              ) : undefined
            }
          >
            {parseResult?.ok ? (
              <ul className={styles.pairs} data-testid="query-pairs">
                {parseResult.output.map((pair, index) => (
                  <li key={index} className={styles.pairRow}>
                    <span className={styles.pairKey}>{pair[0]}</span>
                    <span>=</span>
                    <span className={styles.pairValue}>{pair[1]}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {parseResult !== null && !parseResult.ok ? (
              <Status kind="error">{parseResult.error}</Status>
            ) : null}
            {parseResult === null ? <p className="muted">Parsed pairs will appear here.</p> : null}
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Pairs">
            <ul className={styles.pairs}>
              {pairs.map((pair, index) => (
                <li key={index} className={styles.pairInputRow}>
                  <input
                    className="field"
                    aria-label={`Key ${index + 1}`}
                    value={pair[0]}
                    onChange={(event) => updatePair(index, 'key', event.target.value)}
                    placeholder="key"
                    spellCheck={false}
                  />
                  <span>=</span>
                  <input
                    className="field"
                    aria-label={`Value ${index + 1}`}
                    value={pair[1]}
                    onChange={(event) => updatePair(index, 'value', event.target.value)}
                    placeholder="value"
                    spellCheck={false}
                  />
                  <Button variant="secondary" onClick={() => removePair(index)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <ActionArea>
              <Button variant="secondary" onClick={addPair}>
                Add pair
              </Button>
              <Button onClick={handleSerialize}>Serialize</Button>
            </ActionArea>
          </Panel>

          <Panel
            title="Output"
            actions={
              serializeResult?.ok ? <CopyButton value={serializeResult.output} /> : undefined
            }
          >
            {serializeResult?.ok ? (
              <pre className={styles.output} data-testid="query-string-output">
                {serializeResult.output}
              </pre>
            ) : null}
            {serializeResult !== null && !serializeResult.ok ? (
              <Status kind="error">{serializeResult.error}</Status>
            ) : null}
            {serializeResult === null ? (
              <p className="muted">Serialized query string will appear here.</p>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  )
}
