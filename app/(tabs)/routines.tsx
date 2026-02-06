import { View, Text, Pressable, ScrollView, Modal, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRoutineStore } from '@/stores/useRoutineStore';
import { Colors } from '@/constants/theme';
import { getHabitStyle } from '@/components/HabitLibrary';
import HabitLibrary from '@/components/HabitLibrary';
import AudioSelector from '@/components/AudioSelector';
import type { RoutineType } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Time helpers ---

function parseTime(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const [time, period] = timeStr.split(' ');
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m, period: period as 'AM' | 'PM' };
}

function formatTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// --- TimePicker component ---

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const parsed = parseTime(value);

  const setHour = (dir: 1 | -1) => {
    let h = parsed.hour + dir;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    onChange(formatTime(h, parsed.minute, parsed.period));
  };

  const setMinute = (dir: 1 | -1) => {
    let m = parsed.minute + dir * 5;
    if (m >= 60) m = 0;
    if (m < 0) m = 55;
    onChange(formatTime(parsed.hour, m, parsed.period));
  };

  const togglePeriod = () => {
    onChange(formatTime(parsed.hour, parsed.minute, parsed.period === 'AM' ? 'PM' : 'AM'));
  };

  return (
    <View className="flex-row items-center justify-center" style={{ gap: 8 }}>
      {/* Hour */}
      <View className="items-center" style={{ width: 64 }}>
        <Pressable onPress={() => setHour(1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-up" size={22} color={Colors.primary} />
        </Pressable>
        <View
          className="rounded-2xl items-center justify-center"
          style={{ width: 64, height: 56, backgroundColor: Colors.secondary }}
        >
          <Text className="font-bold text-foreground" style={{ fontSize: 28 }}>
            {parsed.hour}
          </Text>
        </View>
        <Pressable onPress={() => setHour(-1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-down" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <Text className="font-bold text-foreground" style={{ fontSize: 28, marginTop: -2 }}>:</Text>

      {/* Minute */}
      <View className="items-center" style={{ width: 64 }}>
        <Pressable onPress={() => setMinute(1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-up" size={22} color={Colors.primary} />
        </Pressable>
        <View
          className="rounded-2xl items-center justify-center"
          style={{ width: 64, height: 56, backgroundColor: Colors.secondary }}
        >
          <Text className="font-bold text-foreground" style={{ fontSize: 28 }}>
            {parsed.minute.toString().padStart(2, '0')}
          </Text>
        </View>
        <Pressable onPress={() => setMinute(-1)} hitSlop={8} className="p-2">
          <Ionicons name="chevron-down" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* AM/PM */}
      <Pressable
        onPress={togglePeriod}
        className="rounded-2xl items-center justify-center"
        style={{
          width: 56,
          height: 56,
          backgroundColor: Colors.primary,
          alignSelf: 'center',
        }}
      >
        <Text className="font-bold" style={{ fontSize: 16, color: '#fff' }}>
          {parsed.period}
        </Text>
      </Pressable>
    </View>
  );
}

// --- CollapsibleSection ---

function CollapsibleSection({
  title,
  rightLabel,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  rightLabel?: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View className="px-6 mb-6">
      <Pressable onPress={toggle} className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-muted-foreground uppercase" style={{ letterSpacing: 1.5 }}>
            {title}
          </Text>
          {icon && <Ionicons name={icon as any} size={14} color={Colors.mutedForeground} />}
        </View>
        <View className="flex-row items-center gap-2">
          {rightLabel && (
            <Text className="text-xs text-muted-foreground">{rightLabel}</Text>
          )}
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.mutedForeground}
          />
        </View>
      </Pressable>
      {open && children}
    </View>
  );
}

// --- Main screen ---

export default function RoutinesScreen() {
  const { morningRoutine, nightRoutine, addHabit, removeHabit, updateHabit, reorderHabits, selectAudio, updateRoutine } = useRoutineStore();
  const [activeTab, setActiveTab] = useState<RoutineType>('morning');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const routine = activeTab === 'morning' ? morningRoutine : nightRoutine;

  const handleTimeChange = useCallback((time: string) => {
    updateRoutine(activeTab, { targetTime: time });
  }, [activeTab, updateRoutine]);

  const handleAddHabit = (name: string, icon: string | undefined, duration: number) => {
    addHabit(activeTab, { name, icon, duration });
  };

  const moveHabit = useCallback((index: number, direction: 'up' | 'down') => {
    const habits = [...routine.habits];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= habits.length) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    [habits[index], habits[targetIndex]] = [habits[targetIndex], habits[index]];
    reorderHabits(activeTab, habits);
  }, [routine.habits, activeTab, reorderHabits]);

  const AGGRESSIVENESS_OPTIONS: { value: 'low' | 'medium' | 'high'; label: string; desc: string }[] = [
    { value: 'low', label: 'Low', desc: 'One reminder after 10 min in background' },
    { value: 'medium', label: 'Medium', desc: 'Reminders every 5 min in background' },
    { value: 'high', label: 'High', desc: 'Reminders every 2 min in background' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-center px-6 py-4 border-b border-border">
        <View style={{ width: 32 }} />
        <Text className="flex-1 text-lg font-bold text-foreground text-center" style={{ letterSpacing: -0.5 }}>
          Manage Routines
        </Text>
        <Pressable onPress={() => setShowHelp(true)} hitSlop={8}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Morning/Night Toggle */}
        <View className="mx-6 mt-4 mb-6">
          <View className="flex-row bg-secondary rounded-full p-1">
            {(['morning', 'night'] as RoutineType[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-full items-center ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`font-semibold text-sm capitalize ${activeTab === tab ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Trigger Section */}
        <CollapsibleSection
          title={activeTab === 'morning' ? 'Wake Up Trigger' : 'Wind Down Trigger'}
          rightLabel="Active"
          defaultOpen
        >
          <View
            className="bg-card border border-border rounded-3xl p-6"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
          >
            {/* Time Display — tap to edit */}
            <Pressable className="items-center py-4" onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowTimePicker((v) => !v);
            }}>
              <Text className="text-foreground font-bold" style={{ fontSize: 56, letterSpacing: -2 }}>
                {routine.targetTime.split(' ')[0]}
                <Text className="text-xl font-medium text-muted-foreground"> {routine.targetTime.split(' ')[1]}</Text>
              </Text>
              <Text className="text-sm mt-2" style={{ color: Colors.primary }}>
                {showTimePicker ? 'Tap to close' : 'Tap to change'}
              </Text>
            </Pressable>

            {/* Inline Time Picker */}
            {showTimePicker && (
              <View className="py-4">
                <TimePicker value={routine.targetTime} onChange={handleTimeChange} />
              </View>
            )}

            {/* Audio Selector */}
            <View className="mt-4">
              <Text className="text-xs font-medium text-muted-foreground uppercase mb-3" style={{ letterSpacing: 1 }}>
                Alarm Sound
              </Text>
              <AudioSelector
                selectedAudioId={routine.selectedAudioId}
                onSelect={(audioId) => selectAudio(activeTab, audioId)}
              />
            </View>
          </View>
        </CollapsibleSection>

        {/* Habit Stack */}
        <CollapsibleSection
          title="Habit Stack"
          rightLabel={`${routine.habits.length} items`}
          defaultOpen
        >
          {routine.habits.map((habit, index) => {
            const style = getHabitStyle(habit.name, habit.icon);
            const iconName = habit.icon ?? style.icon;
            return (
              <View
                key={habit.id}
                className="flex-row items-center gap-3 bg-card border border-border p-4 rounded-2xl mb-3"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: style.bg }}
                >
                  <Ionicons name={iconName as any} size={20} color={style.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-foreground">{habit.name}</Text>
                  {habit.description && (
                    <Text className="text-xs text-muted-foreground">{habit.description}</Text>
                  )}
                </View>

                {/* Duration controls */}
                <View className="flex-row items-center" style={{ gap: 2 }}>
                  <Pressable
                    onPress={() => updateHabit(activeTab, habit.id, { duration: Math.max((habit.duration ?? 10) - 5, 5) })}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-down" size={14} color={Colors.mutedForeground} />
                  </Pressable>
                  <Text className="text-xs font-semibold text-muted-foreground" style={{ minWidth: 28, textAlign: 'center' }}>
                    {habit.duration ?? 10}m
                  </Text>
                  <Pressable
                    onPress={() => updateHabit(activeTab, habit.id, { duration: Math.min((habit.duration ?? 10) + 5, 120) })}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-up" size={14} color={Colors.mutedForeground} />
                  </Pressable>
                </View>

                {/* Reorder buttons */}
                <View className="items-center" style={{ gap: 2 }}>
                  <Pressable
                    onPress={() => moveHabit(index, 'up')}
                    hitSlop={6}
                    style={{ opacity: index === 0 ? 0.25 : 1 }}
                  >
                    <Ionicons name="chevron-up" size={16} color={Colors.mutedForeground} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveHabit(index, 'down')}
                    hitSlop={6}
                    style={{ opacity: index === routine.habits.length - 1 ? 0.25 : 1 }}
                  >
                    <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
                  </Pressable>
                </View>

                <Pressable onPress={() => removeHabit(activeTab, habit.id)} className="p-1">
                  <Ionicons name="close-circle" size={20} color={Colors.border} />
                </Pressable>
              </View>
            );
          })}

          {/* Add Habits from Library */}
          <View className="mt-2">
            <Text className="text-xs font-medium text-muted-foreground uppercase mb-3" style={{ letterSpacing: 1 }}>
              Add Habits
            </Text>
            <HabitLibrary
              existingHabitNames={routine.habits.map((h) => h.name)}
              onAddHabit={handleAddHabit}
            />
          </View>
        </CollapsibleSection>

        {/* Notifications */}
        <CollapsibleSection title="Notifications" icon="notifications" rightLabel={routine.notificationAggressiveness}>
          <View className="bg-card rounded-2xl p-4 border border-border" style={{ gap: 8 }}>
            {AGGRESSIVENESS_OPTIONS.map((opt) => {
              const isActive = routine.notificationAggressiveness === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => updateRoutine(activeTab, { notificationAggressiveness: opt.value })}
                  className="flex-row items-center p-3 rounded-xl"
                  style={{
                    backgroundColor: isActive ? 'rgba(255, 102, 0, 0.08)' : Colors.secondary,
                    borderWidth: isActive ? 1.5 : 1,
                    borderColor: isActive ? Colors.primary : Colors.border,
                  }}
                >
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: isActive ? Colors.primary : Colors.foreground }}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">{opt.desc}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </CollapsibleSection>
      </ScrollView>

      {/* Help Modal */}
      <Modal visible={showHelp} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View
            className="bg-background rounded-t-3xl px-6 pt-6 pb-10"
            style={{ maxHeight: '85%' }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-foreground">How Routines Work</Text>
              <Pressable onPress={() => setShowHelp(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={28} color={Colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 20 }}>
                {/* Morning / Night toggle */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Morning & Night</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    You have two separate routines. Use the toggle at the top to switch between your morning and night routine. Each has its own habits, trigger time, and alarm sound.
                  </Text>
                </View>

                {/* Trigger time */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="alarm-outline" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Trigger Time & Alarm</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    Set the time your routine should start. Tap the clock to adjust it. You can also pick an alarm sound that plays when the routine activates.
                  </Text>
                </View>

                {/* Habit stack */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="list-outline" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Habit Stack</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    These are the tasks you complete each routine. Add habits from the library or create custom ones. Reorder them with the arrow buttons to set the sequence you want to follow.
                  </Text>
                </View>

                {/* Duration */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="timer-outline" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Duration</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    Each habit has a duration (in minutes) shown next to its name. Use the up/down arrows to adjust it in 5-minute increments. The dashboard timer uses these durations to calculate your remaining time.
                  </Text>
                </View>

                {/* Notifications */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Notifications</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    Choose how aggressively the app reminds you to get back on track if you leave during a routine. Low sends one reminder, Medium reminds every 5 minutes, and High every 2 minutes.
                  </Text>
                </View>

                {/* Soft blocking */}
                <View>
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
                    <Text className="text-sm font-bold text-foreground">Soft Blocking</Text>
                  </View>
                  <Text className="text-sm text-muted-foreground leading-5">
                    When your routine is active, the app will gently remind you to stay focused until all habits are checked off. Complete every task to end the routine and build your streak.
                  </Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
