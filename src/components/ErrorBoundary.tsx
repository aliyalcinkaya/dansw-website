import { Component, type ErrorInfo, type ReactNode } from 'react';
import { trackAnalyticsEvent } from '../services/analytics';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an exception:', error, errorInfo);

    void trackAnalyticsEvent('Client error boundary triggered', {
      error_message: error.message,
      component_stack: errorInfo.componentStack?.slice(0, 500),
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl text-[var(--color-primary)] mb-3">Something went wrong</h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              We hit an unexpected error. Please reload and try again.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
