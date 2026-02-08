import { create } from 'zustand';
import type { Routine, RoutineType, Habit, StreakData } from '@/types';
import {
  getRoutine,
  saveRoutine,
  getStreakData,
  saveStreakData,
  getTodayKey,
  getTodayCompletion,
  markRoutineComplete as markComplete,
  recordViolation as recordViol,
  getLastActiveDate,
  setLastActiveDate,
} from './storage';
import { stopNagging } from '@/services/appStateService';

interface RoutineStore {
  morningRoutine: Routine;
  nightRoutine: Routine;
  streakData: StreakData;
  activeRoutineType: RoutineType;

  // Actions
  loadData: () => void;
  setActiveRoutineType: (type: RoutineType) => void;
  toggleHabit: (type: RoutineType, habitId: string) => void;
  addHabit: (type: RoutineType, habit: Omit<Habit, 'id' | 'completed' | 'completedAt'>) => void;
  removeHabit: (type: RoutineType, habitId: string) => void;
  updateHabit: (type: RoutineType, habitId: string, updates: Partial<Habit>) => void;
  reorderHabits: (type: RoutineType, habits: Habit[]) => void;
  selectAudio: (type: RoutineType, audioId: string) => void;
  updateRoutine: (type: RoutineType, updates: Partial<Routine>) => void;
  markRoutineComplete: (type: RoutineType) => void;
  recordViolation: () => void;
  resetDailyHabits: (type: RoutineType) => void;
  isRoutineComplete: (type: RoutineType) => boolean;
  checkNewDay: () => void;
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  morningRoutine: getRoutine('morning'),
  nightRoutine: getRoutine('night'),
  streakData: getStreakData(),
  activeRoutineType: 'morning',

  loadData: () => {
    set({
      morningRoutine: getRoutine('morning'),
      nightRoutine: getRoutine('night'),
      streakData: getStreakData(),
    });
  },

  setActiveRoutineType: (type) => {
    set({ activeRoutineType: type });
  },

  toggleHabit: (type, habitId) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key] };
    routine.habits = routine.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            completed: !h.completed,
            completedAt: !h.completed ? new Date().toISOString() : undefined,
          }
        : h
    );
    saveRoutine(type, routine);
    set({ [key]: routine });

    // Check if all habits completed
    if (routine.habits.every((h) => h.completed)) {
      stopNagging();
      get().markRoutineComplete(type);
    }
  },

  addHabit: (type, habit) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key] };
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      completed: false,
    };
    routine.habits = [...routine.habits, newHabit];
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  removeHabit: (type, habitId) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key] };
    routine.habits = routine.habits.filter((h) => h.id !== habitId);
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  updateHabit: (type, habitId, updates) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key] };
    routine.habits = routine.habits.map((h) =>
      h.id === habitId ? { ...h, ...updates } : h
    );
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  reorderHabits: (type, habits) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key], habits };
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  selectAudio: (type, audioId) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key], selectedAudioId: audioId };
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  updateRoutine: (type, updates) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key], ...updates };
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  markRoutineComplete: (type) => {
    markComplete(type);
    set({ streakData: getStreakData() });
  },

  recordViolation: () => {
    recordViol();
    set({ streakData: getStreakData() });
  },

  resetDailyHabits: (type) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    const routine = { ...get()[key] };
    routine.habits = routine.habits.map((h) => ({ ...h, completed: false, completedAt: undefined }));
    saveRoutine(type, routine);
    set({ [key]: routine });
  },

  isRoutineComplete: (type) => {
    const key = type === 'morning' ? 'morningRoutine' : 'nightRoutine';
    return get()[key].habits.every((h) => h.completed);
  },

  checkNewDay: () => {
    const today = getTodayKey();
    const lastActive = getLastActiveDate();

    if (lastActive !== today) {
      get().resetDailyHabits('morning');
      get().resetDailyHabits('night');
      setLastActiveDate(today);
    }

    get().loadData();
  },
}));
