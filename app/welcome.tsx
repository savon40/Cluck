import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { saveSettings, getSettings } from '@/stores/storage';

function LockIcon() {
  return (
    <View style={{ shadowColor: '#FF6600', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 40 }}>
      <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="50%" stopColor="#a1a1aa" />
            <Stop offset="100%" stopColor="#52525b" />
          </LinearGradient>
        </Defs>
        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="url(#lockGrad)" />
        <Path
          d="M7 11V7a5 5 0 0 1 10 0v4"
          stroke="url(#lockGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="transparent"
        />
        <Circle cx="12" cy="16.5" r="1.5" fill="#18181b" />
      </Svg>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = () => {
    const settings = getSettings();
    saveSettings({ ...settings, hasCompletedOnboarding: true });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-between px-6 pt-16 pb-12">
        {/* Top Visual Cluster */}
        <View className="flex-1 w-full items-center justify-center gap-10">
          {/* Massive Typography */}
          <View>
            <Text
              className="text-foreground text-center uppercase"
              style={{ fontSize: 80, lineHeight: 72, fontWeight: '900', letterSpacing: -3 }}
            >
              Locked{'\n'}In
            </Text>
          </View>

          {/* Lock Icon */}
          <LockIcon />

          {/* Taglines */}
          <View className="items-center gap-1">
            <Text className="text-lg text-muted-foreground text-center" style={{ fontStyle: 'italic' }}>
              Break the doom-loop.
            </Text>
            <Text className="text-lg font-semibold text-foreground text-center">
              Master your morning.
            </Text>
            <Text className="text-lg text-muted-foreground text-center" style={{ fontStyle: 'italic' }}>
              Own the night.
            </Text>
          </View>
        </View>

        {/* Bottom Action Area */}
        <View className="w-full items-center gap-6">
          <Pressable
            onPress={handleStart}
            className="w-full h-16 bg-primary rounded-2xl flex-row items-center justify-center active:scale-95"
            style={{ shadowColor: '#FF6600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 15 }}
          >
            <Text className="text-primary-foreground font-bold text-base tracking-widest uppercase">
              Initiate Protocol
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
