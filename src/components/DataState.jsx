import { RefreshCw, WifiOff } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

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
        <div className="animate-spin w-8 h-8 border-4 border-rule border-t-siegel rounded-full" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center px-4">
        <Card className="max-w-sm w-full text-center p-8">
          <WifiOff className="w-10 h-10 text-graphite mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Couldn't load this page</h2>
          <p className="text-sm text-graphite mb-6">
            Please check your connection and try again.
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return children;
}
