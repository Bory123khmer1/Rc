import React, { useState } from 'react';
import { Download, History, Trash2 } from 'lucide-react';
import { CarUnit, PlayHistoryRecord } from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { formatCurrency } from '../utils/sound';

interface PlayHistoryViewProps {
  history: PlayHistoryRecord[];
  cars: CarUnit[];
  t: TranslationStrings;
  onClearHistory: () => void;
}

export const PlayHistoryView: React.FC<PlayHistoryViewProps> = ({
  history,
  cars,
  t,
  onClearHistory,
}) => {
  const [selectedCarFilter, setSelectedCarFilter] = useState<number | 'ALL'>('ALL');

  const filtered =
    selectedCarFilter === 'ALL'
      ? history
      : history.filter((r) => r.carId === selectedCarFilter);

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Session ID',
      'Car ID',
      'Car Name',
      'Receiver ID',
      'Start Time',
      'End Time',
      'Duration (Min)',
      'Seconds Played',
      'Status',
      'Play Price',
      'Revenue',
      'Currency',
      'Mode',
    ];
    const rows = filtered.map((r) => [
      r.sessionId,
      r.carId,
      `"${r.carName.replace(/"/g, '""')}"`,
      r.receiverId,
      r.startTime,
      r.endTime,
      r.durationMinutes,
      r.actualSecondsPlayed,
      r.status,
      r.price,
      r.revenue,
      r.currency,
      r.mode,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rc_playground_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusText = (status: PlayHistoryRecord['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {t.status.completed}
          </span>
        );
      case 'STOPPED_EARLY':
        return (
          <span className="text-amber-600 dark:text-amber-400 font-semibold">
            {t.status.stoppedEarly}
          </span>
        );
      case 'EMERGENCY_STOPPED':
        return (
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {t.status.emergencyStopped}
          </span>
        );
      case 'COMM_FAILURE':
        return (
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {t.status.commFailure}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t.historyPage.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.historyPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={handleExportCsv}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{t.actions.exportCsv}</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{t.actions.clearHistory}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-fit overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setSelectedCarFilter('ALL')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCarFilter === 'ALL'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {t.historyPage.filterAll} ({history.length})
        </button>
        {cars.map((car) => {
          const count = history.filter((r) => r.carId === car.id).length;
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => setSelectedCarFilter(car.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCarFilter === car.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {car.name} ({count})
            </button>
          );
        })}
      </div>

      {/* History Data Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 px-6 text-center text-sm text-neutral-500 dark:text-neutral-400 flex flex-col items-center gap-2">
            <History className="w-7 h-7 text-neutral-400" />
            <p>{t.historyPage.noHistory}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                  <th className="py-3.5 px-4 font-semibold">
                    {t.historyPage.sessionId}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">{t.historyPage.car}</th>
                  <th className="py-3.5 px-4 font-semibold">
                    {t.historyPage.startTime}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    {t.historyPage.endTime}
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    {t.historyPage.duration}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    {t.historyPage.status}
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    {t.historyPage.price}
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    {t.historyPage.revenue}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono tabular-nums">
                {filtered.map((record) => (
                  <tr
                    key={record.sessionId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                      {record.sessionId}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-neutral-900 dark:text-white">
                      #{record.carId} {record.carName}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {new Date(record.startTime).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {new Date(record.endTime).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-neutral-800 dark:text-neutral-200">
                      {record.durationMinutes} min ({record.actualSecondsPlayed}s)
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {renderStatusText(record.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-neutral-600 dark:text-neutral-300">
                      {formatCurrency(record.price, record.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(record.revenue, record.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
