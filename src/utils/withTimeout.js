/**
 * Wrap a promise with a timeout so a hung network request surfaces as an
 * error instead of an infinite loading state.
 */
export function withTimeout(promise, ms = 10000, message = 'Request timed out') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
