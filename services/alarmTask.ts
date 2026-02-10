import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { playAlarm } from './audioService';
import { AUDIO_REQUIRE_MAP } from './audioService';

export const ALARM_TASK_NAME = 'ALARM_NOTIFICATION_TASK';

// Define the background task — this runs even when the app is backgrounded
TaskManager.defineTask(ALARM_TASK_NAME, ({ data, error }) => {
  if (error) return;

  const notificationData = (data as any)?.notification?.request?.content?.data;
  if (notificationData?.type !== 'routine-start') return;

  // We can't access zustand store reliably from a background task,
  // so we read the selectedAudioId from the notification data
  const audioId = notificationData.selectedAudioId as string | undefined;
  if (audioId && AUDIO_REQUIRE_MAP[audioId]) {
    playAlarm(audioId);
  }
});

/** Register the background notification handler. Call once on app startup. */
export async function registerAlarmTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(ALARM_TASK_NAME);
  } catch {
    // Task may already be registered
  }
}
