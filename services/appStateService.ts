import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import {
  scheduleNagNotification,
  cancelAllNags,
  getIntervalForAggressiveness,
} from './notificationService';
import { getActiveRoutineType, isWithinRoutineWindow } from '@/utils/routineHelpers';
import type { Routine } from '@/types';

interface StoreState {
  morningRoutine: Routine;
  nightRoutine: Routine;
}

type GetStoreState = () => StoreState;

let subscription: NativeEventSubscription | null = null;
let nagTimer: ReturnType<typeof setInterval> | null = null;
let getStore: GetStoreState | null = null;

function shouldStartNagging(): boolean {
  if (!getStore) return false;

  const { morningRoutine, nightRoutine } = getStore();
  const routineType = getActiveRoutineType(morningRoutine.targetTime, nightRoutine.targetTime);
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;

  if (!routine.isActive) return false;
  if (routine.habits.every((h) => h.completed)) return false;
  if (!isWithinRoutineWindow(routine.targetTime, 120)) return false;

  return true;
}

function startNagging(): void {
  stopNagging();

  if (!shouldStartNagging() || !getStore) return;

  const { morningRoutine, nightRoutine } = getStore();
  const routineType = getActiveRoutineType(morningRoutine.targetTime, nightRoutine.targetTime);
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;
  const intervalMs = getIntervalForAggressiveness(routine.notificationAggressiveness);
  const intervalSeconds = Math.round(intervalMs / 1000);

  // Schedule the first notification
  scheduleNagNotification(intervalSeconds);

  // Keep scheduling at the configured interval
  nagTimer = setInterval(() => {
    if (!shouldStartNagging()) {
      stopNagging();
      return;
    }
    scheduleNagNotification(intervalSeconds);
  }, intervalMs);
}

export function stopNagging(): void {
  if (nagTimer !== null) {
    clearInterval(nagTimer);
    nagTimer = null;
  }
  cancelAllNags();
}

function handleAppStateChange(nextState: AppStateStatus): void {
  if (nextState === 'background' || nextState === 'inactive') {
    startNagging();
  } else if (nextState === 'active') {
    stopNagging();
  }
}

export function initAppStateListener(getStoreState: GetStoreState): void {
  getStore = getStoreState;
  subscription = AppState.addEventListener('change', handleAppStateChange);
}

export function removeAppStateListener(): void {
  stopNagging();
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  getStore = null;
}
