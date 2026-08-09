import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { MIME_CATEGORIES, searchMimeTypes, type MimeCategory } from './logic'
import styles from './Tool.module.css'

const CATEGORY_LABELS: Record<MimeCategory, string> = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  application: 'Application',
  font: 'Font',
}

const CATEGORY_OPTIONS = ['all', ...MIME_CATEGORIES] as const

export function MimeTypeReferenceTool() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MimeCategory | 'all'>('all')

  const selectedCategory = category === 'all' ? null : category
  const results = searchMimeTypes(query, selectedCategory)

  const handleCategoryChange = (value: string) => {
    if (CATEGORY_OPTIONS.includes(value as (typeof CATEGORY_OPTIONS)[number])) {
      setCategory(value as MimeCategory | 'all')
    }
  }

  const handleClear = () => {
    setQuery('')
    setCategory('all')
  }

  const copyValue = results
    .map((entry) => `${entry.type} (${entry.extensions.map((ext) => `.${ext}`).join(', ')})`)
    .join('\n')

  return (
    <div className={styles.layout}>
      <Panel title="Search">
        <div className={styles.searchRow}>
          <input
            className="field"
            type="search"
            aria-label="Search MIME types"
            placeholder="e.g. png, .js, image/png"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="field"
            aria-label="Category"
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All categories' : CATEGORY_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <ActionArea>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={query === '' && category === 'all'}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel title="Results" actions={<CopyButton value={copyValue} label="Copy results" />}>
        {results.length === 0 ? (
          <Status kind="info">No results found{query !== '' ? ` for "${query}"` : ''}.</Status>
        ) : (
          <>
            <p className={styles.count}>
              {results.length} {results.length === 1 ? 'entry' : 'entries'}
            </p>
            <table className={styles.table} aria-label="Search results">
              <thead>
                <tr>
                  <th scope="col">MIME type</th>
                  <th scope="col">Extensions</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                </tr>
              </thead>
              <tbody>
                {results.map((entry) => (
                  <tr key={entry.type}>
                    <td>
                      <code>{entry.type}</code>
                    </td>
                    <td>{entry.extensions.map((ext) => `.${ext}`).join(', ')}</td>
                    <td>{entry.description}</td>
                    <td>{CATEGORY_LABELS[entry.category]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>
    </div>
  )
}
