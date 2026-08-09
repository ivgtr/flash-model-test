import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import {
  AUTO_FRACTION_DIGITS,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_STYLE,
  FRACTION_DIGITS_MAX,
  FRACTION_DIGITS_MIN,
  LOCALE_OPTIONS,
  STYLE_OPTIONS,
  formatNumber,
  parseFractionDigits,
  parseStyle,
  type NumberFormatOptions,
  type NumberFormatResult,
  type NumberStyle,
} from './logic'
import styles from './Tool.module.css'

const STYLE_LABELS: Record<NumberStyle, string> = {
  decimal: 'Decimal',
  percent: 'Percent',
  currency: 'Currency',
}

const LOCALE_LABELS: Record<string, string> = {
  'en-US': 'English (US)',
  'ja-JP': 'Japanese (Japan)',
  'de-DE': 'German (Germany)',
  'fr-FR': 'French (France)',
  'zh-CN': 'Chinese (China)',
  'es-ES': 'Spanish (Spain)',
  'pt-BR': 'Portuguese (Brazil)',
  'it-IT': 'Italian (Italy)',
  'ko-KR': 'Korean (Korea)',
}

const FRACTION_DIGIT_OPTIONS: readonly string[] = [
  AUTO_FRACTION_DIGITS,
  ...Array.from({ length: FRACTION_DIGITS_MAX - FRACTION_DIGITS_MIN + 1 }, (_, index) =>
    String(FRACTION_DIGITS_MIN + index),
  ),
]

export function NumberFormatterTool() {
  const [input, setInput] = useState('')
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE)
  const [style, setStyle] = useState<NumberStyle>(DEFAULT_STYLE)
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  const [minFractionDigits, setMinFractionDigits] = useState<string>(AUTO_FRACTION_DIGITS)
  const [maxFractionDigits, setMaxFractionDigits] = useState<string>(AUTO_FRACTION_DIGITS)
  const [useGrouping, setUseGrouping] = useState(true)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [result, setResult] = useState<NumberFormatResult | null>(null)

  const handleStyleChange = (value: string) => {
    const parsed = parseStyle(value)
    if (parsed !== null) {
      setStyle(parsed)
    }
  }

  const handleFormat = () => {
    const parsedMin = parseFractionDigits(minFractionDigits)
    const parsedMax = parseFractionDigits(maxFractionDigits)
    const options: NumberFormatOptions = {
      locale,
      style,
      currency,
      minimumFractionDigits: parsedMin === null ? undefined : parsedMin,
      maximumFractionDigits: parsedMax === null ? undefined : parsedMax,
      useGrouping,
      prefix,
      suffix,
    }
    setResult(formatNumber(input, options))
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <div className={styles.row}>
          <label className={styles.fieldRow}>
            <span>Locale</span>
            <select
              className="field"
              aria-label="Locale"
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              {LOCALE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {LOCALE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldRow}>
            <span>Style</span>
            <select
              className="field"
              aria-label="Style"
              value={style}
              onChange={(event) => handleStyleChange(event.target.value)}
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {STYLE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {style === 'currency' ? (
          <label className={styles.fieldRow}>
            <span>Currency</span>
            <select
              className="field"
              aria-label="Currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className={styles.row}>
          <label className={styles.fieldRow}>
            <span>Min fraction digits</span>
            <select
              className="field"
              aria-label="Min fraction digits"
              value={minFractionDigits}
              onChange={(event) => setMinFractionDigits(event.target.value)}
            >
              {FRACTION_DIGIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === AUTO_FRACTION_DIGITS ? 'Auto' : option}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fieldRow}>
            <span>Max fraction digits</span>
            <select
              className="field"
              aria-label="Max fraction digits"
              value={maxFractionDigits}
              onChange={(event) => setMaxFractionDigits(event.target.value)}
            >
              {FRACTION_DIGIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === AUTO_FRACTION_DIGITS ? 'Auto' : option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={useGrouping}
            onChange={(event) => setUseGrouping(event.target.checked)}
          />
          Group thousands
        </label>
        <div className={styles.row}>
          <label className={styles.fieldRow}>
            <span>Prefix</span>
            <input
              className="field"
              aria-label="Prefix"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="e.g. Total: "
              spellCheck={false}
            />
          </label>
          <label className={styles.fieldRow}>
            <span>Suffix</span>
            <input
              className="field"
              aria-label="Suffix"
              value={suffix}
              onChange={(event) => setSuffix(event.target.value)}
              placeholder="e.g. USD"
              spellCheck={false}
            />
          </label>
        </div>
        <input
          className="field"
          aria-label="Number input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. 1234.5"
          spellCheck={false}
        />
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
          <pre className={styles.output} data-testid="number-output">
            {result.output}
          </pre>
        ) : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Formatted number will appear here.</p> : null}
      </Panel>
    </div>
  )
}
