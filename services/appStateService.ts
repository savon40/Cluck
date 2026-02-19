import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import {
  scheduleNagNotification,
  cancelAllNags,
  getIntervalForAggressiveness,
} from './notificationService';
import { getActiveRoutineType, isWithinRoutineWindow, getMinutesUntilNagCutoff, parseTargetTime } from '@/utils/routineHelpers';
import { armAlarm, disarmAlarm } from './backgroundAlarmService';
import { isAlarmPlaying, ensureAlarmAudible } from './audioService';
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

function armNextRoutineAlarm(): void {
  if (!getStore) return;
  const { morningRoutine, nightRoutine } = getStore();

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const morningParsed = parseTargetTime(morningRoutine.targetTime);
  const nightParsed = parseTargetTime(nightRoutine.targetTime);
  const morningMins = morningParsed.hours24 * 60 + morningParsed.minutes;
  const nightMins = nightParsed.hours24 * 60 + nightParsed.minutes;

  // Forward distance in minutes to each routine
  const morningDist = ((morningMins - currentMins) + 1440) % 1440;
  const nightDist = ((nightMins - currentMins) + 1440) % 1440;

  // Build candidates: must have habits, an audio selection, and be in the future (dist > 1)
  const candidates: { dist: number; time: string; audioId: string }[] = [];
  if (morningRoutine.habits.length > 0 && morningRoutine.selectedAudioId && morningDist > 1) {
    candidates.push({ dist: morningDist, time: morningRoutine.targetTime, audioId: morningRoutine.selectedAudioId });
  }
  if (nightRoutine.habits.length > 0 && nightRoutine.selectedAudioId && nightDist > 1) {
    candidates.push({ dist: nightDist, time: nightRoutine.targetTime, audioId: nightRoutine.selectedAudioId });
  }

  if (candidates.length === 0) return;

  // Arm for the nearest upcoming routine
  candidates.sort((a, b) => a.dist - b.dist);
  armAlarm(candidates[0].time, candidates[0].audioId);
}

function handleAppStateChange(nextState: AppStateStatus): void {
  if (nextState === 'background' || nextState === 'inactive') {
    startNagging();
    armNextRoutineAlarm();
  } else if (nextState === 'active') {
    stopNagging();
    disarmAlarm();
    // iOS can't start audio from background tasks — the player may exist but
    // produce no sound. Re-trigger playback now that we're in the foreground.
    if (isAlarmPlaying()) {
      ensureAlarmAudible();
    }
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
