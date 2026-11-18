/* eslint-disable @typescript-eslint/no-explicit-any */

const getBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5007"
  ).replace(/\/+$/, "");
};

const UPSTREAM_IOT_URL =
  process.env.NEXT_PUBLIC_IOT_URL ||
  process.env.NEXT_PUBLIC_ESP32_API_URL ||
  "https://esp32-iot-cloude-connect.vercel.app";

export interface IDeviceAuthRequest {
  deviceId?: string;
  name: string;
  key: string;
}

export interface IConnectedDevice {
  deviceId: string;
  name: string;
  status: "online" | "offline";
  connected: boolean;
  lastConnectedAt?: string;
  lastSeen?: string;
  secondsSinceLastSeen?: number;
  token?: string;
}

export interface IDeviceAuthResponse {
  success: boolean;
  connected: boolean;
  status: "online" | "offline";
  message: string;
  device: IConnectedDevice;
  permissions?: {
    telemetryUpload: boolean;
    telemetryRead: boolean;
    relayControl: boolean;
    relayCommandPoll: boolean;
  };
  apis?: Record<string, { method: string; endpoint: string; description: string }>;
}

export interface ILatestTelemetry {
  deviceId?: string;
  temperature?: number | null;
  humidity?: number | null;
  soilMoistureRaw?: number | null;
  rainSensorRaw?: number | null;
  gpsValid?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  satellites?: number | null;
  recordedAt?: string | null;
  created_at?: string | null;
  rawPayload?: any;
}

export interface IDeviceStatusResponse {
  success: boolean;
  deviceId: string;
  status: "online" | "offline";
  active: boolean;
  lastSeen: string | null;
  secondsSinceLastSeen: number | null;
  relay1: "ON" | "OFF" | boolean;
  relay2: "ON" | "OFF" | boolean;
}

export interface IRelayControlResponse {
  success: boolean;
  deviceId: string;
  relay: number;
  state: "ON" | "OFF";
  relay1?: "ON" | "OFF" | boolean;
  relay2?: "ON" | "OFF" | boolean;
  updatedAt?: string;
}

/**
 * 1. Authenticate and Connect Device (POST /api/device/auth)
 */
