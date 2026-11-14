import React, { useEffect, useState } from 'react';
import { Clock, Minus, Play, Plus, Square, Timer } from 'lucide-react';
import { formatCountdown } from '../utils/sound';

const PRESET_DURATIONS = [3, 5, 10, 15];

interface CarCardProps {
  carId: number;
  carName: string;
  durationMinutes: number;
  remainingSeconds: number | null;
  totalSeconds: number;
  isTimeUpAlert: boolean;
  lang: 'km' | 'en';
  onSelectDuration: (carId: number, minutes: number) => void;
  onStart: (carId: number) => void;
  onStop: (carId: number) => void;
  onDismissTimeUp: (carId: number) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  carId,
  carName,
  durationMinutes,
  remainingSeconds,
  totalSeconds,
  isTimeUpAlert,
  lang,
  onSelectDuration,
  onStart,
  onStop,
  onDismissTimeUp,
}) => {
  const [customMinutesText, setCustomMinutesText] = useState<string>(
    String(durationMinutes)
  );

  useEffect(() => {
    setCustomMinutesText(String(durationMinutes));
  }, [durationMinutes]);

  const isRunning = remainingSeconds !== null;
  const isKhmer = lang === 'km';
  const minLabel = isKhmer ? 'នាទី' : 'min';

  const progressPercent =
    isRunning && totalSeconds > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
      : 0;

  return (
    <div
      onClick={() => {
        if (isTimeUpAlert) {
          onDismissTimeUp(carId);
        }
      }}
      className={`rounded-2xl border transition-all duration-150 p-3 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-4 ${
        isTimeUpAlert
          ? 'border-red-500 ring-4 ring-red-500/30 bg-red-950/15 dark:bg-red-950/25 cursor-pointer'
          : isRunning
          ? 'border-emerald-500/70 bg-white dark:bg-zinc-900 shadow-sm'
          : 'border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/70'
      }`}
    >
      {/* Header: Number Badge + Car Name + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl font-mono text-xs sm:text-lg font-bold flex items-center justify-center shrink-0 transition-colors ${
              isTimeUpAlert
                ? 'bg-red-600 text-white'
                : isRunning
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
            }`}
          >
            0{carId}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              {carName}
            </h3>
            <div className="text-[11px] sm:text-xs font-medium truncate">
              {isTimeUpAlert ? (
                <span className="text-red-600 dark:text-red-400 font-bold animate-pulse">
                  {isKhmer ? 'អស់ម៉ោង!' : 'TIME UP!'}
                </span>
              ) : isRunning ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isKhmer ? 'កំពុងលេង' : 'Running'}
                </span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  {isKhmer ? 'រួចរាល់' : 'Ready'}
                </span>
              )}
            </div>
          </div>
        </div>

        <Clock
          className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
            isTimeUpAlert
              ? 'text-red-600 dark:text-red-400 animate-pulse'
              : isRunning
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-zinc-400 dark:text-zinc-600'
          }`}
        />
      </div>

      {/* Digital Countdown Display */}
      <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div
            className={`text-2xl sm:text-4xl lg:text-[42px] font-mono font-bold tabular-nums tracking-tight leading-none ${
              isTimeUpAlert
                ? 'text-red-600 dark:text-red-400'
                : isRunning
                ? remainingSeconds <= 30
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {isRunning
              ? formatCountdown(remainingSeconds)
              : formatCountdown(durationMinutes * 60)}
          </div>

          <div className="text-right shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
            <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden sm:inline" />
            <span>
              {durationMinutes} {minLabel}
            </span>
          </div>
        </div>

        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-transform duration-150 origin-left ${
              isRunning
                ? remainingSeconds <= 30
                  ? 'bg-red-600'
                  : 'bg-emerald-500'
                : 'bg-zinc-400 dark:bg-zinc-700'
            }`}
            style={{
              transform: `scaleX(${isRunning ? progressPercent / 100 : 0})`,
            }}
          />
        </div>
      </div>

      {/* Minute Selection & Direct Custom Input (shown when idle) */}
      {!isRunning && (
        <div className="space-y-1.5 sm:space-y-2">
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {PRESET_DURATIONS.map((mins) => {
              const active = durationMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSelectDuration(carId, mins)}
                  className={`min-h-[36px] sm:min-h-[40px] py-1 px-1 sm:px-2 rounded-lg sm:rounded-xl font-mono text-[11px] sm:text-xs font-bold tabular-nums transition-colors cursor-pointer border whitespace-nowrap ${
                    active
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span>{mins}</span>
                  <span className="hidden sm:inline"> {minLabel}</span>
                  <span className="sm:hidden">m</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-1 sm:gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-1.5 sm:px-3 py-1 sm:py-1.5">
            <span className="hidden sm:inline text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              {isKhmer ? 'កំណត់នាទី៖' : 'Minutes:'}
            </span>

            <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, durationMinutes - 1);
                  onSelectDuration(carId, next);
                }}
                className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Decrease minutes"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min={1}
                max={240}
                value={customMinutesText}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomMinutesText(val);
                  const parsed = parseInt(val, 10);
                  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 240) {
                    onSelectDuration(carId, parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(customMinutesText, 10);
                  if (Number.isNaN(parsed) || parsed < 1) {
                    setCustomMinutesText(String(durationMinutes));
                  } else {
                    const clamped = Math.min(240, Math.max(1, parsed));
                    setCustomMinutesText(String(clamped));
                    onSelectDuration(carId, clamped);
                  }
                }}
                placeholder="5"
                className="w-12 sm:w-16 h-8 px-1 sm:px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center font-mono text-xs sm:text-sm font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(240, durationMinutes + 1);
                  onSelectDuration(carId, next);
                }}
                className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Increase minutes"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <span className="hidden sm:inline text-xs font-medium text-zinc-500 dark:text-zinc-400 pl-0.5">
                {minLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* START & STOP Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
        <button
          type="button"
          disabled={isRunning}
          onClick={() => onStart(carId)}
          className={`min-h-[44px] sm:min-h-[52px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 ${
            !isRunning
              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white cursor-pointer shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
          <span className="sm:hidden">{isKhmer ? 'បើក' : 'START'}</span>
          <span className="hidden sm:inline">
            {isKhmer ? 'ចាប់ផ្តើម' : 'START'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStop(carId)}
          className={`min-h-[44px] sm:min-h-[52px] px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            isRunning
              ? 'bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white shadow-sm'
              : 'bg-red-600/90 hover:bg-red-600 text-white'
          }`}
        >
          <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
          <span className="sm:hidden">{isKhmer ? 'បិទ' : 'STOP'}</span>
          <span className="hidden sm:inline">
            {isKhmer ? 'បញ្ឈប់' : 'STOP'}
          </span>
        </button>
      </div>
    </div>
  );
};
