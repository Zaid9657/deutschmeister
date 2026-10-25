/** The recap promises only the earliest saved card schedule, including overdue cards. */
export function recapReviewSchedule(dueAt, now = Date.now()) {
  const date = dueAt ? new Date(dueAt) : null;
  if (!date || !Number.isFinite(date.getTime())) return { state: 'unscheduled', date: null };
  return { state: date.getTime() <= now ? 'due' : 'next', date };
}