export async function authenticateDeviceApi(
  payload: IDeviceAuthRequest
): Promise<IDeviceAuthResponse> {
  const requestBody = {
    deviceId: payload.deviceId || "esp32-001",
    name: payload.name.trim(),
    key: payload.key.trim(),
  };

  let primaryErr: any = null;

  // Try local backend first
  try {
    const res = await fetch(`${getBaseUrl()}/api/device/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json().catch(() => null);
    if (errJson?.message) {
      primaryErr = new Error(errJson.message);
    }
  } catch (err: any) {
    primaryErr = err;
  }

  // Fallback direct to upstream IoT cloud gateway
  try {
    const directRes = await fetch(`${UPSTREAM_IOT_URL}/api/device/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (directRes.ok) {
      return await directRes.json();
    }
    const directErr = await directRes.json().catch(() => null);
    throw new Error(directErr?.message || "Failed to authenticate device with given key.");
  } catch (directErr: any) {
    throw new Error(
      directErr?.message || primaryErr?.message || "Device connection failed. Check your Secret Key (102030)."
    );
  }
}

/**
 * 2. Check Device Connection Status (GET /api/device/auth?deviceId=...)
 */
export async function checkDeviceAuthApi(deviceId = "esp32-001"): Promise<{
  success: boolean;
  deviceId: string;
  name: string;
  connected: boolean;
  status: "online" | "offline";
  lastConnectedAt?: string;
  secondsSinceLastSeen?: number;
}> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/device/auth?deviceId=${encodeURIComponent(deviceId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  try {
    const upRes = await fetch(`${UPSTREAM_IOT_URL}/api/device/auth?deviceId=${encodeURIComponent(deviceId)}`, {
      cache: "no-store",
    });
    if (upRes.ok) {
      return await upRes.json();
    }
  } catch {
    // fallback
  }

  return {
    success: false,
    deviceId,
    name: "ESP32 Master Agro",
    connected: false,
    status: "offline",
  };
}

/**
 * 3. Get Latest Device Telemetry (GET /api/device/data/latest?deviceId=...)
 */
export async function getLatestTelemetryApi(
  deviceId = "esp32-001"
): Promise<{ success: boolean; data: ILatestTelemetry; relay1?: any; relay2?: any }> {
  // Directly query the Upstream IoT Vercel Cloud endpoint first
  try {
    const directRes = await fetch(
      `${UPSTREAM_IOT_URL}/api/device/data/latest?deviceId=${encodeURIComponent(deviceId)}`,
      { cache: "no-store" }
    );
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch {
    // fallback to local API if network fails
  }

  try {
    const res = await fetch(`${getBaseUrl()}/api/device/data/latest?deviceId=${encodeURIComponent(deviceId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  throw new Error("Failed to fetch latest device telemetry");
}

/**
 * 4. Get Real-time Relay States (GET /api/device/relay?deviceId=...)
 */
export async function getRelayStateApi(
  deviceId = "esp32-001"
): Promise<{ success: boolean; deviceId: string; relay1: "ON" | "OFF"; relay2: "ON" | "OFF" }> {
  // Query Upstream IoT Cloud Gateway directly first
  try {
    const directRes = await fetch(
      `${UPSTREAM_IOT_URL}/api/device/relay?deviceId=${encodeURIComponent(deviceId)}`,
      { cache: "no-store" }
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return {
        success: Boolean(data?.success),
        deviceId: data?.deviceId || deviceId,
        relay1: String(data?.relay1).toUpperCase() === "ON" ? "ON" : "OFF",
        relay2: String(data?.relay2).toUpperCase() === "ON" ? "ON" : "OFF",
      };
    }
  } catch {
    // fallback
  }

  // Fallback to local backend endpoint
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/device/relay?deviceId=${encodeURIComponent(deviceId)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data?.success),
        deviceId: data?.deviceId || deviceId,
        relay1: (data?.relay1State || (data?.relay1 ? "ON" : "OFF")) as "ON" | "OFF",
        relay2: (data?.relay2State || (data?.relay2 ? "ON" : "OFF")) as "ON" | "OFF",
      };
    }
  } catch {
    // fallback
  }

  return {
    success: false,
    deviceId,
    relay1: "OFF",
    relay2: "OFF",
  };
}

/**
 * 5. Get Device Online/Offline & Relay Status (GET /api/device/status?deviceId=...)
 */
export async function getDeviceStatusApi(
  deviceId = "esp32-001"
): Promise<IDeviceStatusResponse> {
  // Concurrently fetch status and real relay state
  const [relayState, statusData] = await Promise.all([
    getRelayStateApi(deviceId).catch(() => null),
    (async () => {
      try {
        const directRes = await fetch(
          `${UPSTREAM_IOT_URL}/api/device/status?deviceId=${encodeURIComponent(deviceId)}`,
          { cache: "no-store" }
        );
        if (directRes.ok) {
          return await directRes.json();
        }
      } catch {
        // fallback
      }
      try {
        const res = await fetch(`${getBaseUrl()}/api/device/status?deviceId=${encodeURIComponent(deviceId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // fallback
      }
      return null;
    })(),
  ]);

  const isOnline = statusData?.status === "online" || Boolean(statusData?.active);
  const r1 = relayState?.relay1 || statusData?.relay1 || "OFF";
  const r2 = relayState?.relay2 || statusData?.relay2 || "OFF";

  return {
    success: Boolean(statusData?.success || relayState?.success),
    deviceId: statusData?.deviceId || deviceId,
    status: isOnline ? "online" : "offline",
    active: isOnline,
    lastSeen: statusData?.lastSeen || null,
    secondsSinceLastSeen: statusData?.secondsSinceLastSeen ?? null,
    relay1: r1,
    relay2: r2,
  };
}

export interface IControlRelayParams {
  deviceId: string;
  relay?: 1 | 2;
  state?: boolean | "ON" | "OFF";
  relay1?: "ON" | "OFF";
  relay2?: "ON" | "OFF";
  source?: string;
}

/**
 * 5. Control Relay (POST /api/device/relay)
 */
export async function controlRelayApi(
  params: IControlRelayParams
): Promise<IRelayControlResponse> {
  const deviceId = params.deviceId || "esp32-001";
  const payload: Record<string, any> = { deviceId };

  if (params.relay1 !== undefined) {
    payload.relay1 = params.relay1;
  }
  if (params.relay2 !== undefined) {
    payload.relay2 = params.relay2;
  }

  if (params.relay !== undefined && params.state !== undefined) {
    const stateStr =
      params.state === true || String(params.state).toUpperCase() === "ON"
        ? "ON"
        : "OFF";
    if (params.relay === 1) {
      payload.relay1 = stateStr;
    } else if (params.relay === 2) {
      payload.relay2 = stateStr;
    }
  }

  // Directly dispatch to Upstream IoT Vercel Cloud endpoint first
  try {
    const directRes = await fetch(`${UPSTREAM_IOT_URL}/api/device/relay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (directRes.ok) {
      const data = await directRes.json();
      return data?.data || data;
    }
  } catch {
    // fallback to local API if network fails
  }

  try {
    const res = await fetch(`${getBaseUrl()}/api/device/relay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.data || data;
    }
  } catch {
    // fallback
  }

  throw new Error("Failed to dispatch relay command to device gateway");
}
