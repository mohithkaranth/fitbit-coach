export function getUtcStartOfDayDaysAgo(daysAgo: number) {
  const now = new Date();

  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysAgo,
    0,
    0,
    0,
    0,
  ));
}
