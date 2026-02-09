import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { Routine, StreakData, Settings, AudioClip, DayCompletion } from '@/types';

export const storage: MMKV = createMMKV();

// Keys
const KEYS = {
  MORNING_ROUTINE: 'morning_routine',
  NIGHT_ROUTINE: 'night_routine',
  STREAK_DATA: 'streak_data',
  SETTINGS: 'settings',
  AUDIO_LIBRARY: 'audio_library',
  LAST_ACTIVE_DATE: 'last_active_date',
} as const;

// Helpers
function getJSON<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

// Default data
const DEFAULT_MORNING_ROUTINE: Routine = {
  habits: [],
  targetTime: '6:00 AM',
  notificationAggressiveness: 'medium',
  isActive: true,
};

const DEFAULT_NIGHT_ROUTINE: Routine = {
  habits: [],
  targetTime: '9:30 PM',
  notificationAggressiveness: 'medium',
  isActive: true,
};

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  completionHistory: {},
};

const DEFAULT_SETTINGS: Settings = {
  alarmVolume: 0.8,
  selectedMorningAudio: null,
  selectedNightAudio: null,
  hasCompletedOnboarding: false,
};

// Routine operations
export function getRoutine(type: 'morning' | 'night'): Routine {
  const key = type === 'morning' ? KEYS.MORNING_ROUTINE : KEYS.NIGHT_ROUTINE;
  const defaultVal = type === 'morning' ? DEFAULT_MORNING_ROUTINE : DEFAULT_NIGHT_ROUTINE;
  return getJSON<Routine>(key) ?? defaultVal;
}

export function saveRoutine(type: 'morning' | 'night', routine: Routine): void {
  const key = type === 'morning' ? KEYS.MORNING_ROUTINE : KEYS.NIGHT_ROUTINE;
  setJSON(key, routine);
}

// Streak operations
export function getStreakData(): StreakData {
  return getJSON<StreakData>(KEYS.STREAK_DATA) ?? DEFAULT_STREAK_DATA;
}

export function saveStreakData(data: StreakData): void {
  setJSON(KEYS.STREAK_DATA, data);
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayCompletion(): DayCompletion {
  const data = getStreakData();
  const today = getTodayKey();
  return data.completionHistory[today] ?? {
    morning: false,
    night: false,
    violations: 0,
  };
}

export function markRoutineComplete(type: 'morning' | 'night'): void {
  const data = getStreakData();
  const today = getTodayKey();

  if (!data.completionHistory[today]) {
    data.completionHistory[today] = { morning: false, night: false, violations: 0 };
  }
  data.completionHistory[today][type] = true;
  const completedAtKey = type === 'morning' ? 'morningCompletedAt' : 'nightCompletedAt';
  data.completionHistory[today][completedAtKey] = new Date().toISOString();

  // Update streak if both routines completed today
  const todayData = data.completionHistory[today];
  if (todayData.morning && todayData.night) {
    data.currentStreak += 1;
    if (data.currentStreak > data.longestStreak) {
      data.longestStreak = data.currentStreak;
    }
  }

  saveStreakData(data);
}

export function recordViolation(): void {
  const data = getStreakData();
  const today = getTodayKey();

  if (!data.completionHistory[today]) {
    data.completionHistory[today] = { morning: false, night: false, violations: 0 };
  }
  data.completionHistory[today].violations += 1;

  saveStreakData(data);
}

// Clear routines (used by Reset Routines)
export function clearRoutines(): void {
  storage.remove(KEYS.MORNING_ROUTINE);
  storage.remove(KEYS.NIGHT_ROUTINE);
  storage.remove(KEYS.STREAK_DATA);
  storage.remove(KEYS.LAST_ACTIVE_DATE);
}

// Last active date operations
export function getLastActiveDate(): string | undefined {
  return storage.getString(KEYS.LAST_ACTIVE_DATE);
}

export function setLastActiveDate(date: string): void {
  storage.set(KEYS.LAST_ACTIVE_DATE, date);
}

// Settings operations
export function getSettings(): Settings {
  return getJSON<Settings>(KEYS.SETTINGS) ?? DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  setJSON(KEYS.SETTINGS, settings);
}

// Audio library
export function getAudioLibrary(): AudioClip[] {
  return getJSON<AudioClip[]>(KEYS.AUDIO_LIBRARY) ?? [];
}

export function saveAudioLibrary(clips: AudioClip[]): void {
  setJSON(KEYS.AUDIO_LIBRARY, clips);
}
