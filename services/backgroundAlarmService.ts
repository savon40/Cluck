import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { parseTargetTime } from '@/utils/routineHelpers';
import { playAlarm } from './audioService';

let silentPlayer: AudioPlayer | null = null;
let targetHour = -1;
let targetMinute = -1;
let alarmClipId: string | null = null;
let fired = false;
let checkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Arm the background alarm. Starts playing silent audio to keep the app alive
 * in the background, then plays the real alarm when targetTime arrives.
 */
export async function armAlarm(targetTime: string, clipId: string): Promise<void> {
  await disarmAlarm();

  const { hours24, minutes } = parseTargetTime(targetTime);
  targetHour = hours24;
  targetMinute = minutes;
  alarmClipId = clipId;
  fired = false;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });

    const player = createAudioPlayer(require('@/assets/audio/silence.wav'));
    player.loop = true;
    player.volume = 0.01;
    player.play();
    silentPlayer = player;

    // Check time every 15 seconds
    checkInterval = setInterval(checkAlarmTime, 15000);
  } catch {
    // Failed to arm
  }
}

/**
 * Disarm the background alarm. Stops silent audio.
 */
export async function disarmAlarm(): Promise<void> {
  targetHour = -1;
  targetMinute = -1;
  alarmClipId = null;
  fired = false;

  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }

  if (silentPlayer) {
    try {
      silentPlayer.pause();
      silentPlayer.release();
    } catch {}
    silentPlayer = null;
  }
}

export function isArmed(): boolean {
  return silentPlayer !== null && !fired;
}

function checkAlarmTime(): void {
  if (fired || targetHour < 0 || !alarmClipId) return;

  const now = new Date();
  if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
    fired = true;
    const clipId = alarmClipId;

    // Stop silent audio
    if (silentPlayer) {
      try {
        silentPlayer.pause();
        silentPlayer.release();
      } catch {}
      silentPlayer = null;
    }
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }

    // Start the real alarm
    playAlarm(clipId);
  }
}
