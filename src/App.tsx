import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Car,
  Gamepad2,
  Globe,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  OctagonAlert,
  Radio,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import {
  ActiveSession,
  AdminPage,
  ApiCommandLog,
  BusinessSettings,
  CarUnit,
  Language,
  MasterStatusResponse,
  OperationMode,
  PlayHistoryRecord,
  SessionEndStatus,
} from './types/hardware';
import { TRANSLATIONS } from './i18n/translations';
import { HardwareAdapter } from './services/hardwareAdapter';
import { formatCurrency, playAlertTone } from './utils/sound';
import { EditCarModal } from './components/EditCarModal';
import { CarCard } from './components/CarCard';
import { DashboardView } from './pages/DashboardView';
import { CarManagementView } from './pages/CarManagementView';
import { SessionManagementView } from './pages/SessionManagementView';
import { ReceiverManagementView } from './pages/ReceiverManagementView';
import { PlayHistoryView } from './pages/PlayHistoryView';
import { RevenueReportsView } from './pages/RevenueReportsView';
import { SettingsView } from './pages/SettingsView';

type ViewMode = 'four_cars' | AdminPage;

const STORAGE_KEYS = {
  SETTINGS: 'rc_playground_settings_v2',
  CARS: 'rc_playground_cars_v2',
  HISTORY: 'rc_playground_history_v2',
  LANG: 'rc_playground_lang_v2',
  THEME: 'rc_playground_theme_v2',
};

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'RC Playground',
  currency: 'USD',
  pricePerPlayUSD: 2.0,
  pricePerPlayKHR: 8000,
  useDurationTierPricing: false,
  durationPricesUSD: { 3: 1.0, 5: 2.0, 10: 3.5, 15: 5.0 },
  durationPricesKHR: { 3: 4000, 5: 8000, 10: 14000, 15: 20000 },
  availableDurations: [3, 5, 10, 15],
  numberOfCars: 4,
  masterIpAddress: 'http://192.168.4.1',
  masterAuthToken: 'RC-LOCAL-MASTER-AUTH',
  heartbeatIntervalSec: 2,
  heartbeatTimeoutSec: 6,
  autoStopOnHeartbeatLoss: true,
  requireWiringVerification: true,
  confirmBeforeEmergencyStop: false,
  soundAlertsEnabled: true,
};

function createInitialCars(
  count: number,
  mode: OperationMode = 'DEMO'
): CarUnit[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const isDemo = mode === 'DEMO';
    return {
      id: num,
      name: `CAR ${num}`,
      receiverId: num,
      macAddress: '',
      connectionStatus: isDemo ? 'ONLINE' : 'UNCONFIGURED',
      availability: isDemo ? 'AVAILABLE' : 'OFFLINE',
      relayState: 'OFF',
      lastHeartbeatAt: isDemo ? now : null,
      wiringVerified: false,
      remoteLabel: `Original RC Remote #${num}`,
    };
  });
}

