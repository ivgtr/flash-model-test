import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[tool-forge] tool crashed:', error, info)
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <Link to="/">Back to all tools</Link>
        </div>
      )
    }
    return this.props.children
  }
}
