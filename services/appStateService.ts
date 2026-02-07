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

const MAX_SCHEDULED_NAGS = 30;

function startNagging(): void {
  stopNagging();

  if (!shouldStartNagging() || !getStore) return;

  const { morningRoutine, nightRoutine } = getStore();
  const routineType = getActiveRoutineType(morningRoutine.targetTime, nightRoutine.targetTime);
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;
  const intervalMs = getIntervalForAggressiveness(routine.notificationAggressiveness);
  const intervalSeconds = Math.round(intervalMs / 1000);

  // Pre-schedule multiple notifications so they fire even while backgrounded
  for (let i = 1; i <= MAX_SCHEDULED_NAGS; i++) {
    scheduleNagNotification(intervalSeconds * i);
  }
}

export function stopNagging(): void {
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
