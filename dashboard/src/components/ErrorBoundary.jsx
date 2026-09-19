import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[StrideSense ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-6 m-4 max-w-md mx-auto text-center animate-fade-in border border-rose-500/30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-1">
            Component Recovered
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            An unexpected error occurred in this view. Your sensor telemetry and tracking continue uninterrupted.
          </p>
          <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-left font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto mb-4 border border-rose-500/20">
            {this.state.error?.message || 'Unknown render error'}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold active-press transition-colors shadow-glow-cyan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry View</span>
            </button>
            {this.props.onGoHome && (
              <button
                type="button"
                onClick={this.props.onGoHome}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold active-press transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
