import { isMissingSchema, logMigrationPending } from './migrationPending.mjs';

// Prefer an atomic reservation. While its migration is pending, callers can
// reserve in the old ledger; every other database error still stops spending.
export async function reserveUsage(db, name, args, fallback) {
  if (!db) throw new Error('Usage storage unavailable');
  let result;
  try {
    result = await db.rpc(name, args);
  } catch (error) {
    if (!isMissingSchema(error)) throw error;
    result = { error };
  }
  let { data, error } = result;
  if (error && isMissingSchema(error) && fallback) {
    logMigrationPending(name);
    data = await fallback();
    error = null;
  }
  if (error || !data || typeof data.allowed !== 'boolean' ||
      !Number.isSafeInteger(data.used) || data.used < 0 || (data.allowed && !data.id)) {
    throw new Error(error?.message || 'Usage reservation failed');
  }
  return data;
}

export function validAnonymousId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

export function validExamAttemptId(value) {
  return value == null || (typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}
