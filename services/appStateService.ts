import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import {
  scheduleNagNotification,
  cancelAllNags,
  getIntervalForAggressiveness,
} from './notificationService';
import { getActiveRoutineType, isWithinRoutineWindow, getMinutesUntilNagCutoff } from '@/utils/routineHelpers';
import type { Routine } from '@/types';

interface StoreState {
  morningRoutine: Routine;
  nightRoutine: Routine;
  checkNewDay: () => void;
  loadData: () => void;
}

type GetStoreState = () => StoreState;

let subscription: NativeEventSubscription | null = null;
let getStore: GetStoreState | null = null;

const MAX_SCHEDULED_NAGS = 30;
const NAG_CUTOFF_MINUTES = 120; // Stop nagging 2 hours after routine start

function shouldStartNagging(): boolean {
  if (!getStore) return false;

  const { morningRoutine, nightRoutine } = getStore();
  const routineType = getActiveRoutineType(morningRoutine.targetTime, nightRoutine.targetTime);
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;

  if (!routine.isActive) return false;
  if (routine.habits.every((h) => h.completed)) return false;
  if (!isWithinRoutineWindow(routine.targetTime, 120)) return false;
  if (getMinutesUntilNagCutoff(routine.targetTime, NAG_CUTOFF_MINUTES) === 0) return false;

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

  // Cap nags so they don't fire past 2 hours after routine start
  const remainingSeconds = getMinutesUntilNagCutoff(routine.targetTime, NAG_CUTOFF_MINUTES) * 60;
  const maxNags = Math.min(MAX_SCHEDULED_NAGS, Math.floor(remainingSeconds / intervalSeconds));

  for (let i = 1; i <= maxNags; i++) {
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
    if (getStore) {
      getStore().checkNewDay();
    }
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
