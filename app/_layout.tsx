import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { configureNotifications, requestPermissions } from '@/services/notificationService';
import { initAppStateListener, removeAppStateListener } from '@/services/appStateService';
import { useRoutineStore } from '@/stores/useRoutineStore';

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
    requestPermissions();
    initAppStateListener(useRoutineStore.getState);

    return () => {
      removeAppStateListener();
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
