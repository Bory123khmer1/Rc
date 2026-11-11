export type OperationMode = 'DEMO' | 'LIVE_HARDWARE';

export type Language = 'en' | 'km';

export type Currency = 'USD' | 'KHR';

export type RelayState = 'OFF' | 'ON';

export type ReceiverConnectionStatus = 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';

export type CarAvailabilityStatus = 'AVAILABLE' | 'IN_USE' | 'OFFLINE' | 'STOPPING';

export type AdminPage =
  | 'dashboard'
  | 'cars'
  | 'sessions'
  | 'receivers'
  | 'history'
  | 'reports'
  | 'settings';

export interface CarUnit {
  id: number;
  name: string;
  receiverId: number;
  macAddress: string;
  connectionStatus: ReceiverConnectionStatus;
  availability: CarAvailabilityStatus;
  relayState: RelayState;
  lastHeartbeatAt: number | null;
  wiringVerified: boolean;
  remoteLabel: string;
}

export interface ActiveSession {
  sessionId: string;
  carId: number;
  carName: string;
  receiverId: number;
  macAddress: string;
  durationMinutes: number;
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: string;
  price: number;
  currency: Currency;
  status: 'RUNNING' | 'STOPPING';
  mode: OperationMode;
}

export type SessionEndStatus =
  | 'COMPLETED'
  | 'STOPPED_EARLY'
  | 'EMERGENCY_STOPPED'
  | 'COMM_FAILURE';

export interface PlayHistoryRecord {
  sessionId: string;
  carId: number;
  carName: string;
  receiverId: number;
  macAddress: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  actualSecondsPlayed: number;
  status: SessionEndStatus;
  price: number;
  revenue: number;
  currency: Currency;
  mode: OperationMode;
}

export interface BusinessSettings {
  businessName: string;
  currency: Currency;
  pricePerPlayUSD: number;
  pricePerPlayKHR: number;
  useDurationTierPricing: boolean;
  durationPricesUSD: Record<number, number>;
  durationPricesKHR: Record<number, number>;
  availableDurations: number[];
  numberOfCars: number;
  masterIpAddress: string;
  masterAuthToken: string;
  heartbeatIntervalSec: number;
  heartbeatTimeoutSec: number;
  autoStopOnHeartbeatLoss: boolean;
  requireWiringVerification: boolean;
  confirmBeforeEmergencyStop: boolean;
  soundAlertsEnabled: boolean;
}

export interface MasterStatusResponse {
  mode: OperationMode;
  masterConnected: boolean;
  masterIp: string;
  espNowReady: boolean;
  selectedCarId: number | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
}

export interface ApiCommandLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  endpoint: string;
  mode: OperationMode;
  targetCarId?: number;
  targetReceiverId?: number;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  confirmed: boolean;
  errorMessage?: string;
}

export interface HardwareCommandResult<T = unknown> {
  ok: boolean;
  confirmedByHardware: boolean;
  timestamp: string;
  data?: T;
  error?: string;
}
