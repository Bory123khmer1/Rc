import React from 'react';
import {
  Activity,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Play,
  Radio,
  Square,
  WifiOff,
} from 'lucide-react';
import {
  ActiveSession,
  AdminPage,
  BusinessSettings,
  CarUnit,
  MasterStatusResponse,
  OperationMode,
  PlayHistoryRecord,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { CarCard } from '../components/CarCard';
import { formatCountdown, formatCurrency } from '../utils/sound';

interface DashboardViewProps {
  mode: OperationMode;
  masterStatus: MasterStatusResponse;
  cars: CarUnit[];
  activeSessions: ActiveSession[];
  history: PlayHistoryRecord[];
  settings: BusinessSettings;
  selectedCarId: number | null;
  selectedDuration: number;
  isBusy: boolean;
  t: TranslationStrings;
  getPriceForDuration: (minutes: number) => number;
  onSelectDuration: (minutes: number, car?: CarUnit) => void;
  onSelectCar: (car: CarUnit) => void;
  onStartCar: (car: CarUnit) => void;
  onStopCar: (car: CarUnit) => void;
  onEditCar: (car: CarUnit) => void;
  onToggleDemoOnline: (car: CarUnit) => void;
  onSetupDemoReceivers: () => void;
  onNavigate: (page: AdminPage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  mode,
  masterStatus,
  cars,
  activeSessions,
  history,
  settings,
  selectedCarId,
  selectedDuration,
  isBusy,
  t,
  getPriceForDuration,
  onSelectDuration,
  onSelectCar,
  onStartCar,
  onStopCar,
  onEditCar,
  onToggleDemoOnline,
  onNavigate,
}) => {
  const totalCars = cars.length;
  const carsInUse = cars.filter(
    (c) =>
      c.availability === 'IN_USE' ||
      activeSessions.some((s) => s.carId === c.id)
  ).length;
  const availableCars = cars.filter(
    (c) =>
      c.connectionStatus === 'ONLINE' &&
      c.availability === 'AVAILABLE' &&
      !activeSessions.some((s) => s.carId === c.id)
  ).length;
  const offlineReceivers = cars.filter(
    (c) => c.connectionStatus !== 'ONLINE'
  ).length;

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayRecords = history.filter(
    (r) =>
      r.startTime.slice(0, 10) === todayDateStr &&
      r.currency === settings.currency
  );
  const todayPlays = history.filter(
    (r) => r.startTime.slice(0, 10) === todayDateStr
  ).length;
  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="space-y-8">
      {/* Unified 8-Metric Architectural Ledger Strip */}
      <section
        aria-label="Playground Telemetry Summary"
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* 1. Master Connection Status */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.masterStatus}</span>
              <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight">
              {mode === 'DEMO' ? (
                <span className="text-blue-600 dark:text-blue-400">
                  {t.status.demoSimulated}
                </span>
              ) : masterStatus.masterConnected ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t.status.connected}
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  {t.status.disconnected}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-mono text-zinc-500 truncate">
              {mode === 'DEMO'
                ? 'Local Hardware Adapter'
                : settings.masterIpAddress}
            </div>
          </div>

          {/* 2. Available Cars */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.availableCars}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {availableCars}{' '}
              <span className="text-sm font-normal text-zinc-400">
                / {totalCars}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {t.metrics.totalCars}: {totalCars}
            </div>
          </div>

          {/* 3. Cars In Use & Active Sessions */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.carsInUse}</span>
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums text-zinc-900 dark:text-white">
              {carsInUse}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {t.metrics.activeSessions}: {activeSessions.length}
            </div>
          </div>

          {/* 4. Offline Receivers */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.offlineReceivers}</span>
              <WifiOff className="w-4 h-4 text-zinc-400" />
            </div>
            <div
              className={`mt-2 text-2xl sm:text-3xl font-mono font-bold tabular-nums ${
                offlineReceivers > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-zinc-900 dark:text-white'
              }`}
            >
              {offlineReceivers}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              ESP-NOW Receivers
            </div>
          </div>

          {/* 5. Total Cars */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.totalCars}</span>
              <Car className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-mono font-bold tabular-nums text-zinc-900 dark:text-white">
              {totalCars}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Beside RC Remotes
            </div>
          </div>

          {/* 6. Active Sessions */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.activeSessions}</span>
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-mono font-bold tabular-nums text-zinc-900 dark:text-white">
              {activeSessions.length}
            </div>
            <div className="mt-1 text-xs text-zinc-500 truncate">
              {activeSessions.length > 0
                ? activeSessions.map((s) => s.carName).join(', ')
                : 'All Relays OFF'}
            </div>
          </div>

          {/* 7. Today's Total Plays */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.todayPlays}</span>
              <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-mono font-bold tabular-nums text-zinc-900 dark:text-white">
              {todayPlays}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Recorded today
            </div>
          </div>

          {/* 8. Today's Revenue */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>{t.metrics.todayRevenue}</span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(todayRevenue, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Currency: {settings.currency}
            </div>
          </div>
        </div>
      </section>

      {/* Live Running Sessions Strip (When Active) */}
      {activeSessions.length > 0 && (
        <section
          aria-label="Active Sessions Strip"
          className="rounded-2xl border border-emerald-500/40 bg-emerald-950/10 p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                {t.sessionControl.activeSessionList} ({activeSessions.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sessions')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.sessions} →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSessions.map((session) => {
              const carObj = cars.find((c) => c.id === session.carId);
              return (
                <div
                  key={session.sessionId}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {session.carName} · Receiver #{session.receiverId} ·{' '}
                      {session.durationMinutes} {t.sessionControl.minShort}
                    </div>
                    <div className="mt-1 text-3xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCountdown(session.remainingSeconds)}
                    </div>
                  </div>
                  {carObj && (
                    <button
                      type="button"
                      onClick={() => onStopCar(carObj)}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{t.actions.stop}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4-Car Playground Control Deck */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              RC Car Control Deck
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tap a car card, choose duration (3, 5, 10, or 15 min), and press START.
            </p>
          </div>

          {/* Global Play Duration Segmented Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-800 self-start">
            {settings.availableDurations.map((mins) => {
              const active = selectedDuration === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSelectDuration(mins)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {mins} {t.sessionControl.minShort} ·{' '}
                  {formatCurrency(getPriceForDuration(mins), settings.currency)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              activeSession={activeSessions.find((s) => s.carId === car.id)}
              isSelected={selectedCarId === car.id}
              selectedDuration={selectedDuration}
              availableDurations={settings.availableDurations}
              sessionPrice={getPriceForDuration(selectedDuration)}
              currency={settings.currency}
              mode={mode}
              requireWiringVerification={settings.requireWiringVerification}
              isBusy={isBusy}
              t={t}
              onSelectCar={onSelectCar}
              onSelectDuration={onSelectDuration}
              onStartCar={onStartCar}
              onStopCar={onStopCar}
              onEditCar={onEditCar}
              onToggleDemoOnline={onToggleDemoOnline}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
