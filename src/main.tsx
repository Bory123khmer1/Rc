import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error instanceof Error ? error.message : 'Unexpected application error',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 text-center">
            <h1 className="text-lg font-bold">RC Timer</h1>
            <p className="text-xs text-zinc-400">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.clear();
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold cursor-pointer"
            >
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
