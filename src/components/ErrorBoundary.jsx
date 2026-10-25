import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { safeGet, safeSet } from '../utils/safeStorage';
import Button from './ui/Button';
import Card from './ui/Card.jsx';

// How each browser says a lazy chunk is gone — a deploy replaced the hashed
// files, so /assets/* 404s. Only Chrome's wording was recognised, and Safari/iOS
// and Firefox learners met a dead-end error screen after every deploy.
const CHUNK_ERROR_MESSAGES = [
  'Failed to fetch dynamically imported module', // Chrome, Edge
  'Importing a module script failed', // Safari, iOS
  'error loading dynamically imported module', // Firefox
  'Unable to preload CSS', // Vite's preload helper
  'Loading chunk',
  'Loading CSS chunk',
  'is not a valid JavaScript MIME type',
  'Expected a JavaScript',
];

export function isChunkLoadError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return CHUNK_ERROR_MESSAGES.some((text) => msg.includes(text));
}

const RELOAD_KEY = 'chunk_reload_ts';

/**
 * Reload once for a stale chunk. Returns false, and does nothing, when a reload
 * already happened in the last 10 seconds: the new deploy is broken too, so the
 * error screen shows instead of a reload loop. Shared with main.jsx's
 * vite:preloadError listener.
 */
export function reloadForStaleChunk(now = Date.now()) {
  const last = safeGet(RELOAD_KEY, { session: true });
  if (last && now - Number(last) <= 10000) return false;
  safeSet(RELOAD_KEY, String(now), { session: true });
  window.location.reload();
  return true;
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
    if (isChunkLoadError(error) && reloadForStaleChunk()) return;
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
