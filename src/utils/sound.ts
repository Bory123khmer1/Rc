// Web Audio API tone & repeating alarm generator for RC Timer

let sharedAudioCtx: AudioContext | null = null;
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;
let activeAlarmTimeout: ReturnType<typeof setTimeout> | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudioContext() {
  getOrCreateAudioContext();
}

function playSingleAlarmBurst(ctx: AudioContext) {
  const now = ctx.currentTime;
  const frequencies = [880, 1174.66, 880, 1174.66];
  frequencies.forEach((freq, idx) => {
    const startOffset = now + idx * 0.14;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startOffset);

    gain.gain.setValueAtTime(0.28, startOffset);
    gain.gain.exponentialRampToValueAtTime(0.005, startOffset + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startOffset);
    osc.stop(startOffset + 0.12);
  });
}

export function startTimeUpAlarm(enabled: boolean) {
  stopTimeUpAlarm();
  if (!enabled) return;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    playSingleAlarmBurst(ctx);
    activeAlarmInterval = setInterval(() => {
      const currentCtx = getOrCreateAudioContext();
      if (currentCtx) {
        playSingleAlarmBurst(currentCtx);
      }
    }, 1000);

    activeAlarmTimeout = setTimeout(() => {
      stopTimeUpAlarm();
    }, 15000);
  } catch {
    // Ignore audio context restriction errors
  }
}

export function stopTimeUpAlarm() {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
}

export function playAlertTone(
  type: 'start' | 'stop' | 'stopAll',
  enabled: boolean
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'stopAll') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.setValueAtTime(220, now + 0.16);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
