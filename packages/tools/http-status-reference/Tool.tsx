import { useState } from 'react'
import { Panel } from '@tool-forge/ui'
import {
  STATUS_CODE_CATEGORIES,
  STATUS_CODE_CATEGORY_LABELS,
  searchStatusCodes,
  type StatusCategory,
} from './logic'
import styles from './Tool.module.css'

function ResultCount({ count }: { count: number }) {
  return (
    <span className={styles.count} data-testid="result-count">
      {count} {count === 1 ? 'result' : 'results'}
    </span>
  )
}

export function HttpStatusReferenceTool() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<StatusCategory | ''>('')

  const results = searchStatusCodes(query, category === '' ? null : category)

  return (
    <div className={styles.layout}>
      <Panel title="Search">
        <div className={styles.controls}>
          <input
            className="field"
            aria-label="Search status codes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 404 or not found"
            spellCheck={false}
          />
          <select
            className="field"
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value as StatusCategory | '')}
          >
            <option value="">All categories</option>
            {STATUS_CODE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {STATUS_CODE_CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <Panel title="Results" actions={<ResultCount count={results.length} />}>
        {results.length === 0 ? (
          <p className="muted" data-testid="no-results">
            No results found. Try a different search or category.
          </p>
        ) : (
          <table className={styles.table} data-testid="status-code-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((entry) => (
                <tr key={entry.code}>
                  <td>
                    <code>{entry.code}</code>
                  </td>
                  <td>{entry.name}</td>
                  <td>{STATUS_CODE_CATEGORY_LABELS[entry.category]}</td>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
