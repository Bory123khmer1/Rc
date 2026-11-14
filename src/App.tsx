import { useCallback, useEffect, useState } from 'react';
import {
  BellRing,
  Globe,
  Moon,
  OctagonAlert,
  Play,
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

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'km';
  });

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'km' : 'en';
    setLang(next);
    localStorage.setItem(STORAGE_KEYS.LANG, next);
  };

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    return saved !== 'false';
  });

  const toggleSound = () => {
    unlockAudioContext();
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SOUND, String(next));
      if (!next) stopTimeUpAlarm();
      return next;
    });
  };

  const [carDurations, setCarDurations] = useState<Record<number, number>>(
    () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.DURATIONS);
        if (raw) {
          return { ...DEFAULT_DURATIONS, ...JSON.parse(raw) };
        }
      } catch {
        // ignore
      }
      return DEFAULT_DURATIONS;
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DURATIONS, JSON.stringify(carDurations));
    } catch {
      // ignore
    }
  }, [carDurations]);

  const [runningTimers, setRunningTimers] = useState<
    Record<number, RunningTimer>
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TIMERS);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<number, RunningTimer>;
        const now = Date.now();
        const valid: Record<number, RunningTimer> = {};
        Object.values(parsed).forEach((timer) => {
          if (timer && timer.endAt > now) {
            valid[timer.carId] = timer;
          }
        });
        return valid;
      }
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMERS, JSON.stringify(runningTimers));
    } catch {
      // ignore
    }
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
              <span className="sm:hidden">{isKhmer ? 'បិទទាំងអស់' : 'STOP ALL'}</span>
              <span className="hidden sm:inline">
                {isKhmer ? 'បញ្ឈប់ទាំងអស់' : 'STOP ALL'}
              </span>
            </button>
          </div>
        </div>
      </header>

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
                totalSeconds={running ? running.totalSeconds : (carDurations[carId] || 5) * 60}
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

      {/* Time-Up Popup Alert Modal + Repeating Sound Alarm */}
      {timeUpAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-red-500 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {isKhmer ? 'អស់ម៉ោងលេងហើយ!' : 'TIME IS UP!'}
                </h2>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-0.5">
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isKhmer
                      ? 'នាឡិកាបានរាប់ដល់ 00:00 ហើយ'
                      : 'Countdown timer reached 00:00'}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {timeUpAlerts.map((alertItem) => (
                <div
                  key={alertItem.carId}
                  className="rounded-xl border border-red-500/40 bg-red-950/10 dark:bg-red-950/30 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {alertItem.carName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {isKhmer ? 'រយៈពេល៖' : 'Duration:'}{' '}
                      <span className="font-mono font-bold text-zinc-900 dark:text-white">
                        {alertItem.durationMinutes} {isKhmer ? 'នាទី' : 'min'}
                      </span>{' '}
                      · {alertItem.endedAt}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStart(alertItem.carId)}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>{isKhmer ? 'លេងម្តងទៀត' : 'Start Again'}</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleDismissTimeUp()}
              className="w-full min-h-[52px] px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <BellRing className="w-5 h-5 shrink-0" />
              <span>
                {isKhmer
                  ? 'បិទសំឡេងរោទ៍ និង យល់ព្រម (OK)'
                  : 'Stop Alarm & Dismiss (OK)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
