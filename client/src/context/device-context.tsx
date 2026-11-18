"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  authenticateDeviceApi,
  checkDeviceAuthApi,
  getLatestTelemetryApi,
  getDeviceStatusApi,
  getRelayStateApi,
  controlRelayApi,
  IConnectedDevice,
  ILatestTelemetry,
  IDeviceStatusResponse,
} from "@/lib/apis/device.api";

export interface IActivityLogItem {
  id: string;
  timestamp: string;
  relay: string;
  action: "ON" | "OFF";
  source: "Manual" | "Timer" | "Automation" | "Voice Assistant";
  userOrTrigger: string;
  duration?: string;
  status: "Success" | "Safety Cutoff" | "Warning";
  createdAt: string;
}

interface RelaysState {
  relay1: boolean;
  relay2: boolean;
  relay1State: "ON" | "OFF";
  relay2State: "ON" | "OFF";
}

interface DeviceContextType {
  isConnected: boolean;
  isOnline: boolean;
  isConnecting: boolean;
  isLoadingData: boolean;
  isSyncing: boolean;
  isManualRefreshing: boolean;
  hasSynced: boolean;
  error: string | null;
  device: IConnectedDevice | null;
  telemetry: ILatestTelemetry | null;
  statusInfo: IDeviceStatusResponse | null;
  relays: RelaysState;
  activityLogs: IActivityLogItem[];
  addActivityLog: (item: Omit<IActivityLogItem, "id" | "createdAt">) => void;
  connectDevice: (name: string, key: string, deviceId?: string) => Promise<boolean>;
  disconnectDevice: () => void;
  toggleRelay: (relay: 1 | 2, state: boolean) => Promise<boolean>;
  emergencyStop: () => Promise<boolean>;
  refreshData: (isManual?: boolean) => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = "cropwise_esp32_connection_v1";

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<IConnectedDevice | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [hasSynced, setHasSynced] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<ILatestTelemetry | null>(null);
  const [statusInfo, setStatusInfo] = useState<IDeviceStatusResponse | null>(null);
  const [relays, setRelays] = useState<RelaysState>({
    relay1: false,
    relay2: false,
    relay1State: "OFF",
    relay2State: "OFF",
  });

  const [activityLogs, setActivityLogs] = useState<IActivityLogItem[]>([]);

