import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import '../global.css';
import {
  configureNotifications,
  requestPermissions,
  clearAllScheduledNotifications,
  scheduleRoutineReminders,
} from '@/services/notificationService';
import { initAppStateListener, removeAppStateListener } from '@/services/appStateService';
import { playAlarm, stopAlarm } from '@/services/audioService';
import { registerAlarmTask } from '@/services/alarmTask';
import { useRoutineStore } from '@/stores/useRoutineStore';

function handleRoutineStartNotification(data: Record<string, unknown> | undefined) {
  if (data?.type !== 'routine-start') return;
  const routineType = data.routineType as 'morning' | 'night';
  const { morningRoutine, nightRoutine } = useRoutineStore.getState();
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;
  if (routine.selectedAudioId) {
    playAlarm(routine.selectedAudioId);
  }
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
    requestPermissions();
    registerAlarmTask();
    initAppStateListener(useRoutineStore.getState);

    // Stop any alarm that was playing when the app opens
    stopAlarm();

    // Clear stale notifications from previous sessions, then schedule fresh routine reminders
    const { morningRoutine, nightRoutine } = useRoutineStore.getState();
    clearAllScheduledNotifications().then(() => {
      scheduleRoutineReminders(
        morningRoutine.targetTime,
        nightRoutine.targetTime,
        morningRoutine.selectedAudioId,
        nightRoutine.selectedAudioId,
      );
    });

    // Play alarm audio when a routine start notification fires
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      handleRoutineStartNotification(notification.request.content.data);
    });

    // Also play alarm when user taps the notification to open the app
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      handleRoutineStartNotification(response.notification.request.content.data);
    });

    return () => {
      removeAppStateListener();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
