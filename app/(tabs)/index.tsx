import { View, Text, Pressable, ScrollView, RefreshControl, Image, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { getTodayCompletion } from '@/stores/storage';
import { Colors } from '@/constants/theme';
import { ProgressRing } from '@/components/ProgressRing';
import { getHabitStyle } from '@/components/HabitLibrary';
import HabitIcon from '@/components/HabitIcon';
import { parseTargetTime, getActiveRoutineType } from '@/utils/routineHelpers';
import { isAlarmPlaying, stopAlarm, BUNDLED_AUDIO_CLIPS } from '@/services/audioService';
import type { Habit, RoutineType } from '@/types';

// --- Helpers ---

function formatCompletionTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getRoutineStatus(
  targetTime: string,
  isComplete: boolean,
  now: Date,
  completedAt?: string,
): { text: string; color: string } {
  if (isComplete) {
    const timeStr = completedAt ? ` at ${formatCompletionTime(completedAt)}` : '';
    return { text: `Complete${timeStr}`, color: Colors.success };
  }

  const { hours24, minutes } = parseTargetTime(targetTime);

  const target = new Date(now);
  target.setHours(hours24, minutes, 0, 0);

  let diffMs = target.getTime() - now.getTime();

  // If the target passed more than 12 hours ago, it's clearly for tomorrow
  if (diffMs <= 0 && -diffMs > 12 * 60 * 60 * 1000) {
    target.setDate(target.getDate() + 1);
    diffMs = target.getTime() - now.getTime();
  }

  if (diffMs <= 0) {
    // Target time has passed today → overdue
    const overdueMins = Math.floor(-diffMs / 60000);
    const h = Math.floor(overdueMins / 60);
    const m = overdueMins % 60;
    const timeStr = h === 0 ? `${m}m` : `${h}h ${m}m`;
    return { text: `Overdue by ${timeStr}`, color: '#D94040' };
  }

  // Target time is in the future
  const diffMins = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const timeStr = h === 0 ? `${m}m` : `${h}h ${m}m`;
  return { text: `Starts in ${timeStr}`, color: Colors.primary };
}

// --- Components ---

function HabitItem({
  habit,
  isCurrent,
  onToggle,
}: {
  habit: Habit;
  isCurrent: boolean;
  onToggle: () => void;
}) {
  const style = getHabitStyle(habit.name, habit.icon);
  const iconName = habit.icon ?? style.icon;

  if (habit.completed) {
    return (
      <Pressable
        onPress={onToggle}
        className="flex-row items-center p-4 bg-card/50 border border-border rounded-2xl mb-3"
        style={{ opacity: 0.6 }}
      >
        <View className="mr-4">
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground line-through">
            {habit.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{habit.duration ?? 10} min</Text>
        </View>
        {habit.completedAt && (
          <Text className="text-xs font-medium mr-2" style={{ color: Colors.success }}>
            {formatCompletionTime(habit.completedAt)}
          </Text>
        )}
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: style.bg }}
        >
          <HabitIcon name={iconName} size={16} color={style.color} />
        </View>
      </Pressable>
    );
  }

  if (isCurrent) {
    return (
      <Pressable
        onPress={onToggle}
        className="flex-row items-center p-5 bg-card border rounded-2xl mb-3 overflow-hidden"
        style={{
          borderColor: 'rgba(255, 102, 0, 0.2)',
          transform: [{ scale: 1.02 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <View
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"
          style={{ shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 5 }}
        />
        <View className="w-6 h-6 rounded-full border-2 border-primary mr-4" />
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{habit.name}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">Current Task · {habit.duration ?? 10} min</Text>
        </View>
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: style.bg }}
        >
          <HabitIcon name={iconName} size={18} color={style.color} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center p-4 bg-card border border-border rounded-2xl mb-3"
    >
      <View className="w-6 h-6 rounded-full border-2 border-border mr-4" />
      <View className="flex-1">
        <Text className="text-base font-medium text-muted-foreground">
          {habit.name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{habit.duration ?? 10} min</Text>
      </View>
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: style.bg }}
      >
        <HabitIcon name={iconName} size={16} color={style.color} />
      </View>
    </Pressable>
  );
}

function getAlarmName(audioId?: string): string {
  if (!audioId) return 'Default';
  const clip = BUNDLED_AUDIO_CLIPS.find((c) => c.id === audioId);
  return clip?.name ?? 'Default';
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- Main screen ---

export default function DashboardScreen() {
  const {
    morningRoutine,
    nightRoutine,
    streakData,
    toggleHabit,
    updateRoutine,
    checkNewDay,
  } = useRoutineStore();

  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [alarmActive, setAlarmActive] = useState(isAlarmPlaying());
  const hasNoRoutines = morningRoutine.habits.length === 0 && nightRoutine.habits.length === 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkNewDay();
    setNow(new Date());
    // Delay setting refreshing to false so React doesn't batch it away with the true
    setTimeout(() => setRefreshing(false), 300);
  }, [checkNewDay]);

  // Tick every 30s to keep countdown fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh immediately when app returns to foreground (interval is suspended in background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkNewDay();
        setNow(new Date());
        // Re-evaluate smart default so the toggle switches after overnight backgrounding
        const completion = getTodayCompletion();
        setRoutineType(getActiveRoutineType(
          morningRoutine.targetTime,
          nightRoutine.targetTime,
          completion.morning,
          completion.night,
        ));
      }
    });
    return () => sub.remove();
  }, [checkNewDay, morningRoutine.targetTime, nightRoutine.targetTime]);

  // Poll alarm state so the stop button appears/disappears
  useEffect(() => {
    const interval = setInterval(() => setAlarmActive(isAlarmPlaying()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Get today's completion state from storage
  // Depends on streakData (changes when routines completed) AND todayKey (changes at midnight)
  const todayKey = now.toISOString().split('T')[0];
  const todayCompletion = useMemo(() => getTodayCompletion(), [streakData, todayKey]);

  // Manual toggle with smart default
  const [routineType, setRoutineType] = useState<RoutineType>(
    () => getActiveRoutineType(
      morningRoutine.targetTime,
      nightRoutine.targetTime,
      todayCompletion.morning,
      todayCompletion.night,
    )
  );

  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;
  const completedCount = routine.habits.filter((h) => h.completed).length;
  const totalCount = routine.habits.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;
  const currentTaskIndex = routine.habits.findIndex((h) => !h.completed);

  // Derive routine completion timestamp
  const routineCompletedAt = routineType === 'morning'
    ? todayCompletion.morningCompletedAt
    : todayCompletion.nightCompletedAt;

  // Smart status: overdue / starts in / complete (tied to `now` state so refresh always updates)
  const routineStatus = getRoutineStatus(routine.targetTime, isComplete, now, routineCompletedAt);

  // Check if the OTHER routine is complete today
  const otherRoutineComplete = routineType === 'morning'
    ? todayCompletion.night
    : todayCompletion.morning;
  const otherRoutineLabel = routineType === 'morning' ? 'Night' : 'Morning';
  const otherRoutineCompletedAt = routineType === 'morning'
    ? todayCompletion.nightCompletedAt
    : todayCompletion.morningCompletedAt;

  // Estimated time remaining based on habit durations
  const estimatedMinutes = routine.habits
    .filter((h) => !h.completed)
    .reduce((sum, h) => sum + (h.duration ?? 10), 0);
  const timeDisplay = isComplete
    ? '00:00'
    : `${String(Math.floor(estimatedMinutes / 60)).padStart(2, '0')}:${String(estimatedMinutes % 60).padStart(2, '0')}`;

  const handleToggleActive = () => {
    updateRoutine(routineType, { isActive: !routine.isActive });
  };

  const handleStopAlarm = async () => {
    await stopAlarm();
    setAlarmActive(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 py-4 border-b border-border"
        style={{ backgroundColor: 'rgba(255, 247, 240, 0.8)' }}
      >
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
        />
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: 'rgba(255, 102, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 102, 0, 0.2)' }}
        >
          <Ionicons name="flame" size={16} color={Colors.primary} />
          <Text className="text-xs font-bold tracking-wide" style={{ color: Colors.primary }}>
            {streakData.currentStreak} DAY STREAK
          </Text>
        </View>
      </View>

      {/* Stop Alarm Banner */}
      {alarmActive && (
        <Pressable
          onPress={handleStopAlarm}
          className="mx-6 mt-3 mb-1 flex-row items-center justify-center py-3 rounded-2xl"
          style={{ backgroundColor: '#D94040' }}
        >
          <Ionicons name="volume-mute" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text className="font-bold text-sm" style={{ color: '#fff' }}>
            Stop Alarm
          </Text>
        </Pressable>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {hasNoRoutines ? (
          <View className="flex-1 items-center justify-center px-6 pt-20">
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={{ width: 120, height: 120, opacity: 0.3 }}
              resizeMode="contain"
            />
            <Text className="text-xl font-bold text-foreground mt-6 text-center">
              No routines yet
            </Text>
            <Text className="text-sm text-muted-foreground mt-2 text-center leading-5">
              Set up your morning and night routines to start building powerful daily habits.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/routines')}
              className="mt-6 px-6 py-3.5 bg-primary rounded-2xl flex-row items-center active:scale-95"
              style={{ shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 15 }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-primary-foreground font-bold text-sm uppercase" style={{ letterSpacing: 1 }}>
                Create Your Routines
              </Text>
            </Pressable>
          </View>
        ) : (
        <>
        {/* Morning / Night Toggle */}
        <View className="mx-6 mt-4 mb-3">
          <View className="flex-row bg-secondary rounded-full p-1">
            {(['morning', 'night'] as RoutineType[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setRoutineType(tab)}
                className={`flex-1 py-3 rounded-full items-center ${routineType === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`font-semibold text-sm capitalize ${routineType === tab ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Routine Info Summary */}
        <Pressable
          onPress={() => router.push('/(tabs)/routines')}
          className="mx-6 mb-3 flex-row items-center bg-card border border-border rounded-2xl px-4 py-3"
          style={{ gap: 12 }}
        >
          <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Ionicons name="alarm-outline" size={14} color={Colors.mutedForeground} />
              <Text className="text-xs font-medium text-muted-foreground">
                {routine.targetTime}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Ionicons name="musical-note-outline" size={14} color={Colors.mutedForeground} />
              <Text className="text-xs font-medium text-muted-foreground">
                {getAlarmName(routine.selectedAudioId)}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Ionicons name="notifications-outline" size={14} color={Colors.mutedForeground} />
              <Text className="text-xs font-medium text-muted-foreground">
                {capitalizeFirst(routine.notificationAggressiveness)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.mutedForeground} />
        </Pressable>

        {/* Completion banner for the other routine */}
        {otherRoutineComplete && (
          <View className="mx-6 mb-1 flex-row items-center self-start px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', borderWidth: 1, borderColor: 'rgba(52, 199, 89, 0.2)' }}
          >
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text className="text-xs font-semibold ml-1.5" style={{ color: Colors.success }}>
              {otherRoutineLabel} Complete{otherRoutineCompletedAt ? ` at ${formatCompletionTime(otherRoutineCompletedAt)}` : ''}
            </Text>
          </View>
        )}

        {routine.habits.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 pt-20">
            <Ionicons
              name={routineType === 'morning' ? 'sunny-outline' : 'moon-outline'}
              size={64}
              color={Colors.mutedForeground}
              style={{ opacity: 0.3 }}
            />
            <Text className="text-xl font-bold text-foreground mt-6 text-center">
              No {routineType === 'morning' ? 'morning' : 'night'} routine yet
            </Text>
            <Text className="text-sm text-muted-foreground mt-2 text-center leading-5">
              Set up your {routineType === 'morning' ? 'morning' : 'night'} routine to start building daily habits.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/routines')}
              className="mt-6 px-6 py-3.5 bg-primary rounded-2xl flex-row items-center active:scale-95"
              style={{ shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 15 }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-primary-foreground font-bold text-sm uppercase" style={{ letterSpacing: 1 }}>
                Set Up Routine
              </Text>
            </Pressable>
          </View>
        ) : (
        <>
        {/* Routine Type + Countdown + Toggle */}
        <View className="flex-row items-center justify-between px-6 pt-5 pb-2">
          <View>
            <Text className="text-xs font-bold text-muted-foreground uppercase" style={{ letterSpacing: 2 }}>
              {routineType === 'morning' ? 'Morning Routine' : 'Night Routine'}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Ionicons
                name={routineStatus.color === Colors.success ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={routineStatus.color}
              />
              <Text className="text-xs font-semibold" style={{ color: routineStatus.color }}>
                {routineStatus.text}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleToggleActive}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: routine.isActive ? 'rgba(52, 199, 89, 0.1)' : Colors.secondary,
              borderWidth: 1,
              borderColor: routine.isActive ? 'rgba(52, 199, 89, 0.2)' : Colors.border,
            }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: routine.isActive ? Colors.success : Colors.mutedForeground }}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: routine.isActive ? Colors.success : Colors.mutedForeground }}
            >
              {routine.isActive ? 'Active' : 'Off'}
            </Text>
          </Pressable>
        </View>

        {/* Progress Ring */}
        <View className="items-center py-4">
          <ProgressRing size={256} strokeWidth={8} progress={progress}>
            <View className="items-center">
              {isComplete ? (
                <>
                  <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
                  {routineCompletedAt && (
                    <Text
                      className="font-bold mt-1"
                      style={{ fontSize: 20, color: Colors.success }}
                    >
                      {formatCompletionTime(routineCompletedAt)}
                    </Text>
                  )}
                  <Text className="text-sm font-medium text-muted-foreground mt-1">
                    All {totalCount} Tasks Complete
                  </Text>
                </>
              ) : (
                <>
                  {routine.isActive && (
                    <View
                      className="flex-row items-center mb-2 px-3 py-1 rounded-full bg-card border border-border"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
                    >
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                      <Text className="text-muted-foreground font-bold uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                        Focus Mode
                      </Text>
                    </View>
                  )}
                  <Text
                    className="text-foreground font-black"
                    style={{ fontSize: 56, letterSpacing: -2, fontVariant: ['tabular-nums'], lineHeight: 56 }}
                  >
                    {timeDisplay}
                  </Text>
                  <Text className="text-sm font-medium text-muted-foreground mt-1">
                    {completedCount}/{totalCount} Tasks Complete
                  </Text>
                </>
              )}
            </View>
          </ProgressRing>
        </View>

        {/* Task List */}
        {routine.isActive ? (
          <View className="px-6 pb-4">
            {routine.habits.map((habit, index) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                isCurrent={index === currentTaskIndex}
                onToggle={() => toggleHabit(routineType, habit.id)}
              />
            ))}
          </View>
        ) : (
          <View className="px-6 pb-4 items-center py-8">
            <Ionicons name="moon-outline" size={40} color={Colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text className="text-muted-foreground mt-3 text-sm">
              Routine is turned off
            </Text>
            <Pressable
              onPress={handleToggleActive}
              className="mt-4 px-5 py-2.5 rounded-full bg-primary"
            >
              <Text className="text-primary-foreground text-sm font-semibold">Turn On</Text>
            </Pressable>
          </View>
        )}
        </>
        )}

        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
