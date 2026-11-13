import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred while initializing the store.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Store runtime error:', error, info.componentStack);
    const msg = error?.message || '';
    const isStaleModuleMismatch =
      msg.includes('Invalid hook call') ||
      msg.includes("Cannot read properties of null (reading 'use") ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed');

    if (isStaleModuleMismatch && typeof window !== 'undefined') {
      try {
        const key = 'nitrr_stale_module_reload_at';
        const lastReload = Number(window.sessionStorage.getItem(key) || '0');
        const now = Date.now();
        if (!lastReload || now - lastReload > 15_000) {
          window.sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, message: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--paper)] text-[var(--ink)] font-sans">
          <div className="max-w-md w-full rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] p-8 space-y-5 shadow-xl">
            <div className="w-11 h-11 rounded-[var(--r-in)] bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] block">
                NIT RAIPUR STORE
              </span>
              <h1 className="font-display text-2xl font-normal text-[var(--ink)] tracking-tight">
                Unable to load this view
              </h1>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {this.state.message}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 min-h-[42px] px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-mono text-xs uppercase tracking-wider font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 min-h-[42px] px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--accent)] text-[var(--ink)] font-mono text-xs uppercase tracking-wider font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
