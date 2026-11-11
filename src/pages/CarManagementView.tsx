import React from 'react';
import {
  AlertTriangle,
  Radio,
  Settings2,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  ActiveSession,
  BusinessSettings,
  CarUnit,
  OperationMode,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { CarCard } from '../components/CarCard';

interface CarManagementViewProps {
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
  onStartCar: (car: CarUnit) => void;
  onStopCar: (car: CarUnit) => void;
  onEditCar: (car: CarUnit) => void;
  onToggleDemoOnline: (car: CarUnit) => void;
  onSetupDemoReceivers: () => void;
}

export const CarManagementView: React.FC<CarManagementViewProps> = ({
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
  onStartCar,
  onStopCar,
  onEditCar,
  onToggleDemoOnline,
  onSetupDemoReceivers,
}) => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t.carManagement.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.carManagement.subtitle}
          </p>
        </div>

        {mode === 'DEMO' && (
          <button
            type="button"
            onClick={onSetupDemoReceivers}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span>{t.actions.setupDemoReceivers}</span>
          </button>
        )}
      </div>

      {/* Hardware Architecture & Safety Notice */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
            <p className="font-bold text-neutral-900 dark:text-white">
              {t.carManagement.remotePlacementNote}
            </p>
            <p>{t.carManagement.wiringSafetyWarning}</p>
          </div>
        </div>
      </div>

      {/* Explicit Car -> Receiver -> MAC Mapping Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Hardware Pairing Map (CAR → Receiver → MAC Address)
          </h2>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            {cars.length} Units Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-5 font-semibold">{t.carManagement.carNumber}</th>
                <th className="py-3 px-5 font-semibold">{t.carManagement.receiverNumber}</th>
                <th className="py-3 px-5 font-semibold">{t.carManagement.macAddress}</th>
                <th className="py-3 px-5 font-semibold">Remote Controller</th>
                <th className="py-3 px-5 font-semibold">Wiring Safety</th>
                <th className="py-3 px-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              {cars.map((car) => (
                <tr
                  key={car.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-neutral-900 dark:text-white">
                    <span className="font-mono text-neutral-500 mr-2">
                      #{car.id}
                    </span>
                    {car.name}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-blue-600 dark:text-blue-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" />
                      Receiver {car.receiverId}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                    {car.macAddress ? (
                      car.macAddress
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {t.status.unconfigured}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-neutral-600 dark:text-neutral-300">
                    {car.remoteLabel} (Beside RX #{car.receiverId})
                  </td>
                  <td className="py-3.5 px-5">
                    {car.wiringVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => onEditCar(car)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{t.actions.edit}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Car Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            activeSession={activeSessions.find((s) => s.carId === car.id)}
            isSelected={selectedCarId === car.id}
            selectedDuration={selectedDuration}
            sessionPrice={getPriceForDuration(selectedDuration)}
            currency={settings.currency}
            mode={mode}
            requireWiringVerification={settings.requireWiringVerification}
            isBusy={isBusy}
            t={t}
            onSelectCar={onSelectCar}
            onStartCar={onStartCar}
            onStopCar={onStopCar}
            onEditCar={onEditCar}
            onToggleDemoOnline={onToggleDemoOnline}
          />
        ))}
      </div>
    </div>
  );
};
