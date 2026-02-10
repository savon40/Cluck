import { Audio, type AVPlaybackSource } from 'expo-av';

export interface BundledClip {
  id: string;
  name: string;
  duration: number; // seconds
  icon: string;
}

export const BUNDLED_AUDIO_CLIPS: BundledClip[] = [
  { id: 'energetic-beat', name: 'Energetic Beat', duration: 4, icon: 'musical-notes' },
  { id: 'calypso-ukelele', name: 'Calypso Ukelele', duration: 5, icon: 'sunny' },
  { id: 'cinematic-stomps', name: 'Cinematic Stomps', duration: 5, icon: 'footsteps' },
  { id: 'percussion-hype', name: 'Percussion Hype', duration: 5, icon: 'musical-note' },
];

export const AUDIO_REQUIRE_MAP: Record<string, AVPlaybackSource> = {
  'energetic-beat': require('@/assets/audio/energetic-beat.wav'),
  'calypso-ukelele': require('@/assets/audio/calypso_ukelele.mp3'),
  'cinematic-stomps': require('@/assets/audio/cinematic_stomps.mp3'),
  'percussion-hype': require('@/assets/audio/percussion_hype.mp3'),
};

let currentSound: Audio.Sound | null = null;
let currentClipId: string | null = null;
let alarmSound: Audio.Sound | null = null;

async function ensureAudioMode() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
}

/** Play the selected alarm audio on loop. Plays in silent mode and continues in background. */
export async function playAlarm(clipId: string): Promise<boolean> {
  await stopAlarm();
  await stopPreview();

  const source = AUDIO_REQUIRE_MAP[clipId];
  if (!source) return false;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1.0,
      isLooping: true,
    });
    alarmSound = sound;

    return true;
  } catch {
    return false;
  }
}

/** Stop the looping alarm. */
export async function stopAlarm(): Promise<void> {
  if (alarmSound) {
    try {
      await alarmSound.unloadAsync();
    } catch {
      // already unloaded
    }
    alarmSound = null;
  }
}

/** Returns true if the alarm is currently playing. */
export function isAlarmPlaying(): boolean {
  return alarmSound !== null;
}

export async function playPreview(clipId: string): Promise<boolean> {
  await stopPreview();

  const source = AUDIO_REQUIRE_MAP[clipId];
  if (!source) return false;

  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    currentSound = sound;
    currentClipId = clipId;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        stopPreview();
      }
    });

    return true;
  } catch {
    currentSound = null;
    currentClipId = null;
    return false;
  }
}

export async function stopPreview(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.unloadAsync();
    } catch {
      // already unloaded
    }
    currentSound = null;
    currentClipId = null;
  }
}

export function getCurrentlyPlayingId(): string | null {
  return currentClipId;
}
