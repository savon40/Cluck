import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveSettings, getSettings } from '@/stores/storage';

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
          {/* Logo */}
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={{ width: 280, height: 280 }}
            resizeMode="contain"
          />

          {/* App Name */}
          {/* <Text
            className="text-foreground text-center uppercase"
            style={{ fontSize: 72, lineHeight: 72, fontWeight: '900', letterSpacing: -3 }}
          >
            Cluck
          </Text> */}

          {/* Taglines */}
          <View className="items-center gap-1">
            <Text className="text-lg text-muted-foreground text-center" style={{ fontStyle: 'italic' }}>
              Rise with purpose.
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
