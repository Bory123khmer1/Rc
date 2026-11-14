// Dual-engine Audio Alert & Alarm system (HTML5 WAV Audio + Web Audio API fallback)
// Designed to work reliably on iOS Safari, Android Chrome, and Desktop browsers.

let sharedAudioCtx: AudioContext | null = null;
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;
let activeAlarmTimeout: ReturnType<typeof setTimeout> | null = null;

let alarmAudioEl: HTMLAudioElement | null = null;
let startAudioEl: HTMLAudioElement | null = null;
let stopAudioEl: HTMLAudioElement | null = null;
let alarmAudioUnlocked = false;
let isAlarmRinging = false;

function encodePcmWavDataUrl(samples: Float32Array, sampleRate = 22050): string {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(
      offset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true
    );
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function buildAlarmWavUrl(): string {
  const sampleRate = 22050;
  const durationSec = 1.05;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  // 4 loud high-clarity digital alarm pulses: 880Hz -> 1175Hz -> 880Hz -> 1175Hz
  const pulses = [
    { start: 0.0, end: 0.12, freq: 880 },
    { start: 0.16, end: 0.28, freq: 1174.66 },
    { start: 0.32, end: 0.44, freq: 880 },
    { start: 0.48, end: 0.64, freq: 1174.66 },
  ];

  for (const pulse of pulses) {
    const startIdx = Math.floor(pulse.start * sampleRate);
    const endIdx = Math.min(totalSamples, Math.floor(pulse.end * sampleRate));
    const fadeSamples = Math.floor(0.008 * sampleRate);

    for (let i = startIdx; i < endIdx; i += 1) {
      const t = (i - startIdx) / sampleRate;
      const len = endIdx - startIdx;
      const pos = i - startIdx;
      let env = 1;
      if (pos < fadeSamples) env = pos / fadeSamples;
      else if (pos > len - fadeSamples) env = (len - pos) / fadeSamples;

      // Rich harmonic blend that cuts clearly through phone & tablet speakers
      const wave =
        0.55 * Math.sin(2 * Math.PI * pulse.freq * t) +
        0.3 * Math.sin(2 * Math.PI * pulse.freq * 2 * t) +
        0.15 * Math.sin(2 * Math.PI * pulse.freq * 3 * t);
      samples[i] = wave * env * 0.85;
    }
  }

  return encodePcmWavDataUrl(samples, sampleRate);
}

function buildChimeWavUrl(freq1: number, freq2: number): string {
  const sampleRate = 22050;
  const durationSec = 0.26;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);
  const split = Math.floor(0.11 * sampleRate);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const freq = i < split ? freq1 : freq2;
    const progress = i / totalSamples;
    const env = Math.min(1, i / (0.008 * sampleRate)) * (1 - progress * 0.85);
    const wave =
      0.75 * Math.sin(2 * Math.PI * freq * t) +
      0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
    samples[i] = wave * env * 0.65;
  }

  return encodePcmWavDataUrl(samples, sampleRate);
}

function configureIosAudioSession() {
  try {
    const nav = navigator as unknown as {
      audioSession?: { type: string };
    };
    if (nav.audioSession && nav.audioSession.type !== 'playback') {
      nav.audioSession.type = 'playback';
    }
  } catch {
    // Not supported on this browser
  }
}

function ensureAudioElements() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

  if (!alarmAudioEl) {
    alarmAudioEl = new Audio(buildAlarmWavUrl());
    alarmAudioEl.preload = 'auto';
    alarmAudioEl.loop = true;
    alarmAudioEl.setAttribute('playsinline', 'true');
  }

  if (!startAudioEl) {
    startAudioEl = new Audio(buildChimeWavUrl(587.33, 880));
    startAudioEl.preload = 'auto';
    startAudioEl.setAttribute('playsinline', 'true');
  }

  if (!stopAudioEl) {
    stopAudioEl = new Audio(buildChimeWavUrl(493.88, 329.63));
    stopAudioEl.preload = 'auto';
    stopAudioEl.setAttribute('playsinline', 'true');
  }
}

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
  if (sharedAudioCtx && sharedAudioCtx.state !== 'running') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudioContext(skipHtmlAudioUnlock = false) {
  if (typeof window === 'undefined') return;
  configureIosAudioSession();
  ensureAudioElements();

  // 1) Unlock Web Audio API with a silent 1-sample buffer inside user gesture
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx) {
      if (ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  } catch {
    // Ignore
  }

  // 2) Unlock HTML5 <audio> alarm element so setInterval can play it minutes later on iOS/Android
  if (
    !skipHtmlAudioUnlock &&
    alarmAudioEl &&
    !alarmAudioUnlocked &&
    !isAlarmRinging
  ) {
    try {
      alarmAudioEl.muted = true;
      const playPromise = alarmAudioEl.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            alarmAudioUnlocked = true;
            if (!isAlarmRinging && alarmAudioEl) {
              alarmAudioEl.pause();
              alarmAudioEl.currentTime = 0;
              alarmAudioEl.muted = false;
            }
          })
          .catch(() => {
            if (alarmAudioEl) alarmAudioEl.muted = false;
          });
      }
    } catch {
      alarmAudioEl.muted = false;
    }
  }
}

