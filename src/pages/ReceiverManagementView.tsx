import React from 'react';
import {
  Activity,
  Cpu,
  Radio,
  RefreshCw,
  Settings2,
  Terminal,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import {
  ApiCommandLog,
  BusinessSettings,
  CarUnit,
  MasterStatusResponse,
  OperationMode,
} from '../types/hardware';
import { TranslationStrings } from '../i18n/translations';

interface ReceiverManagementViewProps {
  mode: OperationMode;
  masterStatus: MasterStatusResponse;
  cars: CarUnit[];
  settings: BusinessSettings;
  apiLogs: ApiCommandLog[];
  t: TranslationStrings;
  onPingMaster: () => void;
  onToggleMode: (mode: OperationMode) => void;
  onToggleDemoOnline: (car: CarUnit) => void;
  onSetupDemoReceivers: () => void;
  onDisconnectAllDemo: () => void;
  onEditCar: (car: CarUnit) => void;
}

export const ReceiverManagementView: React.FC<ReceiverManagementViewProps> = ({
  mode,
  masterStatus,
  cars,
  settings,
  apiLogs,
  t,
  onPingMaster,
  onToggleMode,
  onToggleDemoOnline,
  onSetupDemoReceivers,
  onDisconnectAllDemo,
  onEditCar,
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {t.receiverManagement.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t.receiverManagement.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPingMaster}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>{t.actions.verifyConnection}</span>
          </button>
        </div>
      </div>

      {/* Hardware Architecture & Mode Switcher Card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>{t.receiverManagement.masterController}</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t.receiverManagement.architectureNote}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Master Web Server URL:{' '}
              <span className="font-mono text-neutral-800 dark:text-neutral-200">
                {settings.masterIpAddress}
              </span>{' '}
              · Heartbeat Interval: {settings.heartbeatIntervalSec}s · Timeout:{' '}
              {settings.heartbeatTimeoutSec}s
            </p>
          </div>

          {/* Interactive Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 self-start">
            <button
              type="button"
              onClick={() => onToggleMode('DEMO')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'DEMO'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t.modes.switchToDemo}
            </button>
            <button
              type="button"
              onClick={() => onToggleMode('LIVE_HARDWARE')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'LIVE_HARDWARE'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t.modes.switchToLive}
            </button>
          </div>
        </div>

        {/* Mode Status Explanation */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            {mode === 'DEMO' ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {t.modes.demoMode}: {t.modes.demoNotice}
              </span>
            ) : masterStatus.masterConnected ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {t.modes.liveConnected} ({settings.masterIpAddress})
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {t.modes.liveDisconnected}:{' '}
                {masterStatus.errorMessage || t.errors.masterUnreachable}
              </span>
            )}
          </div>

          {mode === 'DEMO' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onSetupDemoReceivers}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{t.actions.setupDemoReceivers}</span>
              </button>
              <button
                type="button"
                onClick={onDisconnectAllDemo}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.actions.disconnectAllSim}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 ESP32 Receiver Boards + 4 Relay Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => {
          const isOnline = car.connectionStatus === 'ONLINE';
          const lastBeatStr = car.lastHeartbeatAt
            ? new Date(car.lastHeartbeatAt).toLocaleTimeString()
            : 'None';

          return (
            <div
              key={car.receiverId}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>
                      ESP32 RECEIVER #{car.receiverId} · RELAY #{car.receiverId}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                    Paired to {car.name} ({car.remoteLabel})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onEditCar(car)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>MAC</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-200 dark:border-neutral-800 text-xs">
                <div>
                  <div className="text-neutral-500">MAC Address</div>
                  <div className="font-mono font-bold text-neutral-900 dark:text-white mt-0.5">
                    {car.macAddress || t.status.unconfigured}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500">
                    {t.receiverManagement.espNowChannel}
                  </div>
                  <div className="font-semibold mt-0.5 flex items-center gap-1.5">
                    {isOnline ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" />
                        {t.status.connected}
                      </span>
                    ) : (
                      <span className="text-neutral-500 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" />
                        {t.status.offline}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500">
                    {t.receiverManagement.relayStatus}
                  </div>
                  <div className="font-mono font-bold mt-0.5">
                    {car.relayState === 'ON' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t.status.relayOn}
                      </span>
                    ) : (
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {t.status.relayOff} (Default Safe)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-neutral-500">
                    {t.receiverManagement.lastHeartbeat}
                  </div>
                  <div className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200 mt-0.5 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>{lastBeatStr}</span>
                  </div>
                </div>
              </div>

              {mode === 'DEMO' && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500">
                    Demo ESP-NOW Heartbeat Simulator:
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleDemoOnline(car)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isOnline
                        ? 'border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isOnline
                      ? t.receiverManagement.simToggleOffline
                      : t.receiverManagement.simToggleOnline}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hardware Adapter Command & REST Endpoint Log */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              {t.receiverManagement.apiLogTitle}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            GET /api/status · POST /api/car/select · POST /api/session/start · POST /api/session/stop · POST /api/emergency-stop
          </span>
        </div>

        {apiLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            {t.receiverManagement.noLogs}
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 max-h-80 overflow-y-auto font-mono text-xs">
            {apiLogs.slice(0, 25).map((log) => (
              <div
                key={log.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-neutral-400 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {log.method} {log.endpoint}
                  </span>
                  <span className="text-neutral-500">[{log.mode}]</span>
                  {log.confirmed ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ACK OK
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      REJECTED / ERROR
                    </span>
                  )}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 truncate max-w-md">
                  {log.errorMessage
                    ? log.errorMessage
                    : JSON.stringify(log.responseBody || log.requestBody || {})}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
