// RPCs own the quota check and insert in one transaction. No fallback to a
// client-side count: an absent migration or failed insert must stop spending.
export async function reserveUsage(db, name, args) {
  if (!db) throw new Error('Usage storage unavailable');
  const { data, error } = await db.rpc(name, args);
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
