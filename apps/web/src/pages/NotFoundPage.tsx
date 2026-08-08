import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="container">
      <h1>Not found</h1>
      <p className="muted">The page or tool you are looking for does not exist.</p>
      <Link to="/">Back to all tools</Link>
    </div>
  )
}
