import { RefreshCw, WifiOff } from 'lucide-react';

/**
 * Shared loading / error UI for data-driven pages, so a failed or hung fetch
 * never leaves the user on a blank screen or infinite spinner.
 *
 *   <DataState loading={loading} error={error} onRetry={refetch}>
 *     …content…
 *   </DataState>
 */
export default function DataState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Loading">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <WifiOff className="w-10 h-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Couldn't load this page</h2>
          <p className="text-sm text-slate-600 mb-6">
            Please check your connection and try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}
