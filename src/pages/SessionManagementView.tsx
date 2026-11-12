import React from 'react';
import {
  Check,
  Clock,
  OctagonAlert,
  Play,
  Radio,
  ShieldAlert,
  Square,
  WifiOff,
} from 'lucide-react';
import {
  ActiveSession,
  BusinessSettings,
  CarUnit,
  OperationMode,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { formatCountdown, formatCurrency } from '../utils/sound';

interface SessionManagementViewProps {
  mode: OperationMode;
  cars: CarUnit[];
  activeSessions: ActiveSession[];
  settings: BusinessSettings;
  selectedCarId: number | null;
  selectedDuration: number;
  isBusy: boolean;
  t: TranslationStrings;
  getPriceForDuration: (minutes: number) => number;
  onSelectCar: (car: CarUnit) => void;
  onSelectDuration: (minutes: number) => void;
  onStartCar: (car: CarUnit) => void;
  onStopCar: (car: CarUnit) => void;
  onEmergencyStopAll: () => void;
}

export const SessionManagementView: React.FC<SessionManagementViewProps> = ({
  mode,
  cars,
  activeSessions,
  settings,
  selectedCarId,
  selectedDuration,
  isBusy,
  t,
  getPriceForDuration,
  onSelectCar,
  onSelectDuration,
  onStartCar,
  onStopCar,
  onEmergencyStopAll,
}) => {
  const selectedCar = cars.find((c) => c.id === selectedCarId) || null;
  const selectedCarSession = selectedCar
    ? activeSessions.find((s) => s.carId === selectedCar.id)
    : undefined;

  const isOnline = selectedCar?.connectionStatus === 'ONLINE';
  const isInUse =
    selectedCar?.availability === 'IN_USE' || Boolean(selectedCarSession);
  const hasMac = mode === 'DEMO' || Boolean(selectedCar?.macAddress);
  const wiringOk =
    mode === 'DEMO' ||
    !settings.requireWiringVerification ||
    Boolean(selectedCar?.wiringVerified);

  const canStartSelected =
    Boolean(selectedCar) &&
    Boolean(isOnline) &&
    !isInUse &&
    hasMac &&
    wiringOk &&
    !isBusy;

  let blockReason: string | null = null;
  if (!selectedCar) {
    blockReason = t.errors.selectCarFirst;
  } else if (!isOnline) {
    blockReason = t.errors.receiverOffline;
  } else if (isInUse) {
    blockReason = t.errors.carAlreadyInUse;
  } else if (!hasMac) {
    blockReason = t.errors.macNotConfigured;
  } else if (!wiringOk) {
    blockReason = t.errors.wiringNotVerified;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {t.sessionControl.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t.sessionControl.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onEmergencyStopAll}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <OctagonAlert className="w-4 h-4 shrink-0" />
          <span>{t.actions.emergencyStop}</span>
        </button>
      </div>

      {/* 3-Step Session Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Car */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              {t.sessionControl.step1SelectCar}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Only the selected car will receive START or STOP commands.
            </p>

            <div className="mt-4 space-y-2.5">
              {cars.map((car) => {
                const active = selectedCarId === car.id;
                const running =
                  car.availability === 'IN_USE' ||
                  activeSessions.some((s) => s.carId === car.id);
                const online = car.connectionStatus === 'ONLINE';

                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => onSelectCar(car)}
                    className={`w-full min-h-[54px] px-4 py-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      active
                        ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>{car.name}</span>
                        {active && <Check className="w-4 h-4 shrink-0" />}
                      </div>
                      <div
                        className={`text-xs font-mono mt-0.5 ${
                          active
                            ? 'text-zinc-300 dark:text-zinc-600'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        RX #{car.receiverId} ·{' '}
                        {car.macAddress ||
                          (mode === 'DEMO' ? 'Demo Link' : t.status.unconfigured)}
                      </div>
                    </div>

                    <div className="text-xs font-semibold shrink-0">
                      {running ? (
                        <span
                          className={
                            active
                              ? 'text-amber-300 dark:text-amber-700'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {t.status.inUse}
                        </span>
                      ) : online ? (
                        <span
                          className={
                            active
                              ? 'text-emerald-300 dark:text-emerald-700'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {t.status.available}
                        </span>
                      ) : (
                        <span
                          className={
                            active
                              ? 'text-zinc-300 dark:text-zinc-600'
                              : 'text-zinc-500'
                          }
                        >
                          {t.status.offline}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Select Play Duration */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              {t.sessionControl.step2SelectDuration}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              ESP32 Master automatically sends RELAY_OFF when the countdown reaches 00:00.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {settings.availableDurations.map((mins) => {
                const active = selectedDuration === mins;
                const price = getPriceForDuration(mins);
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onSelectDuration(mins)}
                    className={`min-h-[84px] p-4 rounded-xl border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                      active
                        ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Clock className="w-4 h-4 opacity-70" />
                      {active && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-bold tabular-nums">
                        {mins} {t.sessionControl.minShort}
                      </div>
                      <div
                        className={`text-xs font-mono tabular-nums mt-0.5 ${
                          active
                            ? 'text-zinc-300 dark:text-zinc-700'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(price, settings.currency)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Direct Custom Minutes Input */}
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t.sessionControl.minutes}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={selectedDuration}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 240) {
                      onSelectDuration(parsed);
                    }
                  }}
                  className="w-20 min-h-[38px] px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-medium text-zinc-500">
                  {t.sessionControl.minShort}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Selected Play Price:</span>
            <span className="font-mono font-bold text-base text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(
                getPriceForDuration(selectedDuration),
                settings.currency
              )}
            </span>
          </div>
        </div>

        {/* Step 3: Confirm & Dispatch Command */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                {t.sessionControl.step3ConfirmStart}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Verify target Receiver ID before sending ESP-NOW relay command.
              </p>
            </div>

            {selectedCar ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Target Car:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {selectedCar.name} (#{selectedCar.id})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    {t.sessionControl.targetReceiver}:
                  </span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    Receiver #{selectedCar.receiverId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    {t.sessionControl.targetMac}:
                  </span>
                  <span className="font-mono tabular-nums text-zinc-900 dark:text-white">
                    {selectedCar.macAddress ||
                      (mode === 'DEMO' ? 'Demo Link' : t.status.unconfigured)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Duration:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {selectedDuration} {t.sessionControl.minutes} (
                    {selectedDuration * 60}s)
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs text-zinc-500">
                {t.errors.selectCarFirst}
              </div>
            )}

            {blockReason && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{blockReason}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={!canStartSelected}
              onClick={() => selectedCar && onStartCar(selectedCar)}
              className={`min-h-[54px] px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                canStartSelected
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{t.actions.start}</span>
            </button>

            <button
              type="button"
              disabled={!selectedCar}
              onClick={() => selectedCar && onStopCar(selectedCar)}
              className="min-h-[54px] px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current shrink-0" />
              <span>{t.actions.stop}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Countdown Timers for All Active Sessions */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            {t.sessionControl.activeSessionList} ({activeSessions.length})
          </h2>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Auto-STOP at 00:00
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
            <WifiOff className="w-6 h-6 text-zinc-400" />
            <p>{t.sessionControl.noActiveSessions}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => {
              const carObj = cars.find((c) => c.id === session.carId);
              const pct = Math.max(
                0,
                Math.min(
                  100,
                  (session.remainingSeconds / session.totalSeconds) * 100
                )
              );

              return (
                <div
                  key={session.sessionId}
                  className="rounded-2xl border border-emerald-600/40 bg-zinc-50 dark:bg-zinc-950 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                        {session.sessionId} · RX #{session.receiverId} ·{' '}
                        {session.macAddress}
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                        {session.carName}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {t.status.relayOn}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <div
                      className={`text-4xl font-mono font-bold tabular-nums ${
                        session.remainingSeconds <= 30
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCountdown(session.remainingSeconds)}
                    </div>
                    <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {session.durationMinutes} {t.sessionControl.minShort} ·{' '}
                      {formatCurrency(session.price, session.currency)}
                    </div>
                  </div>

                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-transform duration-150 origin-left ${
                        session.remainingSeconds <= 30
                          ? 'bg-red-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                  </div>

                  <div className="flex justify-end">
                    {carObj && (
                      <button
                        type="button"
                        onClick={() => onStopCar(carObj)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>
                          {t.actions.stop} {session.carName}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
