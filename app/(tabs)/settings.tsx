import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { Colors } from '@/constants/theme';
import { getSettings, saveSettings } from '@/stores/storage';
import { useRoutineStore } from '@/stores/useRoutineStore';
import type { Settings } from '@/types';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      className="text-xs font-bold text-muted-foreground uppercase mb-3 ml-1"
      style={{ letterSpacing: 1.5 }}
    >
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState(getSettings);
  const { resetDailyHabits, loadData } = useRoutineStore();

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }, [settings]);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the welcome screen on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => update({ hasCompletedOnboarding: false }),
        },
      ],
    );
  };

  const handleClearProgress = () => {
    Alert.alert(
      'Clear Today\'s Progress',
      'This will uncheck all habits for both morning and night routines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetDailyHabits('morning');
            resetDailyHabits('night');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center px-6 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground" style={{ letterSpacing: -0.5 }}>
            Settings
          </Text>
        </View>

        {/* Alarm Volume */}
        <View className="px-6 mt-6 mb-6">
          <SectionHeader title="Sound" />
          <View className="bg-card rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}
                >
                  <Ionicons name="volume-high" size={20} color="#EAB308" />
                </View>
                <Text className="text-base font-semibold text-foreground">Alarm Volume</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => update({ alarmVolume: Math.max(0, Math.round((settings.alarmVolume - 0.1) * 10) / 10) })}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: Colors.secondary }}
                >
                  <Ionicons name="remove" size={18} color={Colors.foreground} />
                </Pressable>
                <Text className="text-sm font-bold" style={{ color: Colors.primary, width: 36, textAlign: 'center' }}>
                  {Math.round(settings.alarmVolume * 100)}%
                </Text>
                <Pressable
                  onPress={() => update({ alarmVolume: Math.min(1, Math.round((settings.alarmVolume + 0.1) * 10) / 10) })}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: Colors.secondary }}
                >
                  <Ionicons name="add" size={18} color={Colors.foreground} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Debug / Testing */}
        <View className="px-6 mb-8">
          <SectionHeader title="Testing" />

          <Pressable
            onPress={handleClearProgress}
            className="flex-row items-center bg-card rounded-2xl p-4 mb-3 border border-border active:scale-[0.98]"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <Ionicons name="refresh" size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Clear Today's Progress</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Uncheck all habits for today</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={handleResetOnboarding}
            className="flex-row items-center bg-card rounded-2xl p-4 mb-3 border border-border active:scale-[0.98]"
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
            >
              <Ionicons name="arrow-back-circle" size={20} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Reset Onboarding</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Show welcome screen again</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
          </Pressable>

          {/* About */}
          <View className="flex-row items-center bg-card rounded-2xl p-4 border border-border">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: Colors.secondary }}
            >
              <Ionicons name="information-circle" size={20} color={Colors.mutedForeground} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Cluck</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
