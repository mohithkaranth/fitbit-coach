const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getStartOfSingaporeDay(date: Date) {
  const singaporeTimeMs = date.getTime() + SGT_OFFSET_MS;
  const singaporeDayStartMs = Math.floor(singaporeTimeMs / DAY_MS) * DAY_MS;
  return new Date(singaporeDayStartMs - SGT_OFFSET_MS);
}

export function getNextStartOfSingaporeDay(date: Date) {
  return new Date(getStartOfSingaporeDay(date).getTime() + DAY_MS);
}
