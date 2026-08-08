import { Suspense, lazy, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ToolHeader, ToolShell } from '@tool-forge/ui'
import { ErrorBoundary } from '../app/ErrorBoundary'
import { loadToolModule, toolRegistry } from '../app/tool-loader'
import { NotFoundPage } from './NotFoundPage'

export function ToolPage() {
  const { toolId } = useParams()
  const definition = toolId === undefined ? undefined : toolRegistry.get(toolId)
  const Tool = useMemo(() => {
    if (toolId === undefined) {
      return null
    }
    return lazy(() => loadToolModule(toolId))
  }, [toolId])

  if (definition === undefined || Tool === null) {
    return <NotFoundPage />
  }

  return (
    <ToolShell>
      <Link className="backLink" to="/">
        ← All tools
      </Link>
      <ToolHeader
        name={definition.name}
        description={definition.description}
        category={definition.category}
      />
      <ErrorBoundary>
        <Suspense fallback={<p className="muted">Loading tool…</p>}>
          <Tool />
        </Suspense>
      </ErrorBoundary>
    </ToolShell>
  )
}
