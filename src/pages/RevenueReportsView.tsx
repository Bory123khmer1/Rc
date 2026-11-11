import React from 'react';
import { BarChart3, Clock, DollarSign, Play } from 'lucide-react';
import {
  BusinessSettings,
  CarUnit,
  PlayHistoryRecord,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { formatCurrency } from '../utils/sound';

interface RevenueReportsViewProps {
  history: PlayHistoryRecord[];
  cars: CarUnit[];
  settings: BusinessSettings;
  t: TranslationStrings;
}

export const RevenueReportsView: React.FC<RevenueReportsViewProps> = ({
  history,
  cars,
  settings,
  t,
}) => {
  const activeCurrencyRecords = history.filter(
    (r) => r.currency === settings.currency
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = activeCurrencyRecords
    .filter((r) => r.startTime.slice(0, 10) === todayStr)
    .reduce((sum, r) => sum + r.revenue, 0);

  const totalRevenue = activeCurrencyRecords.reduce(
    (sum, r) => sum + r.revenue,
    0
  );
  const totalPlays = history.length;
  const avgDuration =
    totalPlays > 0
      ? (
          history.reduce((sum, r) => sum + r.durationMinutes, 0) / totalPlays
        ).toFixed(1)
      : '0.0';

  const maxCarRevenue = Math.max(
    1,
    ...cars.map((car) =>
      activeCurrencyRecords
        .filter((r) => r.carId === car.id)
        .reduce((sum, r) => sum + r.revenue, 0)
    )
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t.reportsPage.title}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {t.reportsPage.subtitle}
        </p>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>{t.reportsPage.totalRevenueToday}</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(todayRevenue, settings.currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>{t.reportsPage.totalRevenueAllTime}</span>
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
            {formatCurrency(totalRevenue, settings.currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>{t.reportsPage.totalCompletedPlays}</span>
            <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
            {totalPlays}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>{t.reportsPage.avgPlayDuration}</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
            {avgDuration} {t.sessionControl.minShort}
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Car */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {t.reportsPage.revenueByCar}
          </h2>

          <div className="space-y-4">
            {cars.map((car) => {
              const carPlays = history.filter((r) => r.carId === car.id).length;
              const carRev = activeCurrencyRecords
                .filter((r) => r.carId === car.id)
                .reduce((sum, r) => sum + r.revenue, 0);
              const ratio = Math.min(100, (carRev / maxCarRevenue) * 100);

              return (
                <div key={car.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-900 dark:text-white">
                      #{car.id} {car.name}{' '}
                      <span className="font-normal text-neutral-500">
                        (RX #{car.receiverId})
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {carPlays} {t.reportsPage.playsCount} ·{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(carRev, settings.currency)}
                      </strong>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 origin-left transition-transform duration-200"
                      style={{ transform: `scaleX(${ratio / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Duration */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            {t.reportsPage.revenueByDuration}
          </h2>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
            {settings.availableDurations.map((mins) => {
              const durPlays = history.filter(
                (r) => r.durationMinutes === mins
              ).length;
              const durRev = activeCurrencyRecords
                .filter((r) => r.durationMinutes === mins)
                .reduce((sum, r) => sum + r.revenue, 0);

              return (
                <div
                  key={mins}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                      {mins} {t.sessionControl.minutes}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums flex items-center gap-4">
                    <span className="text-neutral-500">
                      {durPlays} {t.reportsPage.playsCount}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(durRev, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
