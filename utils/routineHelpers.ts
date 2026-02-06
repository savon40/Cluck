import type { RoutineType } from '@/types';

export function parseTargetTime(timeStr: string): { hours24: number; minutes: number } {
  const [time, period] = timeStr.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hours24 = h;
  if (period === 'PM' && h !== 12) hours24 += 12;
  if (period === 'AM' && h === 12) hours24 = 0;
  return { hours24, minutes: m };
}

export function getActiveRoutineType(
  morningTime: string,
  nightTime: string,
  morningComplete?: boolean,
  nightComplete?: boolean,
): RoutineType {
  // If one routine is complete and the other isn't, show the incomplete one
  if (morningComplete && !nightComplete) return 'night';
  if (nightComplete && !morningComplete) return 'morning';

  // Both complete or neither complete → fall back to time-proximity logic
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const morning = parseTargetTime(morningTime);
  const night = parseTargetTime(nightTime);
  const morningMins = morning.hours24 * 60 + morning.minutes;
  const nightMins = night.hours24 * 60 + night.minutes;

  const distToMorning = Math.min(
    ((morningMins - current) + 1440) % 1440,
    ((current - morningMins) + 1440) % 1440,
  );
  const distToNight = Math.min(
    ((nightMins - current) + 1440) % 1440,
    ((current - nightMins) + 1440) % 1440,
  );

  return distToMorning <= distToNight ? 'morning' : 'night';
}

/** Check whether the current time is within `windowMinutes` of the target time. */
export function isWithinRoutineWindow(targetTime: string, windowMinutes: number): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const { hours24, minutes } = parseTargetTime(targetTime);
  const targetMins = hours24 * 60 + minutes;

  // Shortest distance on a 24h circular clock
  const dist = Math.min(
    ((targetMins - current) + 1440) % 1440,
    ((current - targetMins) + 1440) % 1440,
  );

  return dist <= windowMinutes;
}
