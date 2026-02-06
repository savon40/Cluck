import * as Notifications from 'expo-notifications';

const NAG_MESSAGES = [
  "Your routine isn't done yet!",
  'Get back on track!',
  "You're so close — finish your routine!",
  'Stay locked in. Complete your habits.',
  "Don't break the streak!",
  'Your future self will thank you.',
  'Almost there — just a few habits left!',
  'Come back and crush your routine.',
];

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

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Locked In',
      body: message,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}

/** Cancel all scheduled and delivered notifications. */
export async function cancelAllNags(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}
