import { Component, type ErrorInfo, type ReactNode } from 'react'

// Catches render/runtime errors thrown inside a tab so one crashing tab shows a
// readable message instead of unmounting the whole app to a black screen — the
// failure mode that's invisible on iOS standalone (no error overlay there).
//
// Used per-tab in App.tsx with a `key` of the active tab id, so switching tabs
// resets the boundary and the message is scoped to the tab that actually broke.

type Props = { children: ReactNode }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged so it's reachable via Safari Web Inspector / remote debugging.
    console.error('Tab crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <h2 className="error-boundary-title">This tab hit an error</h2>
        <p className="error-boundary-msg">{error.message || String(error)}</p>
        <div className="error-boundary-actions">
          <button className="chip" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button className="chip" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