  const formatLogTime = (date: Date) => {
    const isToday = new Date().toDateString() === date.toDateString();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return isToday ? `Today, ${time}` : `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
  };

  const addActivityLog = useCallback((item: Omit<IActivityLogItem, "id" | "createdAt">) => {
    const newLog: IActivityLogItem = {
      ...item,
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => {
      const updated = [newLog, ...prev.filter((l) => l.id !== newLog.id)].slice(0, 100);
      try {
        localStorage.setItem("cropwise_device_activity_logs_v1", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // isSyncing only shows visual spinner for explicit manual user refreshes or initial un-synced load
  const isSyncing = isManualRefreshing || (isConnected && !hasSynced);

  // Load saved connection and activity logs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.deviceId && parsed?.connected) {
          setDevice(parsed);
          setIsConnected(true);
        }
      }
      const storedLogs = localStorage.getItem("cropwise_device_activity_logs_v1");
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        if (Array.isArray(parsedLogs)) {
          setActivityLogs(parsedLogs);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch telemetry & status
  const refreshData = useCallback(async (isManual = false) => {
    if (!device?.deviceId) return;
    const devId = device.deviceId;
    
    if (isManual) {
      setIsManualRefreshing(true);
    } else {
      setIsLoadingData(true);
    }
    const startTime = Date.now();

    try {
      const [telRes, statRes, relayRes] = await Promise.all([
        getLatestTelemetryApi(devId).catch(() => null),
        getDeviceStatusApi(devId).catch(() => null),
        getRelayStateApi(devId).catch(() => null),
      ]);

      const r1 = relayRes?.relay1 || statRes?.relay1 || "OFF";
      const r2 = relayRes?.relay2 || statRes?.relay2 || "OFF";
      const r1On = String(r1).toUpperCase() === "ON";
      const r2On = String(r2).toUpperCase() === "ON";

      setRelays({
        relay1: r1On,
        relay2: r2On,
        relay1State: r1On ? "ON" : "OFF",
        relay2State: r2On ? "ON" : "OFF",
      });

      if (statRes) {
        setStatusInfo({
          ...statRes,
          relay1: r1On ? "ON" : "OFF",
          relay2: r2On ? "ON" : "OFF",
        });
        // Directly apply online status from endpoint (status === "online" or active === true)
        const online =
          statRes.status === "online" ||
          statRes.active === true ||
          (statRes.secondsSinceLastSeen != null && statRes.secondsSinceLastSeen < 3600);
        setIsOnline(online);
      }

      if (telRes?.data) {
        const d = telRes.data as any;
        const normalizedTel: ILatestTelemetry = {
          deviceId: d.deviceId || d.device_id || devId,
          temperature: d.temperature ?? d.temperature1 ?? null,
          humidity: d.humidity ?? d.humidity1 ?? null,
          soilMoistureRaw: d.soilMoistureRaw ?? d.soil_moisture_raw ?? d.soil1 ?? null,
          rainSensorRaw: d.rainSensorRaw ?? d.rain_sensor_raw ?? d.rain ?? null,
          gpsValid: Boolean(d.gpsValid ?? d.gps_valid),
          latitude: d.latitude != null ? Number(d.latitude) : null,
          longitude: d.longitude != null ? Number(d.longitude) : null,
          altitude: d.altitude != null ? Number(d.altitude) : null,
          satellites: d.satellites != null ? Number(d.satellites) : null,
          recordedAt: d.recordedAt || d.created_at || statRes?.lastSeen || null,
        };
        setTelemetry(normalizedTel);
      }
    } catch (err: any) {
      console.warn("Device telemetry refresh warning:", err?.message);
    } finally {
      if (isManual) {
        const elapsed = Date.now() - startTime;
        const minDuration = 500;
        if (elapsed < minDuration) {
          await new Promise((r) => setTimeout(r, minDuration - elapsed));
        }
        setIsManualRefreshing(false);
      }
      setIsLoadingData(false);
      setHasSynced(true);
    }
  }, [device?.deviceId]);

  // Periodic heartbeat poll every 4 seconds when connected (silent background, near real-time sync)
  useEffect(() => {
    if (!isConnected || !device?.deviceId) return;

    refreshData(false);
    const interval = setInterval(() => {
      refreshData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [isConnected, device?.deviceId, refreshData]);

  // Connect Device
  const connectDevice = async (name: string, key: string, deviceId = "esp32-001"): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      const res = await authenticateDeviceApi({
        deviceId: deviceId.trim() || "esp32-001",
        name: name.trim() || "ESP32 Master Agro",
        key: key.trim(),
      });

      if (res.success && res.connected) {
        const connectedDev: IConnectedDevice = {
          deviceId: res.device.deviceId,
          name: res.device.name,
          status: res.status,
          connected: true,
          lastConnectedAt: res.device.lastConnectedAt || new Date().toISOString(),
          token: res.device.token,
        };

        setDevice(connectedDev);
        setIsConnected(true);
        setIsOnline(res.status === "online");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(connectedDev));

        // Initial data fetch
        setTimeout(refreshData, 300);
        return true;
      } else {
        throw new Error(res.message || "Device could not be authenticated.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate device. Please check your Device Key.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Device
  const disconnectDevice = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDevice(null);
    setIsConnected(false);
    setIsOnline(false);
    setHasSynced(false);
    setIsLoadingData(false);
    setTelemetry(null);
    setStatusInfo(null);
    setRelays({
      relay1: false,
      relay2: false,
      relay1State: "OFF",
      relay2State: "OFF",
    });
  };

  // Toggle Relay (1 or 2)
  const toggleRelay = async (relay: 1 | 2, state: boolean): Promise<boolean> => {
    if (!device?.deviceId) return false;

    // Optimistic update
    setRelays((prev) => ({
      ...prev,
      [relay === 1 ? "relay1" : "relay2"]: state,
      [relay === 1 ? "relay1State" : "relay2State"]: state ? "ON" : "OFF",
    }));

    // Record manual action in activity log
    const relayName = relay === 1 ? "Relay 1 (Water Motor)" : "Relay 2 (Solenoid Valve)";
    const actionStr = state ? "ON" : "OFF";
    addActivityLog({
      timestamp: formatLogTime(new Date()),
      relay: relayName,
      action: actionStr,
      source: "Manual",
      userOrTrigger: "Manual switch by Riyad Khan",
      status: "Success",
    });

    try {
      const res = await controlRelayApi({
        deviceId: device.deviceId,
        relay,
        state,
      });

      if (res?.success) {
        if (res.relay1 !== undefined) {
          const r1On = res.relay1 === true || String(res.relay1).toUpperCase() === "ON";
          const r2On = res.relay2 === true || String(res.relay2).toUpperCase() === "ON";
          setRelays({
            relay1: r1On,
            relay2: r2On,
            relay1State: r1On ? "ON" : "OFF",
            relay2State: r2On ? "ON" : "OFF",
          });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Relay toggle failed:", err);
      // Revert on error
      refreshData();
      return false;
    }
  };

  // Emergency Stop: Turn both relays OFF immediately
  const emergencyStop = async (): Promise<boolean> => {
    if (!device?.deviceId) return false;

    // Optimistic update
    setRelays({
      relay1: false,
      relay2: false,
      relay1State: "OFF",
      relay2State: "OFF",
    });

    // Record emergency stop in activity log
    addActivityLog({
      timestamp: formatLogTime(new Date()),
      relay: "All Relays (Pump & Valve)",
      action: "OFF",
      source: "Manual",
      userOrTrigger: "Emergency Stop by Riyad Khan",
      status: "Safety Cutoff",
    });

    try {
      const res = await controlRelayApi({
        deviceId: device.deviceId,
        relay1: "OFF",
        relay2: "OFF",
      });

      if (res?.success) {
        setRelays({
          relay1: false,
          relay2: false,
          relay1State: "OFF",
          relay2State: "OFF",
        });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Emergency stop failed:", err);
      refreshData();
      return false;
    }
  };

  const clearError = () => setError(null);

  return (
    <DeviceContext.Provider
      value={{
        isConnected,
        isOnline,
        isConnecting,
        isLoadingData,
        isSyncing,
        isManualRefreshing,
        hasSynced,
        error,
        device,
        telemetry,
        statusInfo,
        relays,
        activityLogs,
        addActivityLog,
        connectDevice,
        disconnectDevice,
        toggleRelay,
        emergencyStop,
        refreshData,
        clearError,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return ctx;
}
