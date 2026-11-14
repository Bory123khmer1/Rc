import { useCallback, useEffect, useState } from 'react';
import {
  BellRing,
  Globe,
  Moon,
  OctagonAlert,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CarCard } from './components/CarCard';
import {
  playAlertTone,
  startTimeUpAlarm,
  stopTimeUpAlarm,
  unlockAudioContext,
} from './utils/sound';

type Language = 'km' | 'en';

interface RunningTimer {
  carId: number;
  durationMinutes: number;
  totalSeconds: number;
  endAt: number;
}

interface TimeUpAlert {
  carId: number;
  carName: string;
  durationMinutes: number;
  endedAt: string;
}

const CAR_IDS = [1, 2, 3, 4, 5, 6];

const STORAGE_KEYS = {
  DURATIONS: 'rc_timer_durations_v1',
  TIMERS: 'rc_timer_running_v1',
  SOUND: 'rc_timer_sound_v1',
  LANG: 'rc_playground_lang_v2',
  THEME: 'rc_playground_theme_v2',
};

const DEFAULT_DURATIONS: Record<number, number> = {
  1: 5,
  2: 5,
  3: 5,
  4: 5,
  5: 5,
  6: 5,
};

function safeGetStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage quota or privacy restrictions
  }
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = safeGetStorage(STORAGE_KEYS.THEME);
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    safeSetStorage(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  const [lang, setLang] = useState<Language>(() => {
    const saved = safeGetStorage(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'km';
  });

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'km' : 'en';
    setLang(next);
    safeSetStorage(STORAGE_KEYS.LANG, next);
  };

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = safeGetStorage(STORAGE_KEYS.SOUND);
    return saved !== 'false';
  });

  const toggleSound = () => {
    unlockAudioContext();
    setSoundEnabled((prev) => {
      const next = !prev;
      safeSetStorage(STORAGE_KEYS.SOUND, String(next));
      if (!next) stopTimeUpAlarm();
      return next;
    });
  };

  const [carDurations, setCarDurations] = useState<Record<number, number>>(
    () => {
      try {
        const raw = safeGetStorage(STORAGE_KEYS.DURATIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { ...DEFAULT_DURATIONS, ...parsed };
          }
        }
      } catch {
        // ignore
      }
      return DEFAULT_DURATIONS;
    }
  );

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.DURATIONS, JSON.stringify(carDurations));
  }, [carDurations]);

  const [runningTimers, setRunningTimers] = useState<
    Record<number, RunningTimer>
  >(() => {
    try {
      const raw = safeGetStorage(STORAGE_KEYS.TIMERS);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<number, RunningTimer>;
        if (parsed && typeof parsed === 'object') {
          const now = Date.now();
          const valid: Record<number, RunningTimer> = {};
          Object.values(parsed).forEach((timer) => {
            if (timer && typeof timer.endAt === 'number' && timer.endAt > now) {
              valid[timer.carId] = timer;
            }
          });
          return valid;
        }
      }
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.TIMERS, JSON.stringify(runningTimers));
  }, [runningTimers]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [timeUpAlerts, setTimeUpAlerts] = useState<TimeUpAlert[]>([]);

  const handleDismissTimeUp = useCallback((carId?: number) => {
    setTimeUpAlerts((prev) => {
      const next =
        typeof carId === 'number'
          ? prev.filter((item) => item.carId !== carId)
          : [];
      if (next.length === 0) {
        stopTimeUpAlarm();
      }
      return next;
    });
  }, []);

  const handleSelectDuration = (carId: number, minutes: number) => {
    unlockAudioContext();
    setCarDurations((prev) => ({ ...prev, [carId]: minutes }));
  };

  const handleStart = (carId: number) => {
    unlockAudioContext();
    handleDismissTimeUp(carId);
    const minutes = carDurations[carId] || 5;
    const totalSeconds = minutes * 60;
    const now = Date.now();
    setNowMs(now);
    setRunningTimers((prev) => ({
      ...prev,
      [carId]: {
        carId,
        durationMinutes: minutes,
        totalSeconds,
        endAt: now + totalSeconds * 1000,
      },
    }));
    playAlertTone('start', soundEnabled);
  };

  const handleStop = (carId: number) => {
    unlockAudioContext();
    handleDismissTimeUp(carId);
    setRunningTimers((prev) => {
      if (!prev[carId]) return prev;
      const next = { ...prev };
      delete next[carId];
      return next;
    });
    playAlertTone('stop', soundEnabled);
  };

  const handleStopAll = () => {
    unlockAudioContext();
    handleDismissTimeUp();
    setRunningTimers({});
    playAlertTone('stopAll', soundEnabled);
  };

  // Real-clock 250ms ticker so countdown stays exact even across background tabs
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);

      setRunningTimers((prev) => {
        const entries = Object.values(prev);
        if (entries.length === 0) return prev;

        const expired: RunningTimer[] = [];
        const nextTimers: Record<number, RunningTimer> = {};

        entries.forEach((timer) => {
          if (timer.endAt <= current) {
            expired.push(timer);
          } else {
            nextTimers[timer.carId] = timer;
          }
        });

        if (expired.length === 0) return prev;

        setTimeUpAlerts((prevAlerts) => {
          const filtered = prevAlerts.filter(
            (a) => !expired.some((e) => e.carId === a.carId)
          );
          const added: TimeUpAlert[] = expired.map((e) => ({
            carId: e.carId,
            carName: `CAR ${e.carId}`,
            durationMinutes: e.durationMinutes,
            endedAt: new Date(current).toLocaleTimeString(),
          }));
          return [...filtered, ...added];
        });

        startTimeUpAlarm(soundEnabled);
        return nextTimers;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const isKhmer = lang === 'km';
  const activeCount = Object.keys(runningTimers).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col bg-console-grid">
      {/* Minimal Single-Row Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              {isKhmer ? 'កំណត់ម៉ោងឡាន RC' : 'RC Timer'}
            </h1>
            {activeCount > 0 && (
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                · {activeCount} {isKhmer ? 'កំពុងលេង' : 'active'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSound}
              className={`min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] px-2.5 py-2 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                soundEnabled
                  ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              aria-label="Toggle Sound"
              title={isKhmer ? 'បិទ/បើកសំឡេង' : 'Toggle Sound'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[40px] sm:min-h-[42px] px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="sm:hidden">{isKhmer ? 'EN' : 'ខ្មែរ'}</span>
              <span className="hidden sm:inline">
                {isKhmer ? 'English' : 'ភាសាខ្មែរ'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] px-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleStopAll}
              className="min-h-[40px] sm:min-h-[42px] px-2.5 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <OctagonAlert className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">
                {isKhmer ? 'បិទទាំងអស់' : 'STOP ALL'}
              </span>
              <span className="hidden sm:inline">
                {isKhmer ? 'បញ្ឈប់ទាំងអស់' : 'STOP ALL'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Non-blocking Top Alert Strip when any car expires (clearly names which cars expired, without blocking other cards) */}
      {timeUpAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-3 sm:px-6 py-2.5 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold truncate">
                {isKhmer ? 'អស់ម៉ោងហើយ៖ ' : 'TIME IS UP: '}
                {timeUpAlerts.map((a) => a.carName).join(', ')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDismissTimeUp()}
              className="min-h-[34px] px-3 py-1 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isKhmer ? 'បិទសំឡេងទាំងអស់ (OK)' : 'Stop All Alarms (OK)'}
            </button>
          </div>
        </div>
      )}

      {/* Main 6-Car Timer Grid (2 columns on mobile, 3 columns on desktop) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2.5 sm:p-6 flex flex-col justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
          {CAR_IDS.map((carId) => {
            const running = runningTimers[carId];
            const remainingSeconds = running
              ? Math.max(0, Math.ceil((running.endAt - nowMs) / 1000))
              : null;

            return (
              <CarCard
                key={carId}
                carId={carId}
                carName={`CAR ${carId}`}
                durationMinutes={carDurations[carId] || 5}
                remainingSeconds={remainingSeconds}
                totalSeconds={
                  running
                    ? running.totalSeconds
                    : (carDurations[carId] || 5) * 60
                }
                isTimeUpAlert={timeUpAlerts.some((a) => a.carId === carId)}
                lang={lang}
                onSelectDuration={handleSelectDuration}
                onStart={handleStart}
                onStop={handleStop}
                onDismissTimeUp={handleDismissTimeUp}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
