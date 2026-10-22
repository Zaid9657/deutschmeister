const missingSchemaCodes = new Set(['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703']);
const logged = new Set();

export function isMissingSchema(error) {
  return missingSchemaCodes.has(error?.code);
}

export function logMigrationPending(name) {
  if (logged.has(name)) return;
  logged.add(name);
  console.warn(`[migration pending] ${name}`);
}
