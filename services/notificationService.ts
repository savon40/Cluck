import * as Notifications from 'expo-notifications';
import { parseTargetTime } from '@/utils/routineHelpers';

const NAG_MESSAGES = [
  "Your routine isn't done yet!",
  'Get back on track!',
  "You're so close — finish your routine!",
  'Stay on track. Complete your habits.',
  "Don't break the streak!",
  'Your future self will thank you.',
  'Almost there — just a few habits left!',
  'Come back and crush your routine.',
];

// Track notification IDs for selective cancellation
let nagIds: string[] = [];
let routineReminderIds: string[] = [];

/** Interval in ms for each aggressiveness level. */
export function getIntervalForAggressiveness(level: 'low' | 'medium' | 'high'): number {
  switch (level) {
    case 'low':
      return 600_000; // 10 min
    case 'medium':
      return 300_000; // 5 min
    case 'high':
      return 120_000; // 2 min
  }
}

/** Configure how notifications are handled when the app is foregrounded. */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Schedule a local notification after `delaySeconds`. */
export async function scheduleNagNotification(delaySeconds: number): Promise<void> {
  const message = NAG_MESSAGES[Math.floor(Math.random() * NAG_MESSAGES.length)];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cluck',
      body: message,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
  nagIds.push(id);
}

/** Cancel only nag notifications (preserves routine reminders). */
export async function cancelAllNags(): Promise<void> {
  for (const id of nagIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Notification may have already fired
    }
  }
  nagIds = [];
  await Notifications.dismissAllNotificationsAsync();
}

/** Subtract minutes from a time, handling wrap-around midnight. */
function subtractMinutes(hours: number, minutes: number, subtractMins: number): { hours: number; minutes: number } {
  let totalMins = hours * 60 + minutes - subtractMins;
  if (totalMins < 0) totalMins += 1440;
  return { hours: Math.floor(totalMins / 60), minutes: totalMins % 60 };
}

/** Cancel routine reminder notifications. */
async function cancelRoutineReminders(): Promise<void> {
  for (const id of routineReminderIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Notification may have already been cancelled
    }
  }
  routineReminderIds = [];
}

/** Schedule daily routine reminder notifications (5-min warning + start) for both routines. */
export async function scheduleRoutineReminders(morningTime: string, nightTime: string): Promise<void> {
  await cancelRoutineReminders();

  const morning = parseTargetTime(morningTime);
  const night = parseTargetTime(nightTime);

  // Morning: 5 minutes before
  const morningWarning = subtractMinutes(morning.hours24, morning.minutes, 5);
  const id1 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cluck',
      body: 'Your morning routine starts in 5 minutes',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: morningWarning.hours,
      minute: morningWarning.minutes,
      repeats: true,
    },
  });

  // Morning: start time
  const id2 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cluck',
      body: 'It is time to begin your morning routine',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: morning.hours24,
      minute: morning.minutes,
      repeats: true,
    },
  });

  // Night: 5 minutes before
  const nightWarning = subtractMinutes(night.hours24, night.minutes, 5);
  const id3 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cluck',
      body: 'Your night routine starts in 5 minutes',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: nightWarning.hours,
      minute: nightWarning.minutes,
      repeats: true,
    },
  });

  // Night: start time
  const id4 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cluck',
      body: 'It is time to begin your night routine',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: night.hours24,
      minute: night.minutes,
      repeats: true,
    },
  });

  routineReminderIds = [id1, id2, id3, id4];
}

/** Clear all notifications. Use on app init to remove stale notifications from previous sessions. */
export async function clearAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
  nagIds = [];
  routineReminderIds = [];
}
