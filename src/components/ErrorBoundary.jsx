import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { safeGet, safeSet } from '../utils/safeStorage';
import Button from './ui/Button';
import Card from './ui/Card.jsx';

function isChunkLoadError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('is not a valid JavaScript MIME type') ||
    msg.includes("Expected a JavaScript")
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Auto-reload once for stale chunk errors (new deploy invalidated old assets)
    if (isChunkLoadError(error)) {
      const key = 'chunk_reload_ts';
      const last = safeGet(key, { session: true });
      const now = Date.now();
      // Only auto-reload if we haven't done so in the last 10 seconds (prevent loop)
      if (!last || now - Number(last) > 10000) {
        safeSet(key, String(now), { session: true });
        window.location.reload();
        return;
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-4">
          <Card raised className="max-w-md w-full p-8 text-center">
            {/* Error state: himbeer wash/ink with an icon AND the words (playbook §1). */}
            <div className="w-16 h-16 rounded-full bg-accent-himbeer-wash flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-accent-himbeer-ink" aria-hidden="true" />
            </div>
            <h1 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-2">
              Something went wrong
            </h1>
            <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-8">
              {isChunkLoadError(this.state.error)
                ? 'A new version is available. Please refresh the page.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} size="lg">
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button onClick={this.handleGoHome} variant="secondary" size="lg">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
