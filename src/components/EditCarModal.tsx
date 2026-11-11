import React, { useState } from 'react';
import { AlertTriangle, Radio, ShieldCheck, X } from 'lucide-react';
import { CarUnit } from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';
import { isValidMacAddress, normalizeMacAddress } from '../services/hardwareAdapter';

interface EditCarModalProps {
  car: CarUnit | null;
  t: TranslationStrings;
  onClose: () => void;
  onSave: (
    carId: number,
    updates: {
      name: string;
      macAddress: string;
      remoteLabel: string;
      wiringVerified: boolean;
    }
  ) => void;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({
  car,
  t,
  onClose,
  onSave,
}) => {
  if (!car) return null;

  const [name, setName] = useState(car.name);
  const [macAddress, setMacAddress] = useState(car.macAddress);
  const [remoteLabel, setRemoteLabel] = useState(car.remoteLabel);
  const [wiringVerified, setWiringVerified] = useState(car.wiringVerified);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedMac = normalizeMacAddress(macAddress);
    if (cleanedMac && !isValidMacAddress(cleanedMac)) {
      setError(t.errors.invalidMacFormat);
      return;
    }
    onSave(car.id, {
      name: name.trim() || `CAR ${car.id}`,
      macAddress: cleanedMac,
      remoteLabel: remoteLabel.trim() || `Remote #${car.id}`,
      wiringVerified,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>
                CAR #{car.id} → RECEIVER #{car.receiverId}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {t.carManagement.editCarTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label={t.actions.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t.carManagement.carName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              placeholder={`CAR ${car.id}`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t.carManagement.macAddress} (ESP32 Receiver #{car.receiverId})
            </label>
            <input
              type="text"
              value={macAddress}
              onChange={(e) => {
                setMacAddress(e.target.value);
                setError(null);
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono uppercase text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder={t.carManagement.macPlaceholder}
            />
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              Format: 6 hex bytes separated by colons (e.g.{' '}
              <span className="font-mono">24:6F:28:AA:BB:0{car.id}</span>). Leave blank if receiver hardware is not yet paired.
            </p>
            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Original RC Remote Label (Beside Receiver #{car.receiverId})
            </label>
            <input
              type="text"
              value={remoteLabel}
              onChange={(e) => setRemoteLabel(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              placeholder={`Original RC Remote #${car.id}`}
            />
          </div>

          {/* Hardware Placement & Wiring Safety Verification */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{t.carManagement.remotePlacementNote}</p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {t.carManagement.wiringSafetyWarning}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wiringVerified}
                onChange={(e) => setWiringVerified(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-600"
              />
              <span className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t.carManagement.wiringVerifiedLabel}</span>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.actions.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
