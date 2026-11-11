import {
  ActiveSession,
  ApiCommandLog,
  BusinessSettings,
  CarUnit,
  HardwareCommandResult,
  MasterStatusResponse,
  OperationMode,
} from '../types/hardware';

export const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/;

export function isValidMacAddress(mac: string): boolean {
  return MAC_ADDRESS_REGEX.test(mac.trim());
}

export function normalizeMacAddress(mac: string): string {
  return mac.trim().toUpperCase();
}

function createLogEntry(
  method: 'GET' | 'POST',
  endpoint: string,
  mode: OperationMode,
  confirmed: boolean,
  options?: {
    targetCarId?: number;
    targetReceiverId?: number;
    requestBody?: Record<string, unknown>;
    responseBody?: Record<string, unknown>;
    errorMessage?: string;
  }
): ApiCommandLog {
  return {
    id: `CMD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    mode,
    targetCarId: options?.targetCarId,
    targetReceiverId: options?.targetReceiverId,
    requestBody: options?.requestBody,
    responseBody: options?.responseBody,
    confirmed,
    errorMessage: options?.errorMessage,
  };
}

async function fetchFromEsp32Master<T>(
  settings: BusinessSettings,
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>,
  timeoutMs = 3500
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const baseUrl = settings.masterIpAddress.replace(/\/+$/, '');
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }
    if (settings.masterAuthToken.trim()) {
      headers['X-RC-Auth'] = settings.masterAuthToken.trim();
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          (json && typeof json.error === 'string' && json.error) ||
          `HTTP ${response.status} from ESP32 Master`,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: json as T,
    };
  } catch (err) {
    clearTimeout(timer);
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? `Timeout after ${timeoutMs}ms waiting for ESP32 Master (${baseUrl})`
        : `Cannot reach ESP32 Master at ${baseUrl}. Verify local Wi-Fi connection.`;
    return {
      ok: false,
      status: 0,
      error: message,
    };
  }
}

export class HardwareAdapter {
  /**
   * GET /api/status
   */
  static async getStatus(
    mode: OperationMode,
    settings: BusinessSettings,
    selectedCarId: number | null
  ): Promise<{
    result: HardwareCommandResult<MasterStatusResponse>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/status';
    if (mode === 'DEMO') {
      const responseData: MasterStatusResponse = {
        mode: 'DEMO',
        masterConnected: false, // Never pretend physical hardware is connected in Demo Mode
        masterIp: settings.masterIpAddress,
        espNowReady: false,
        selectedCarId,
        lastSyncAt: new Date().toISOString(),
        errorMessage: null,
      };
      return {
        result: {
          ok: true,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          data: responseData,
        },
        log: createLogEntry('GET', endpoint, mode, true, {
          responseBody: {
            mode: 'DEMO',
            hardwareAttached: false,
            selectedCarId,
          },
        }),
      };
    }

    const res = await fetchFromEsp32Master<{
      ok: boolean;
      espNowReady: boolean;
      selectedCarId?: number | null;
    }>(settings, 'GET', endpoint);

    if (!res.ok || !res.data) {
      const statusData: MasterStatusResponse = {
        mode: 'LIVE_HARDWARE',
        masterConnected: false,
        masterIp: settings.masterIpAddress,
        espNowReady: false,
        selectedCarId,
        lastSyncAt: null,
        errorMessage: res.error || 'ESP32 Master unreachable',
      };
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          data: statusData,
          error: res.error,
        },
        log: createLogEntry('GET', endpoint, mode, false, {
          errorMessage: res.error,
        }),
      };
    }

    const statusData: MasterStatusResponse = {
      mode: 'LIVE_HARDWARE',
      masterConnected: true,
      masterIp: settings.masterIpAddress,
      espNowReady: Boolean(res.data.espNowReady),
      selectedCarId: res.data.selectedCarId ?? selectedCarId,
      lastSyncAt: new Date().toISOString(),
      errorMessage: null,
    };

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: statusData,
      },
      log: createLogEntry('GET', endpoint, mode, true, {
        responseBody: res.data as Record<string, unknown>,
      }),
    };
  }

  /**
   * GET /api/cars
   */
  static async getCars(
    mode: OperationMode,
    settings: BusinessSettings,
    localCars: CarUnit[]
  ): Promise<{
    result: HardwareCommandResult<CarUnit[]>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/cars';
    if (mode === 'DEMO') {
      return {
        result: {
          ok: true,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          data: localCars,
        },
        log: createLogEntry('GET', endpoint, mode, true, {
          responseBody: { count: localCars.length, source: 'demo_local_state' },
        }),
      };
    }

    const res = await fetchFromEsp32Master<{ cars: CarUnit[] }>(
      settings,
      'GET',
      endpoint
    );

    if (!res.ok || !res.data?.cars) {
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: res.error || 'Failed to read cars from ESP32 Master',
        },
        log: createLogEntry('GET', endpoint, mode, false, {
          errorMessage: res.error,
        }),
      };
    }

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: res.data.cars,
      },
      log: createLogEntry('GET', endpoint, mode, true, {
        responseBody: { count: res.data.cars.length },
      }),
    };
  }

  /**
   * POST /api/car/select
   */
  static async selectCar(
    mode: OperationMode,
    settings: BusinessSettings,
    car: CarUnit
  ): Promise<{
    result: HardwareCommandResult<{ selectedCarId: number; receiverId: number }>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/car/select';
    const requestPayload = {
      carId: car.id,
      receiverId: car.receiverId,
      macAddress: car.macAddress || null,
    };

    if (mode === 'DEMO') {
      const responsePayload = {
        ok: true,
        mode: 'DEMO',
        selectedCarId: car.id,
        receiverId: car.receiverId,
      };
      return {
        result: {
          ok: true,
          confirmedByHardware: true,
          timestamp: new Date().toISOString(),
          data: { selectedCarId: car.id, receiverId: car.receiverId },
        },
        log: createLogEntry('POST', endpoint, mode, true, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          responseBody: responsePayload,
        }),
      };
    }

    const res = await fetchFromEsp32Master<{
      ok: boolean;
      confirmed: boolean;
      selectedCarId: number;
      receiverId: number;
    }>(settings, 'POST', endpoint, requestPayload);

    if (!res.ok || !res.data?.confirmed) {
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: res.error || 'ESP32 Master did not confirm car selection',
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: res.error,
        }),
      };
    }

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: {
          selectedCarId: res.data.selectedCarId,
          receiverId: res.data.receiverId,
        },
      },
      log: createLogEntry('POST', endpoint, mode, true, {
        targetCarId: car.id,
        targetReceiverId: car.receiverId,
        requestBody: requestPayload,
        responseBody: res.data as Record<string, unknown>,
      }),
    };
  }

  /**
   * POST /api/session/start
   */
  static async startSession(
    mode: OperationMode,
    settings: BusinessSettings,
    car: CarUnit,
    selectedCarId: number | null,
    durationMinutes: number,
    activeSessions: ActiveSession[]
  ): Promise<{
    result: HardwareCommandResult<{
      sessionId: string;
      carId: number;
      receiverId: number;
      relayState: 'ON';
    }>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/session/start';
    const requestPayload = {
      carId: car.id,
      receiverId: car.receiverId,
      macAddress: car.macAddress || null,
      durationMinutes,
      durationSeconds: durationMinutes * 60,
      command: 'RELAY_ON',
    };

    // 1. Ensure this car is explicitly selected
    if (selectedCarId !== car.id) {
      const errorMsg = `Command rejected: Car ${car.id} is not the selected target.`;
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: errorMsg,
        }),
      };
    }

    // 2. Validate Receiver ONLINE status (both in Demo Mode and Live Hardware Mode)
    if (car.connectionStatus !== 'ONLINE') {
      const errorMsg = `Cannot start ${car.name}: Receiver #${car.receiverId} is offline. Confirm ESP-NOW receiver communication first.`;
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: errorMsg,
        }),
      };
    }

    // 3. Prevent starting a car already in use or duplicate sessions
    const existingSession = activeSessions.find((s) => s.carId === car.id);
    if (car.availability === 'IN_USE' || existingSession) {
      const errorMsg = `Cannot start ${car.name}: Car is already in use (${existingSession?.sessionId || 'ACTIVE'}).`;
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errorMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: errorMsg,
        }),
      };
    }

    // 4. In LIVE_HARDWARE mode, strictly require valid MAC address and wiring verification
    if (mode === 'LIVE_HARDWARE') {
      if (!car.macAddress || !isValidMacAddress(car.macAddress)) {
        const errorMsg = `Cannot start ${car.name} in Live Mode: Receiver #${car.receiverId} MAC address is not configured.`;
        return {
          result: {
            ok: false,
            confirmedByHardware: false,
            timestamp: new Date().toISOString(),
            error: errorMsg,
          },
          log: createLogEntry('POST', endpoint, mode, false, {
            targetCarId: car.id,
            targetReceiverId: car.receiverId,
            requestBody: requestPayload,
            errorMessage: errorMsg,
          }),
        };
      }

      if (settings.requireWiringVerification && !car.wiringVerified) {
        const errorMsg = `Safety block on ${car.name}: Verify RC remote and battery relay wiring in Car Management before starting Live Hardware.`;
        return {
          result: {
            ok: false,
            confirmedByHardware: false,
            timestamp: new Date().toISOString(),
            error: errorMsg,
          },
          log: createLogEntry('POST', endpoint, mode, false, {
            targetCarId: car.id,
            targetReceiverId: car.receiverId,
            requestBody: requestPayload,
            errorMessage: errorMsg,
          }),
        };
      }
    }

    if (mode === 'DEMO') {
      await new Promise((resolve) => setTimeout(resolve, 60));
      const sessionId = `SES-${Date.now().toString().slice(-5)}-C${car.id}`;
      const responsePayload = {
        ok: true,
        mode: 'DEMO',
        confirmed: true,
        sessionId,
        carId: car.id,
        receiverId: car.receiverId,
        relayState: 'ON' as const,
      };
      return {
        result: {
          ok: true,
          confirmedByHardware: true,
          timestamp: new Date().toISOString(),
          data: {
            sessionId,
            carId: car.id,
            receiverId: car.receiverId,
            relayState: 'ON',
          },
        },
        log: createLogEntry('POST', endpoint, mode, true, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          responseBody: responsePayload,
        }),
      };
    }

    // LIVE_HARDWARE mode
    const res = await fetchFromEsp32Master<{
      ok: boolean;
      confirmed: boolean;
      sessionId: string;
      carId: number;
      receiverId: number;
      relayState: 'ON' | 'OFF';
      error?: string;
    }>(settings, 'POST', endpoint, requestPayload);

    if (!res.ok || !res.data?.confirmed || res.data.relayState !== 'ON') {
      const errMsg =
        res.error ||
        res.data?.error ||
        `Hardware confirmation failed: Receiver #${car.receiverId} did not confirm Relay ON.`;
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: errMsg,
        }),
      };
    }

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: {
          sessionId: res.data.sessionId,
          carId: res.data.carId,
          receiverId: res.data.receiverId,
          relayState: 'ON',
        },
      },
      log: createLogEntry('POST', endpoint, mode, true, {
        targetCarId: car.id,
        targetReceiverId: car.receiverId,
        requestBody: requestPayload,
        responseBody: res.data as Record<string, unknown>,
      }),
    };
  }

  /**
   * POST /api/session/stop
   */
  static async stopSession(
    mode: OperationMode,
    settings: BusinessSettings,
    car: CarUnit,
    reason: 'TIMER_EXPIRED' | 'MANUAL_STOP' | 'HEARTBEAT_LOST'
  ): Promise<{
    result: HardwareCommandResult<{
      carId: number;
      receiverId: number;
      relayState: 'OFF';
    }>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/session/stop';
    const requestPayload = {
      carId: car.id,
      receiverId: car.receiverId,
      macAddress: car.macAddress || null,
      command: 'RELAY_OFF',
      reason,
    };

    if (mode === 'DEMO') {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const responsePayload = {
        ok: true,
        mode: 'DEMO',
        confirmed: true,
        carId: car.id,
        receiverId: car.receiverId,
        relayState: 'OFF' as const,
        reason,
      };
      return {
        result: {
          ok: true,
          confirmedByHardware: true,
          timestamp: new Date().toISOString(),
          data: {
            carId: car.id,
            receiverId: car.receiverId,
            relayState: 'OFF',
          },
        },
        log: createLogEntry('POST', endpoint, mode, true, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          responseBody: responsePayload,
        }),
      };
    }

    const res = await fetchFromEsp32Master<{
      ok: boolean;
      confirmed: boolean;
      carId: number;
      receiverId: number;
      relayState: 'OFF';
      error?: string;
    }>(settings, 'POST', endpoint, requestPayload);

    if (!res.ok || !res.data?.confirmed || res.data.relayState !== 'OFF') {
      const errMsg =
        res.error ||
        res.data?.error ||
        `Hardware STOP confirmation missing from Receiver #${car.receiverId}! Verify RC remote manually.`;
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          targetCarId: car.id,
          targetReceiverId: car.receiverId,
          requestBody: requestPayload,
          errorMessage: errMsg,
        }),
      };
    }

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: {
          carId: car.id,
          receiverId: res.data.receiverId,
          relayState: 'OFF',
        },
      },
      log: createLogEntry('POST', endpoint, mode, true, {
        targetCarId: car.id,
        targetReceiverId: car.receiverId,
        requestBody: requestPayload,
        responseBody: res.data as Record<string, unknown>,
      }),
    };
  }

  /**
   * POST /api/emergency-stop
   */
  static async emergencyStopAll(
    mode: OperationMode,
    settings: BusinessSettings,
    cars: CarUnit[]
  ): Promise<{
    result: HardwareCommandResult<{ stoppedCarIds: number[] }>;
    log: ApiCommandLog;
  }> {
    const endpoint = '/api/emergency-stop';
    const requestPayload = {
      command: 'EMERGENCY_STOP_ALL_RELAYS_OFF',
      targetReceivers: cars.map((c) => ({
        carId: c.id,
        receiverId: c.receiverId,
        macAddress: c.macAddress || null,
      })),
    };

    if (mode === 'DEMO') {
      const stoppedCarIds = cars.map((c) => c.id);
      const responsePayload = {
        ok: true,
        mode: 'DEMO',
        confirmed: true,
        allRelaysOff: true,
        stoppedCarIds,
      };
      return {
        result: {
          ok: true,
          confirmedByHardware: true,
          timestamp: new Date().toISOString(),
          data: { stoppedCarIds },
        },
        log: createLogEntry('POST', endpoint, mode, true, {
          requestBody: requestPayload,
          responseBody: responsePayload,
        }),
      };
    }

    const res = await fetchFromEsp32Master<{
      ok: boolean;
      confirmed: boolean;
      stoppedCarIds: number[];
      error?: string;
    }>(settings, 'POST', endpoint, requestPayload);

    if (!res.ok || !res.data?.confirmed) {
      const errMsg =
        res.error ||
        res.data?.error ||
        'ESP32 Master did not confirm Emergency Stop. Turn off RC remotes manually immediately!';
      return {
        result: {
          ok: false,
          confirmedByHardware: false,
          timestamp: new Date().toISOString(),
          error: errMsg,
        },
        log: createLogEntry('POST', endpoint, mode, false, {
          requestBody: requestPayload,
          errorMessage: errMsg,
        }),
      };
    }

    return {
      result: {
        ok: true,
        confirmedByHardware: true,
        timestamp: new Date().toISOString(),
        data: { stoppedCarIds: res.data.stoppedCarIds },
      },
      log: createLogEntry('POST', endpoint, mode, true, {
        requestBody: requestPayload,
        responseBody: res.data as Record<string, unknown>,
      }),
    };
  }
}
