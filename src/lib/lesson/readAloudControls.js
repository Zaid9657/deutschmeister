/** A capture failure allows an unassessed confirmation while recording can still be retried. */
export function canSelfConfirmReadAloud({ scoringPossible, phase, canRetry, micError }) {
  if (phase === 'recording' || phase === 'scoring') return false;
  return !!micError || !scoringPossible || (phase === 'scored' && !canRetry);
}

export function canRetryReadAloud({ phase, attempts, maxAttempts, micError }) {
  return attempts < maxAttempts && (phase === 'scored' || (phase === 'idle' && !!micError));
}