async function playWebAudioAlarmBurst() {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const frequencies = [880, 1174.66, 880, 1174.66];
    frequencies.forEach((freq, idx) => {
      const startOffset = now + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startOffset);

      gain.gain.setValueAtTime(0.32, startOffset);
      gain.gain.exponentialRampToValueAtTime(0.005, startOffset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startOffset);
      osc.stop(startOffset + 0.13);
    });
  } catch {
    // Ignore audio context restriction errors
  }
}

function startWebAudioAlarmFallback() {
  void playWebAudioAlarmBurst();
  activeAlarmInterval = setInterval(() => {
    void playWebAudioAlarmBurst();
  }, 1050);
}

export function startTimeUpAlarm(enabled: boolean) {
  stopTimeUpAlarm();
  if (!enabled || typeof window === 'undefined') return;

  configureIosAudioSession();
  ensureAudioElements();
  isAlarmRinging = true;

  // Vibrate on supported Android/mobile devices
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 400]);
    }
  } catch {
    // Ignore
  }

  // Primary: Play looping WAV <audio> (loud, works even with iOS silent switch)
  let handledByHtmlAudio = false;
  if (alarmAudioEl) {
    try {
      alarmAudioEl.muted = false;
      alarmAudioEl.volume = 1.0;
      alarmAudioEl.loop = true;
      alarmAudioEl.currentTime = 0;
      const playPromise = alarmAudioEl.play();
      handledByHtmlAudio = true;
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (isAlarmRinging) {
            startWebAudioAlarmFallback();
          }
        });
      }
    } catch {
      handledByHtmlAudio = false;
    }
  }

  if (!handledByHtmlAudio) {
    startWebAudioAlarmFallback();
  }

  // Auto-stop after 25 seconds if not manually dismissed
  activeAlarmTimeout = setTimeout(() => {
    stopTimeUpAlarm();
  }, 25000);
}

export function stopTimeUpAlarm() {
  isAlarmRinging = false;
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
  if (alarmAudioEl) {
    try {
      alarmAudioEl.pause();
      alarmAudioEl.currentTime = 0;
    } catch {
      // Ignore
    }
  }
}

export function playTestSound() {
  if (typeof window === 'undefined') return;
  stopTimeUpAlarm();
  unlockAudioContext(true);

  if (alarmAudioEl) {
    try {
      alarmAudioUnlocked = true;
      alarmAudioEl.muted = false;
      alarmAudioEl.volume = 1.0;
      alarmAudioEl.loop = false;
      alarmAudioEl.currentTime = 0;
      const p = alarmAudioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          void playWebAudioAlarmBurst();
        });
      }
      return;
    } catch {
      // Fall through to Web Audio
    }
  }

  void playWebAudioAlarmBurst();
}

export function playAlertTone(
  type: 'start' | 'stop' | 'stopAll',
  enabled: boolean
) {
  if (!enabled || typeof window === 'undefined') return;
  configureIosAudioSession();
  ensureAudioElements();

  const targetAudio = type === 'start' ? startAudioEl : stopAudioEl;
  if (targetAudio) {
    try {
      targetAudio.muted = false;
      targetAudio.volume = 0.85;
      targetAudio.currentTime = 0;
      const p = targetAudio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          void playWebAudioTone(type);
        });
      }
      return;
    } catch {
      // Fall through to Web Audio
    }
  }

  void playWebAudioTone(type);
}

async function playWebAudioTone(type: 'start' | 'stop' | 'stopAll') {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      await ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.09);
      gain.gain.setValueAtTime(0.24, now);
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
      osc.frequency.setValueAtTime(493.88, now);
      osc.frequency.setValueAtTime(329.63, now + 0.09);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
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
