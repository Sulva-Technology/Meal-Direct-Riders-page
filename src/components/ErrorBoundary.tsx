import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render/runtime errors in the tree so a single crash doesn't blank the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for debugging; a real backend log sink can hook in here later.
    console.error('Unhandled error in UI tree:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-50 to-slate-100 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Something broke</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
