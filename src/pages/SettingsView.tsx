import React, { useState } from 'react';
import { CheckCircle2, Cpu, Save, Shield, Store } from 'lucide-react';
import { BusinessSettings, Currency } from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';

interface SettingsViewProps {
  settings: BusinessSettings;
  t: TranslationStrings;
  onSaveSettings: (newSettings: BusinessSettings) => void;
}

const PRESET_DURATIONS = [1, 3, 5, 10, 15, 20, 30];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  t,
  onSaveSettings,
}) => {
  const [formState, setFormState] = useState<BusinessSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  const toggleDurationOption = (mins: number) => {
    const exists = formState.availableDurations.includes(mins);
    if (exists && formState.availableDurations.length <= 1) return; // keep at least 1 duration
    const updated = exists
      ? formState.availableDurations.filter((d) => d !== mins)
      : [...formState.availableDurations, mins].sort((a, b) => a - b);
    setFormState({ ...formState, availableDurations: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formState);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t.settingsPage.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.settingsPage.subtitle}
          </p>
        </div>

        <button
          type="submit"
          className="min-h-[48px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4 shrink-0" />
          <span>{t.actions.save}</span>
        </button>
      </div>

      {savedToast && (
        <div className="rounded-xl border border-emerald-600/40 bg-emerald-950/20 p-4 flex items-center gap-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{t.settingsPage.savedSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Business & Pricing Section */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2>{t.settingsPage.businessSection}</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t.settingsPage.businessName}
            </label>
            <input
              type="text"
              value={formState.businessName}
              onChange={(e) =>
                setFormState({ ...formState, businessName: e.target.value })
              }
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.currency}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['USD', 'KHR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFormState({ ...formState, currency: curr })}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold font-mono transition-colors cursor-pointer ${
                      formState.currency === curr
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {curr === 'USD' ? 'USD ($)' : 'KHR (៛)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.numberOfCars}
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={formState.numberOfCars}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    numberOfCars: Math.max(
                      1,
                      Math.min(8, Number(e.target.value) || 4)
                    ),
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.pricePerPlay} (USD $)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formState.pricePerPlayUSD}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    pricePerPlayUSD: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.pricePerPlay} (KHR ៛)
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={formState.pricePerPlayKHR}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    pricePerPlayKHR: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Available Play Durations */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.settingsPage.availableDurations}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((mins) => {
                const selected = formState.availableDurations.includes(mins);
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => toggleDurationOption(mins)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {mins} min
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Hardware Network & Safety Section */}
        <div className="space-y-6">
          {/* ESP32 Master Network */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2>{t.settingsPage.hardwareSection}</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.masterIpAddress}
              </label>
              <input
                type="text"
                value={formState.masterIpAddress}
                onChange={(e) =>
                  setFormState({ ...formState, masterIpAddress: e.target.value })
                }
                placeholder="http://192.168.4.1"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t.settingsPage.authToken}
              </label>
              <input
                type="text"
                value={formState.masterAuthToken}
                onChange={(e) =>
                  setFormState({ ...formState, masterAuthToken: e.target.value })
                }
                placeholder="RC-ADMIN-LOCAL-KEY"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Emergency Stop & Safety Settings */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h2>{t.settingsPage.safetySection}</h2>
            </div>

            <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {t.settingsPage.autoStopHeartbeat}
              </span>
              <input
                type="checkbox"
                checked={formState.autoStopOnHeartbeatLoss}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    autoStopOnHeartbeatLoss: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {t.settingsPage.requireWiringCheck}
              </span>
              <input
                type="checkbox"
                checked={formState.requireWiringVerification}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    requireWiringVerification: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {t.settingsPage.confirmEmergencyStop}
              </span>
              <input
                type="checkbox"
                checked={formState.confirmBeforeEmergencyStop}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    confirmBeforeEmergencyStop: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {t.settingsPage.soundAlerts}
              </span>
              <input
                type="checkbox"
                checked={formState.soundAlertsEnabled}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    soundAlertsEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded accent-emerald-600"
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};
