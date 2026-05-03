import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary] 3D Scene crashed:', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm">
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center">
              <span className="text-2xl">âš </span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">3D Render Error</h2>
              <p className="text-sm text-slate-400 mt-1">
                {this.state.error?.message || 'WebGL context lost or shader compilation failed'}
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2.5 bg-amber-800 hover:bg-amber-800 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
            >
              Retry
            </button>
            <p className="text-[10px] text-slate-600 font-mono">
              Refresh the page if the problem persists
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}





