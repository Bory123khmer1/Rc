import React from 'react';
import {
  CheckCircle2,
  Play,
  Radio,
  Settings2,
  Square,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  ActiveSession,
  CarUnit,
  Currency,
  OperationMode,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { formatCountdown, formatCurrency } from '../utils/sound';

interface CarCardProps {
  car: CarUnit;
  activeSession?: ActiveSession;
  isSelected: boolean;
  selectedDuration: number;
  availableDurations?: number[];
  sessionPrice: number;
  currency: Currency;
  mode: OperationMode;
  requireWiringVerification: boolean;
  isBusy: boolean;
  t: TranslationStrings;
  onSelectCar: (car: CarUnit) => void;
  onSelectDuration?: (minutes: number, car: CarUnit) => void;
  onStartCar: (car: CarUnit) => void;
  onStopCar: (car: CarUnit) => void;
  onEditCar?: (car: CarUnit) => void;
  onToggleDemoOnline?: (car: CarUnit) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  activeSession,
  isSelected,
  selectedDuration,
  availableDurations = [3, 5, 10, 15],
  sessionPrice,
  currency,
  mode,
  requireWiringVerification,
  isBusy,
  t,
  onSelectCar,
  onSelectDuration,
  onStartCar,
  onStopCar,
  onEditCar,
  onToggleDemoOnline,
}) => {
  const isOnline = car.connectionStatus === 'ONLINE';
  const isInUse = car.availability === 'IN_USE' || Boolean(activeSession);
  const isAvailable = isOnline && !isInUse;

  const liveRequirementsMet =
    mode === 'DEMO' ||
    (Boolean(car.macAddress) &&
      (!requireWiringVerification || car.wiringVerified));

  const canStart = isAvailable && liveRequirementsMet && !isBusy;

  const progressPercent = activeSession
    ? Math.max(
        0,
        Math.min(
          100,
          (activeSession.remainingSeconds / activeSession.totalSeconds) * 100
        )
      )
    : 0;

  return (
    <div
      onClick={() => onSelectCar(car)}
      className={`group relative rounded-2xl border transition-all duration-150 p-5 sm:p-6 flex flex-col justify-between gap-5 cursor-pointer ${
        isInUse
          ? 'border-emerald-500/70 bg-white dark:bg-zinc-900 shadow-sm'
          : isSelected
          ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}
    >
      {/* Card Header: Car Number + Name + Receiver Link + Configure Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl font-mono text-lg font-bold flex items-center justify-center shrink-0 transition-colors ${
              isInUse
                ? 'bg-emerald-600 text-white'
                : isSelected
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            0{car.id}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {car.name}
              </h3>
              {isSelected && (
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  · {t.actions.selected}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                Receiver #{car.receiverId}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[160px]">
                {car.macAddress
                  ? car.macAddress
                  : mode === 'DEMO'
                  ? 'Demo Link'
                  : t.status.unconfigured}
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {mode === 'DEMO' && onToggleDemoOnline && (
            <button
              type="button"
              onClick={() => onToggleDemoOnline(car)}
              title="Toggle Simulated Receiver Online/Offline"
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isOnline
                  ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {isOnline ? 'RX Online' : 'RX Offline'}
            </button>
          )}

          {onEditCar && (
            <button
              type="button"
              onClick={() => onEditCar(car)}
              className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title={t.actions.edit}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Digital Timer & Telemetry Instrument Display */}
      <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Availability Status */}
          <div className="font-semibold flex items-center gap-1.5">
            {isInUse ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>
                  {t.status.inUse} · {t.status.relayOn}
                </span>
              </span>
            ) : isAvailable ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.status.available}</span>
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>{t.status.offline}</span>
              </span>
            )}
          </div>

          {/* Receiver ESP-NOW Link Status */}
          <div className="font-mono text-xs">
            {isOnline ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                ESP-NOW OK
              </span>
            ) : (
              <span className="text-zinc-500">NO LINK</span>
            )}
          </div>
        </div>

        {/* Big Digital Countdown Readout */}
        <div className="flex items-baseline justify-between gap-4">
          <div
            className={`text-4xl sm:text-5xl font-mono font-bold tabular-nums tracking-tight leading-none ${
              activeSession
                ? activeSession.remainingSeconds <= 30
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                : isOnline
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-400 dark:text-zinc-700'
            }`}
          >
            {activeSession
              ? formatCountdown(activeSession.remainingSeconds)
              : formatCountdown(selectedDuration * 60)}
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {activeSession
                ? `${activeSession.durationMinutes} ${t.sessionControl.minShort}`
                : `${selectedDuration} ${t.sessionControl.minShort}`}
            </div>
            <div className="text-sm font-mono font-bold tabular-nums text-zinc-900 dark:text-white mt-0.5">
              {formatCurrency(
                activeSession ? activeSession.price : sessionPrice,
                currency
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-transform duration-150 origin-left ${
              activeSession
                ? activeSession.remainingSeconds <= 30
                  ? 'bg-red-600'
                  : 'bg-emerald-500'
                : 'bg-zinc-400 dark:bg-zinc-700'
            }`}
            style={{
              transform: `scaleX(${activeSession ? progressPercent / 100 : 0})`,
            }}
          />
        </div>
      </div>

      {/* Quick Duration Selector Row (when car is idle) */}
      {!activeSession && onSelectDuration && (
        <div
          className="grid grid-cols-4 gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {availableDurations.map((mins) => {
            const active = selectedDuration === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => onSelectDuration(mins, car)}
                className={`min-h-[40px] py-1.5 px-2 rounded-xl font-mono text-xs font-bold tabular-nums transition-colors cursor-pointer border ${
                  active
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white'
                    : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {mins} {t.sessionControl.minShort}
              </button>
            );
          })}
        </div>
      )}

      {/* Large Tactile Action Buttons: START (Green) & STOP (Red) */}
      <div
        className="grid grid-cols-2 gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={!canStart}
          onClick={() => onStartCar(car)}
          className={`min-h-[52px] px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
            canStart
              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white cursor-pointer shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          <span>{t.actions.start}</span>
        </button>

        {/* STOP must ALWAYS be available */}
        <button
          type="button"
          onClick={() => onStopCar(car)}
          className={`min-h-[52px] px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            isInUse
              ? 'bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white shadow-sm'
              : 'bg-red-600/90 hover:bg-red-600 text-white'
          }`}
        >
          <Square className="w-4 h-4 fill-current shrink-0" />
          <span>{t.actions.stop}</span>
        </button>
      </div>
    </div>
  );
};
