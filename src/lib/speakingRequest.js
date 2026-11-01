// Includes auth-header acquisition, the HTTP request AND body decoding in the
// deadline. Abort the fetch too, but still settle if an API ignores its signal.
// Never retry automatically: a timed-out turn may already have reached the
// server. Only the learner's explicit retry resends the retained recording.
export async function boundedSpeakingRequest(operation, timeoutMs = 45000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('Speaking request timed out');
          error.name = 'TimeoutError';
          reject(error);
          controller.abort();
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