export default function App() {
  // Theme (Dark mode by default)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Language (Khmer / English)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'km';
  });

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'km' : 'en';
    setLang(next);
    localStorage.setItem(STORAGE_KEYS.LANG, next);
  };

  const t = TRANSLATIONS[lang];

  // Default view is ONLY the 4 Car Cards ('four_cars'), with 1 Menu button to enter other pages
  const [activeView, setActiveView] = useState<ViewMode>('four_cars');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Operation Mode: Start in DEMO mode
  const [mode, setMode] = useState<OperationMode>('DEMO');

  // Business Settings
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Cars State (Relay always defaults to OFF during startup)
  const [cars, setCars] = useState<CarUnit[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARS);
      if (raw) {
        const parsed = JSON.parse(raw) as CarUnit[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => ({
            ...c,
            relayState: 'OFF',
            connectionStatus: 'ONLINE',
            availability: 'AVAILABLE',
          }));
        }
      }
    } catch {
      // ignore
    }
    return createInitialCars(DEFAULT_SETTINGS.numberOfCars, 'DEMO');
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    } catch {
      // ignore
    }
  }, [cars]);

  const [selectedCarId, setSelectedCarId] = useState<number | null>(1);
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  // Per-car duration map so each of the 4 cards can have its own duration chosen independently
  const [carDurations, setCarDurations] = useState<Record<number, number>>({
    1: 5,
    2: 5,
    3: 5,
    4: 5,
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // Play History
  const [history, setHistory] = useState<PlayHistoryRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (raw) return JSON.parse(raw) as PlayHistoryRecord[];
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Master Status & API Command Logs
  const [masterStatus, setMasterStatus] = useState<MasterStatusResponse>({
    mode: 'DEMO',
    masterConnected: false,
    masterIp: settings.masterIpAddress,
    espNowReady: false,
    selectedCarId: 1,
    lastSyncAt: null,
    errorMessage: null,
  });

  const [apiLogs, setApiLogs] = useState<ApiCommandLog[]>([]);
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [editingCar, setEditingCar] = useState<CarUnit | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const appendLog = useCallback((log: ApiCommandLog) => {
    setApiLogs((prev) => [log, ...prev.slice(0, 49)]);
  }, []);

  const getPriceForDuration = useCallback(
    (_minutes: number): number => {
      if (settings.currency === 'USD') {
        return settings.pricePerPlayUSD;
      }
      return settings.pricePerPlayKHR;
    },
    [settings.currency, settings.pricePerPlayKHR, settings.pricePerPlayUSD]
  );

  // Ping / Query ESP32 Master Status
  const handlePingMaster = useCallback(
    async (overrideMode?: OperationMode) => {
      const targetMode = overrideMode || mode;
      const { result, log } = await HardwareAdapter.getStatus(
        targetMode,
        settings,
        selectedCarId
      );
      appendLog(log);
      if (result.data) {
        setMasterStatus(result.data);
      }
      if (targetMode === 'LIVE_HARDWARE' && !result.ok) {
        setBannerAlert({
          type: 'error',
          message: result.error || t.errors.masterUnreachable,
        });
      }
    },
    [appendLog, mode, selectedCarId, settings, t.errors.masterUnreachable]
  );

  // Switch between Demo Mode and Live Hardware Mode
  const handleToggleMode = async (nextMode: OperationMode) => {
    setMode(nextMode);
    if (nextMode === 'LIVE_HARDWARE') {
      setCars((prev) =>
        prev.map((c) => ({
          ...c,
          connectionStatus: c.macAddress ? 'OFFLINE' : 'UNCONFIGURED',
          availability: 'OFFLINE',
          relayState: 'OFF',
        }))
      );
      await handlePingMaster('LIVE_HARDWARE');
    } else {
      const now = Date.now();
      setCars((prev) =>
        prev.map((c) => {
          const isRunning = activeSessions.some((s) => s.carId === c.id);
          return {
            ...c,
            connectionStatus: 'ONLINE',
            availability: isRunning ? 'IN_USE' : 'AVAILABLE',
            lastHeartbeatAt: now,
          };
        })
      );
      await handlePingMaster('DEMO');
      setBannerAlert(null);
    }
  };

  // Demo Helper: Re-connect all simulated receivers
  const handleSetupDemoReceivers = () => {
    if (mode !== 'DEMO') return;
    const now = Date.now();
    setCars((prev) =>
      prev.map((car) => {
        const isRunning = activeSessions.some((s) => s.carId === car.id);
        return {
          ...car,
          connectionStatus: 'ONLINE',
          availability: isRunning ? 'IN_USE' : 'AVAILABLE',
          lastHeartbeatAt: now,
        };
      })
    );
  };

  const handleDisconnectAllDemo = () => {
    if (mode !== 'DEMO') return;
    setCars((prev) =>
      prev.map((car) => ({
        ...car,
        connectionStatus: 'OFFLINE',
        availability: 'OFFLINE',
        relayState: 'OFF',
      }))
    );
  };

  // Toggle individual Demo Receiver Online / Offline
  const handleToggleDemoOnline = (car: CarUnit) => {
    if (mode !== 'DEMO') return;
    const goingOnline = car.connectionStatus !== 'ONLINE';

    setCars((prev) =>
      prev.map((c) => {
        if (c.id !== car.id) return c;
        if (goingOnline) {
          return {
            ...c,
            connectionStatus: 'ONLINE',
            availability: activeSessions.some((s) => s.carId === c.id)
              ? 'IN_USE'
              : 'AVAILABLE',
            lastHeartbeatAt: Date.now(),
          };
        }
        return {
          ...c,
          connectionStatus: 'OFFLINE',
          availability: 'OFFLINE',
          relayState: 'OFF',
        };
      })
    );

    if (!goingOnline && settings.autoStopOnHeartbeatLoss) {
      const runningSession = activeSessions.find((s) => s.carId === car.id);
      if (runningSession) {
        finalizeStoppedSession(runningSession, 'COMM_FAILURE');
        setBannerAlert({
          type: 'error',
          message: `Heartbeat lost on Receiver #${car.receiverId} (${car.name}). Session stopped automatically.`,
        });
        playAlertTone('error', settings.soundAlertsEnabled);
      }
    }
  };

  // Select Car
  const handleSelectCar = async (car: CarUnit) => {
    setSelectedCarId(car.id);
    const { log } = await HardwareAdapter.selectCar(mode, settings, car);
    appendLog(log);
  };

  // Select Duration (per car or global)
  const handleSelectDuration = (minutes: number, car?: CarUnit) => {
    setSelectedDuration(minutes);
    if (car) {
      setCarDurations((prev) => ({ ...prev, [car.id]: minutes }));
      if (selectedCarId !== car.id) {
        handleSelectCar(car);
      }
    } else if (selectedCarId) {
      setCarDurations((prev) => ({ ...prev, [selectedCarId]: minutes }));
    }
  };

  // Record finished session into PlayHistory
  const finalizeStoppedSession = useCallback(
    (session: ActiveSession, endStatus: SessionEndStatus) => {
      const endTime = new Date().toISOString();
      const actualSeconds = Math.max(
        1,
        session.totalSeconds - session.remainingSeconds
      );
      const record: PlayHistoryRecord = {
        sessionId: session.sessionId,
        carId: session.carId,
        carName: session.carName,
        receiverId: session.receiverId,
        macAddress: session.macAddress || 'DEMO',
        startTime: session.startedAt,
        endTime,
        durationMinutes: session.durationMinutes,
        actualSecondsPlayed: actualSeconds,
        status: endStatus,
        price: session.price,
        revenue: endStatus === 'COMM_FAILURE' ? 0 : session.price,
        currency: session.currency,
        mode: session.mode,
      };

      setHistory((prev) => [record, ...prev]);
      setActiveSessions((prev) =>
        prev.filter((s) => s.sessionId !== session.sessionId)
      );
      setCars((prev) =>
        prev.map((c) =>
          c.id === session.carId
            ? {
                ...c,
                relayState: 'OFF',
                availability:
                  c.connectionStatus === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE',
              }
            : c
        )
      );
    },
    []
  );

  // Start Session
  const handleStartCar = async (car: CarUnit) => {
    if (isBusy) return;
    setIsBusy(true);
    setBannerAlert(null);

    const dur = carDurations[car.id] || selectedDuration;

    try {
      if (selectedCarId !== car.id) {
        setSelectedCarId(car.id);
        const sel = await HardwareAdapter.selectCar(mode, settings, car);
        appendLog(sel.log);
      }

      const { result, log } = await HardwareAdapter.startSession(
        mode,
        settings,
        car,
        car.id,
        dur,
        activeSessions
      );
      appendLog(log);

      if (!result.ok || !result.confirmedByHardware || !result.data) {
        setBannerAlert({
          type: 'error',
          message: result.error || 'START rejected by Hardware Adapter.',
        });
        playAlertTone('error', settings.soundAlertsEnabled);
        return;
      }

      const price = getPriceForDuration(dur);
      const newSession: ActiveSession = {
        sessionId: result.data.sessionId,
        carId: car.id,
        carName: car.name,
        receiverId: car.receiverId,
        macAddress: car.macAddress || 'DEMO-LINK',
        durationMinutes: dur,
        totalSeconds: dur * 60,
        remainingSeconds: dur * 60,
        startedAt: new Date().toISOString(),
        price,
        currency: settings.currency,
        status: 'RUNNING',
        mode,
      };

      setActiveSessions((prev) => [...prev, newSession]);
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id
            ? {
                ...c,
                relayState: 'ON',
                availability: 'IN_USE',
                lastHeartbeatAt: Date.now(),
              }
            : c
        )
      );
      playAlertTone('start', settings.soundAlertsEnabled);
    } finally {
      setIsBusy(false);
    }
  };

  // Stop Session
  const handleStopCar = useCallback(
    async (
      car: CarUnit,
      reason: 'TIMER_EXPIRED' | 'MANUAL_STOP' | 'HEARTBEAT_LOST' = 'MANUAL_STOP'
    ) => {
      const existingSession = activeSessions.find((s) => s.carId === car.id);

      const { result, log } = await HardwareAdapter.stopSession(
        mode,
        settings,
        car,
        reason
      );
      appendLog(log);

      if (!result.ok || !result.confirmedByHardware) {
        setBannerAlert({
          type: 'error',
          message:
            result.error ||
            `STOP confirmation failed for ${car.name} (RX #${car.receiverId}).`,
        });
        playAlertTone('error', settings.soundAlertsEnabled);
        return;
      }

      if (existingSession) {
        const endStatus: SessionEndStatus =
          reason === 'TIMER_EXPIRED'
            ? 'COMPLETED'
            : reason === 'HEARTBEAT_LOST'
            ? 'COMM_FAILURE'
            : 'STOPPED_EARLY';
        finalizeStoppedSession(existingSession, endStatus);
      } else {
        setCars((prev) =>
          prev.map((c) =>
            c.id === car.id
              ? {
                  ...c,
                  relayState: 'OFF',
                  availability:
                    c.connectionStatus === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE',
                }
              : c
          )
        );
      }

      playAlertTone('complete', settings.soundAlertsEnabled);
    },
    [activeSessions, appendLog, finalizeStoppedSession, mode, settings]
  );

  // Emergency Stop All
  const executeEmergencyStopAll = async () => {
    setShowEmergencyModal(false);
    const { result, log } = await HardwareAdapter.emergencyStopAll(
      mode,
      settings,
      cars
    );
    appendLog(log);

    if (!result.ok || !result.confirmedByHardware) {
      setBannerAlert({
        type: 'error',
        message:
          result.error ||
          'Emergency Stop not confirmed by hardware! Power off RC remotes manually!',
      });
      playAlertTone('emergency', settings.soundAlertsEnabled);
      return;
    }

    activeSessions.forEach((session) => {
      finalizeStoppedSession(session, 'EMERGENCY_STOPPED');
    });

    setCars((prev) =>
      prev.map((c) => ({
        ...c,
        relayState: 'OFF',
        availability: c.connectionStatus === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE',
      }))
    );

    playAlertTone('emergency', settings.soundAlertsEnabled);
  };

  const handleEmergencyStopClick = () => {
    if (settings.confirmBeforeEmergencyStop) {
      setShowEmergencyModal(true);
    } else {
      executeEmergencyStopAll();
    }
  };

  // Save Car Name / MAC / Wiring changes
  const handleSaveCarConfig = (
    carId: number,
    updates: {
      name: string;
      macAddress: string;
      remoteLabel: string;
      wiringVerified: boolean;
    }
  ) => {
    setCars((prev) =>
      prev.map((c) => {
        if (c.id !== carId) return c;
        const hasMac = Boolean(updates.macAddress);
        const nextConn =
          mode === 'DEMO'
            ? c.connectionStatus === 'OFFLINE'
              ? 'OFFLINE'
              : 'ONLINE'
            : hasMac
            ? c.connectionStatus === 'UNCONFIGURED'
              ? 'OFFLINE'
              : c.connectionStatus
            : 'UNCONFIGURED';
        const isRunning = activeSessions.some((s) => s.carId === c.id);
        return {
          ...c,
          name: updates.name,
          macAddress: updates.macAddress,
          remoteLabel: updates.remoteLabel,
          wiringVerified: updates.wiringVerified,
          connectionStatus: nextConn,
          availability: isRunning
            ? 'IN_USE'
            : nextConn === 'ONLINE'
            ? 'AVAILABLE'
            : 'OFFLINE',
          lastHeartbeatAt: nextConn === 'ONLINE' ? Date.now() : c.lastHeartbeatAt,
        };
      })
    );
  };

  // Save Business Settings
  const handleSaveSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch {
      // ignore
    }

    if (newSettings.numberOfCars !== cars.length) {
      setCars((prev) => {
        if (newSettings.numberOfCars < prev.length) {
          return prev.slice(0, newSettings.numberOfCars);
        }
        const extra = createInitialCars(newSettings.numberOfCars, mode).slice(
          prev.length
        );
        return [...prev, ...extra];
      });
    }

    if (!newSettings.availableDurations.includes(selectedDuration)) {
      setSelectedDuration(newSettings.availableDurations[0] || 5);
    }
  };

  // 1-second Countdown & Heartbeat Ticker
  const stopCarRef = useRef(handleStopCar);
  useEffect(() => {
    stopCarRef.current = handleStopCar;
  }, [handleStopCar]);

  const carsRef = useRef(cars);
  useEffect(() => {
    carsRef.current = cars;
  }, [cars]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (mode === 'DEMO') {
        setCars((prev) =>
          prev.map((c) =>
            c.connectionStatus === 'ONLINE'
              ? { ...c, lastHeartbeatAt: Date.now() }
              : c
          )
        );
      }

      setActiveSessions((prevSessions) => {
        if (prevSessions.length === 0) return prevSessions;

        const expiredCarIds: number[] = [];
        const updated = prevSessions.map((session) => {
          const nextRemaining = session.remainingSeconds - 1;
          if (nextRemaining <= 0) {
            expiredCarIds.push(session.carId);
            return { ...session, remainingSeconds: 0 };
          }
          return { ...session, remainingSeconds: nextRemaining };
        });

        if (expiredCarIds.length > 0) {
          expiredCarIds.forEach((carId) => {
            const carObj = carsRef.current.find((c) => c.id === carId);
            if (carObj) {
              setTimeout(() => {
                stopCarRef.current(carObj, 'TIMER_EXPIRED');
              }, 0);
            }
          });
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  const menuItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'four_cars',
      label: lang === 'km' ? 'ផ្ទាំងបញ្ជាឡានទាំង ៤ (មេ)' : '4-Car Quick Pad (Main)',
      icon: <Gamepad2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'cars',
      label: t.nav.cars,
      icon: <Car className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'sessions',
      label: t.nav.sessions,
      icon: <Radio className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'receivers',
      label: t.nav.receivers,
      icon: <Radio className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'history',
      label: t.nav.history,
      icon: <History className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'reports',
      label: t.nav.reports,
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPlaysCount = history.filter(
    (r) => r.startTime.slice(0, 10) === todayStr
  ).length;
  const todayRevenueSum = history
    .filter(
      (r) =>
        r.startTime.slice(0, 10) === todayStr &&
        r.currency === settings.currency
    )
    .reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col bg-console-grid">
      {/* Clean Top Bar with 1 Button to Open Menu / Enter Admin Pages */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Menu Button + Quick Back Button when inside a sub-page */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4 shrink-0" />
              <span>{lang === 'km' ? 'ម៉ឺនុយ' : 'Menu'}</span>
            </button>

            {activeView !== 'four_cars' ? (
              <button
                type="button"
                onClick={() => setActiveView('four_cars')}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'km' ? 'ត្រឡប់ទៅឡានទាំង ៤' : 'Back to 4 Cars'}
                </span>
              </button>
            ) : (
              <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap shrink-0">
                {settings.businessName}
              </span>
            )}
          </div>

          {/* Right: Mode Switch + Language + Theme + Emergency Stop */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleToggleMode('DEMO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'DEMO'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode('LIVE_HARDWARE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'LIVE_HARDWARE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                ESP32
              </button>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="min-h-[42px] min-w-[42px] px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Toggle Light or Dark Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleEmergencyStopClick}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <OctagonAlert className="w-4 h-4 shrink-0" />
              <span>{t.actions.emergencyStop}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Admin Menu Drawer (Opened via the single Menu button) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-start"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full p-5 flex flex-col justify-between gap-6 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-xs font-mono text-zinc-500">
                    {settings.businessName}
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    {lang === 'km' ? 'ម៉ឺនុយគ្រប់គ្រង' : 'Admin Menu'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="min-h-[38px] min-w-[38px] rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation List */}
              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-3 cursor-pointer ${
                        active
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Today Summary inside Drawer */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t.metrics.todayPlays}:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {todayPlaysCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{t.metrics.todayRevenue}:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(todayRevenueSum, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center gap-5">
        {bannerAlert && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{bannerAlert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerAlert(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Default View: ONLY the 4 Car Cards */}
        {activeView === 'four_cars' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cars.map((car) => {
              const cardDur = carDurations[car.id] || selectedDuration;
              return (
                <CarCard
                  key={car.id}
                  car={car}
                  activeSession={activeSessions.find((s) => s.carId === car.id)}
                  isSelected={selectedCarId === car.id}
                  selectedDuration={cardDur}
                  availableDurations={settings.availableDurations}
                  sessionPrice={getPriceForDuration(cardDur)}
                  currency={settings.currency}
                  mode={mode}
                  requireWiringVerification={settings.requireWiringVerification}
                  isBusy={isBusy}
                  t={t}
                  onSelectCar={handleSelectCar}
                  onSelectDuration={handleSelectDuration}
                  onStartCar={handleStartCar}
                  onStopCar={handleStopCar}
                  onEditCar={setEditingCar}
                  onToggleDemoOnline={handleToggleDemoOnline}
                />
              );
            })}
          </div>
        )}

        {/* Sub-pages accessible when opened from the Menu button */}
        {activeView === 'dashboard' && (
          <DashboardView
            mode={mode}
            masterStatus={masterStatus}
            cars={cars}
            activeSessions={activeSessions}
            history={history}
            settings={settings}
            selectedCarId={selectedCarId}
            selectedDuration={selectedDuration}
            isBusy={isBusy}
            t={t}
            getPriceForDuration={getPriceForDuration}
            onSelectDuration={handleSelectDuration}
            onSelectCar={handleSelectCar}
            onStartCar={handleStartCar}
            onStopCar={handleStopCar}
            onEditCar={setEditingCar}
            onToggleDemoOnline={handleToggleDemoOnline}
            onSetupDemoReceivers={handleSetupDemoReceivers}
            onNavigate={(p) => setActiveView(p)}
          />
        )}

        {activeView === 'cars' && (
          <CarManagementView
            mode={mode}
            cars={cars}
            activeSessions={activeSessions}
            settings={settings}
            selectedCarId={selectedCarId}
            selectedDuration={selectedDuration}
            isBusy={isBusy}
            t={t}
            getPriceForDuration={getPriceForDuration}
            onSelectCar={handleSelectCar}
            onStartCar={handleStartCar}
            onStopCar={handleStopCar}
            onEditCar={setEditingCar}
            onToggleDemoOnline={handleToggleDemoOnline}
            onSetupDemoReceivers={handleSetupDemoReceivers}
          />
        )}

        {activeView === 'sessions' && (
          <SessionManagementView
            mode={mode}
            cars={cars}
            activeSessions={activeSessions}
            settings={settings}
            selectedCarId={selectedCarId}
            selectedDuration={selectedDuration}
            isBusy={isBusy}
            t={t}
            getPriceForDuration={getPriceForDuration}
            onSelectCar={handleSelectCar}
            onSelectDuration={(mins) => setSelectedDuration(mins)}
            onStartCar={handleStartCar}
            onStopCar={handleStopCar}
            onEmergencyStopAll={handleEmergencyStopClick}
          />
        )}

        {activeView === 'receivers' && (
          <ReceiverManagementView
            mode={mode}
            masterStatus={masterStatus}
            cars={cars}
            settings={settings}
            apiLogs={apiLogs}
            t={t}
            onPingMaster={() => handlePingMaster()}
            onToggleMode={handleToggleMode}
            onToggleDemoOnline={handleToggleDemoOnline}
            onSetupDemoReceivers={handleSetupDemoReceivers}
            onDisconnectAllDemo={handleDisconnectAllDemo}
            onEditCar={setEditingCar}
          />
        )}

        {activeView === 'history' && (
          <PlayHistoryView
            history={history}
            cars={cars}
            t={t}
            onClearHistory={() => setHistory([])}
          />
        )}

        {activeView === 'reports' && (
          <RevenueReportsView
            history={history}
            cars={cars}
            settings={settings}
            t={t}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            t={t}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* Edit Car & Receiver MAC Address Modal */}
      <EditCarModal
        car={editingCar}
        t={t}
        onClose={() => setEditingCar(null)}
        onSave={handleSaveCarConfig}
      />

      {/* Emergency Stop Confirmation Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-white dark:bg-zinc-900 p-6 space-y-5">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <OctagonAlert className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold">{t.actions.emergencyStop}</h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Immediately broadcast RELAY_OFF to all {cars.length} ESP32 Receivers and stop all active RC car sessions?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t.actions.cancel}
              </button>
              <button
                type="button"
                onClick={executeEmergencyStopAll}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold"
              >
                Confirm {t.actions.emergencyStop}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
