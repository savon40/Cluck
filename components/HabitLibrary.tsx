import { View, Text, Pressable, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors } from '@/constants/theme';

export interface PredefinedHabit {
  name: string;
  icon: string;
  color: string;
  bg: string;
  defaultDuration: number;
}

export const PREDEFINED_HABITS: PredefinedHabit[] = [
  { name: 'Drink Water', icon: 'water', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', defaultDuration: 5 },
  { name: 'Exercise', icon: 'barbell', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', defaultDuration: 30 },
  { name: 'Meditate', icon: 'leaf', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', defaultDuration: 15 },
  { name: 'Read', icon: 'book', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', defaultDuration: 20 },
  { name: 'Gratitude', icon: 'heart', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', defaultDuration: 10 },
  { name: 'Journal', icon: 'pencil', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', defaultDuration: 10 },
  { name: 'Pray', icon: 'hand-left', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', defaultDuration: 10 },
  { name: 'Stretch', icon: 'body', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)', defaultDuration: 10 },
];

export function getDefaultDuration(name: string): number {
  const found = PREDEFINED_HABITS.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return found?.defaultDuration ?? 10;
}

const ICON_OPTIONS: { icon: string; color: string; bg: string }[] = [
  { icon: 'water', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { icon: 'barbell', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
  { icon: 'leaf', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { icon: 'book', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: 'heart', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { icon: 'pencil', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: 'hand-left', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: 'body', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)' },
  { icon: 'moon', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: 'sunny', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: 'musical-note', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { icon: 'walk', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
  { icon: 'cafe', color: '#92400E', bg: 'rgba(146, 64, 14, 0.1)' },
  { icon: 'bed', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: 'happy', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: 'flower', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { icon: 'timer', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { icon: 'nutrition', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: 'call', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { icon: 'brush', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)' },
];

export function getHabitStyle(name: string, icon?: string): { icon: string; color: string; bg: string } {
  const foundByName = PREDEFINED_HABITS.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  if (foundByName) return foundByName;

  if (icon) {
    const foundByIcon = ICON_OPTIONS.find((o) => o.icon === icon);
    if (foundByIcon) return foundByIcon;
  }

  return { icon: 'add-circle', color: Colors.mutedForeground, bg: 'rgba(122, 90, 58, 0.1)' };
}

interface HabitLibraryProps {
  existingHabitNames: string[];
  onAddHabit: (name: string, icon: string | undefined, duration: number) => void;
}

export default function HabitLibrary({ existingHabitNames, onAddHabit }: HabitLibraryProps) {
  const [customName, setCustomName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(ICON_OPTIONS[0].icon);
  const { width: screenWidth } = useWindowDimensions();

  const GAP = 10;
  const COLUMNS = 4;
  const PARENT_PADDING = 48; // px-6 on each side
  const itemWidth = (screenWidth - PARENT_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

  const normalizedExisting = existingHabitNames.map((n) => n.toLowerCase());

  const selectedStyle = ICON_OPTIONS.find((o) => o.icon === selectedIcon) ?? ICON_OPTIONS[0];

  const handleCustomAdd = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    onAddHabit(trimmed, selectedIcon, getDefaultDuration(trimmed));
    setCustomName('');
  };

  return (
    <View>
      {/* Predefined Grid */}
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {PREDEFINED_HABITS.map((habit) => {
          const isAdded = normalizedExisting.includes(habit.name.toLowerCase());
          return (
            <Pressable
              key={habit.name}
              onPress={() => !isAdded && onAddHabit(habit.name, habit.icon, habit.defaultDuration)}
              className="items-center rounded-2xl border border-border p-3"
              style={{
                width: itemWidth,
                opacity: isAdded ? 0.4 : 1,
                backgroundColor: isAdded ? Colors.secondary : Colors.card,
              }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: habit.bg }}
              >
                <Ionicons name={habit.icon as any} size={20} color={habit.color} />
              </View>
              <Text
                className="text-xs font-medium text-center"
                style={{ color: isAdded ? Colors.mutedForeground : Colors.foreground }}
                numberOfLines={1}
              >
                {habit.name}
              </Text>
              {isAdded && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.success}
                  style={{ position: 'absolute', top: 4, right: 4 }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Custom Input */}
      <View className="mt-4 rounded-2xl border-2 border-dashed border-border py-3 px-4" style={{ gap: 10 }}>
        <View className="flex-row items-center gap-2">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: selectedStyle.bg }}
          >
            <Ionicons name={selectedIcon as any} size={18} color={selectedStyle.color} />
          </View>

          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Type a custom habit..."
            placeholderTextColor={Colors.mutedForeground}
            className="flex-1 text-sm font-medium"
            style={{ color: Colors.foreground }}
            onSubmitEditing={handleCustomAdd}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <Pressable onPress={handleCustomAdd}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Icon Picker — always visible */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row" style={{ gap: 8 }}>
            {ICON_OPTIONS.map((opt) => {
              const isSelected = selectedIcon === opt.icon;
              return (
                <Pressable
                  key={opt.icon}
                  onPress={() => setSelectedIcon(opt.icon)}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: opt.bg,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? Colors.primary : 'transparent',
                  }}
                >
                  <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
