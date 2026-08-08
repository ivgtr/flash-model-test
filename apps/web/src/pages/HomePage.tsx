import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, groupByCategory } from '@tool-forge/core'
import { toolRegistry } from '../app/tool-loader'

export function HomePage() {
  const [query, setQuery] = useState('')
  const tools = useMemo(() => toolRegistry.search(query), [query])
  const groups = useMemo(() => groupByCategory(tools), [tools])

  return (
    <div className="container">
      <header className="hero">
        <h1>Tool Forge</h1>
        <p>
          A collection of small, self-contained developer utilities that run entirely in your
          browser.
        </p>
      </header>

      <input
        className="field searchField"
        type="search"
        aria-label="Search tools"
        placeholder={`Search ${toolRegistry.size} tools…`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {tools.length === 0 ? (
        <p className="muted">No tools match “{query}”.</p>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="category">
            <h2>{CATEGORY_LABELS[group.category]}</h2>
            <ul className="toolList">
              {group.tools.map((tool) => (
                <li key={tool.id}>
                  <Link className="toolCard" to={`/tools/${tool.id}`}>
                    <span className="toolName">{tool.name}</span>
                    <span className="toolDescription">{tool.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
