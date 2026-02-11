import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';

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

export const AUDIO_REQUIRE_MAP: Record<string, AudioSource> = {
  'energetic-beat': require('@/assets/audio/energetic-beat.wav'),
  'calypso-ukelele': require('@/assets/audio/calypso_ukelele.mp3'),
  'cinematic-stomps': require('@/assets/audio/cinematic_stomps.mp3'),
  'percussion-hype': require('@/assets/audio/percussion_hype.mp3'),
};

let previewPlayer: AudioPlayer | null = null;
let currentClipId: string | null = null;
let alarmPlayer: AudioPlayer | null = null;

/** Play the selected alarm audio on loop. Plays in silent mode and continues in background. */
export async function playAlarm(clipId: string): Promise<boolean> {
  await stopAlarm();
  await stopPreview();

  const source = AUDIO_REQUIRE_MAP[clipId];
  if (!source) return false;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });

    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 1.0;
    player.play();
    alarmPlayer = player;

    return true;
  } catch {
    return false;
  }
}

/** Stop the looping alarm. */
export async function stopAlarm(): Promise<void> {
  if (alarmPlayer) {
    try {
      alarmPlayer.pause();
      alarmPlayer.release();
    } catch {
      // already released
    }
    alarmPlayer = null;
  }
}

/** Returns true if the alarm is currently playing. */
export function isAlarmPlaying(): boolean {
  return alarmPlayer !== null;
}

export async function playPreview(clipId: string): Promise<boolean> {
  await stopPreview();

  const source = AUDIO_REQUIRE_MAP[clipId];
  if (!source) return false;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });

    const player = createAudioPlayer(source);
    player.play();
    previewPlayer = player;
    currentClipId = clipId;

    // Stop when playback finishes
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && player === previewPlayer) {
        stopPreview();
      }
    });

    return true;
  } catch {
    previewPlayer = null;
    currentClipId = null;
    return false;
  }
}

export async function stopPreview(): Promise<void> {
  if (previewPlayer) {
    try {
      previewPlayer.pause();
      previewPlayer.release();
    } catch {
      // already released
    }
    previewPlayer = null;
    currentClipId = null;
  }
}

export function getCurrentlyPlayingId(): string | null {
  return currentClipId;
}
