import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { getApiBaseUrl } from '../api/client';
import { getSosAlert, listSosAlerts, resolveSosAlert } from '../api/sos';
import type {
  SosAlert,
  SosAlertEvent,
  SosConnectionStatus,
  SosResolvedEvent,
  SosStatus,
} from '../types/sos';
import { useAuth } from './AuthContext';
import { useGuardianDevices } from './GuardianDevicesContext';

type SosState = {
  alerts: SosAlert[] | null;
  activeAlerts: SosAlert[];
  resolvedAlerts: SosAlert[];
  selectedAlert: SosAlert | null;
  lastRealtimeAlert: SosAlert | null;
  loading: boolean;
  resolvingId: string | null;
  connectionStatus: SosConnectionStatus;
  error: string | null;
  loadAlerts: (status?: SosStatus) => Promise<void>;
  loadActiveAlerts: () => Promise<void>;
  loadAlert: (id: string) => Promise<SosAlert>;
  resolveAlert: (id: string) => Promise<void>;
  clearSelectedAlert: () => void;
  clearLastRealtimeAlert: () => void;
  clearError: () => void;
};

const SosContext = createContext<SosState | undefined>(undefined);

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function getAlertId(alert: SosAlert) {
  return alert.id ?? alert.sosId ?? alert.sosEventId ?? '';
}

function isResolvedStatus(status: unknown) {
  return status === 1 || status === 'Resolved' || status === 'resolved';
}

function normalizeSosAlert(message: SosAlertEvent): SosAlert {
  const sosEventId = readString(message.SosEventId ?? message.sosEventId);
  const deviceId = readString(message.DeviceId ?? message.deviceId);
  const deviceLabel = readString(message.DeviceLabel ?? message.deviceLabel);
  const timestamp = readString(message.Timestamp ?? message.timestamp);

  return {
    id: sosEventId,
    sosId: sosEventId,
    sosEventId,
    deviceId,
    deviceLabel,
    latitude: readNumber(message.Latitude ?? message.latitude),
    longitude: readNumber(message.Longitude ?? message.longitude),
    createdAt: timestamp,
    status: 'Active',
  };
}

function normalizeSosResolved(message: SosResolvedEvent): SosAlert {
  const sosEventId = readString(message.SosEventId ?? message.sosEventId);
  const deviceId = readString(message.DeviceId ?? message.deviceId);
  const timestamp = readString(message.Timestamp ?? message.timestamp);

  return {
    id: sosEventId,
    sosId: sosEventId,
    sosEventId,
    deviceId,
    resolvedById: readString(message.ResolvedById ?? message.resolvedById),
    resolvedAt: timestamp,
    status: 'Resolved',
  };
}

function mergeAlerts(existing: SosAlert[], incoming: SosAlert) {
  const id = getAlertId(incoming);
  if (!id) return [incoming, ...existing];

  const index = existing.findIndex((alert) => getAlertId(alert) === id);
  if (index === -1) return [incoming, ...existing];

  const next = [...existing];
  next[index] = { ...next[index], ...incoming };
  return next;
}

function markResolved(existing: SosAlert[], resolved: SosAlert) {
  const id = getAlertId(resolved);
  if (!id) return existing;

  return existing.map((alert): SosAlert =>
    getAlertId(alert) === id ? { ...alert, ...resolved, status: 'Resolved' as const } : alert,
  );
}

function removeAlert(existing: SosAlert[], targetId: string) {
  return existing.filter((alert) => getAlertId(alert) !== targetId);
}

function splitAlerts(data: SosAlert[]) {
  return {
    active: data.filter((alert) => !isResolvedStatus(alert.status)),
    resolved: data.filter((alert) => isResolvedStatus(alert.status)),
  };
}

export function SosProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const { devices: guardianDevices, loadDevices } = useGuardianDevices();
  const [alerts, setAlerts] = useState<SosAlert[] | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SosAlert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<SosAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SosAlert | null>(null);
  const [lastRealtimeAlert, setLastRealtimeAlert] = useState<SosAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<SosConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const watchedDeviceIdsRef = useRef<Set<string>>(new Set());
  const guardianDevicesRef = useRef(guardianDevices);
  const activePollingRef = useRef<number | null>(null);

  const applyAlertList = useCallback((data: SosAlert[], replaceVisibleList = true) => {
    const split = splitAlerts(data);
    setActiveAlerts(split.active);
    setResolvedAlerts(split.resolved);
    if (replaceVisibleList) setAlerts(data);
  }, []);

  const loadAlerts = useCallback(
    async (status?: SosStatus) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await listSosAlerts(accessToken, status);
        setAlerts(data);
        if (status === 'Active' || status === 0) {
          setActiveAlerts(data);
        } else if (status === 'Resolved' || status === 1) {
          setResolvedAlerts(data);
        } else {
          applyAlertList(data, false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load SOS alerts';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, applyAlertList],
  );

  const loadActiveAlerts = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listSosAlerts(accessToken, 'Active');
      setActiveAlerts(data);
      setAlerts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load active SOS alerts';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    guardianDevicesRef.current = guardianDevices;
  }, [guardianDevices]);

  const watchCurrentDevices = useCallback(async (connection = connectionRef.current) => {
    if (!connection || connection.state !== HubConnectionState.Connected) return;

    const devicesToWatch = guardianDevicesRef.current ?? [];
    for (const device of devicesToWatch) {
      if (!device.id || watchedDeviceIdsRef.current.has(device.id)) continue;
      try {
        await connection.invoke('WatchDevice', device.id);
        watchedDeviceIdsRef.current.add(device.id);
      } catch (err) {
        console.warn(`Failed to watch device ${device.id}:`, err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || guardianDevices) return;
    void loadDevices().catch((err) => {
      const message = err instanceof Error ? err.message : 'Failed to load guardian devices';
      setError(message);
    });
  }, [guardianDevices, isAuthenticated, loadDevices]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    void loadActiveAlerts().catch(() => {});
  }, [accessToken, isAuthenticated, loadActiveAlerts]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (activePollingRef.current !== null) {
        clearInterval(activePollingRef.current);
        activePollingRef.current = null;
      }
      return;
    }

    if (activePollingRef.current !== null) {
      clearInterval(activePollingRef.current);
    }

    activePollingRef.current = setInterval(() => {
      void loadActiveAlerts().catch(() => {});
    }, 25000) as unknown as number;

    return () => {
      if (activePollingRef.current !== null) {
        clearInterval(activePollingRef.current);
        activePollingRef.current = null;
      }
    };
  }, [accessToken, isAuthenticated, loadActiveAlerts]);

  useEffect(() => {
    void watchCurrentDevices();
  }, [guardianDevices, watchCurrentDevices]);

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      setAlerts(null);
      setActiveAlerts([]);
      setResolvedAlerts([]);
      setSelectedAlert(null);
      setLastRealtimeAlert(null);
      setConnectionStatus('disconnected');
      watchedDeviceIdsRef.current.clear();
      void connectionRef.current?.stop();
      connectionRef.current = null;
      return;
    }

    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/tracking`, {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveSosAlert', (message: SosAlertEvent) => {
      const alert = normalizeSosAlert(message);
      const alertId = getAlertId(alert);
      setActiveAlerts((prev) => mergeAlerts(prev, alert));
      setAlerts((prev) => mergeAlerts(prev ?? [], alert));
      setSelectedAlert(alert);
      setLastRealtimeAlert(alert);

      Alert.alert(
        'SOS Alert',
        `${alert.deviceLabel ?? alert.deviceId ?? 'Device'} sent an SOS alert.`,
      );

      if (alertId) {
        setResolvedAlerts((prev) => removeAlert(prev, alertId));
      }
    });

    connection.on('ReceiveSosResolved', (message: SosResolvedEvent) => {
      const resolved = normalizeSosResolved(message);
      const alertId = getAlertId(resolved);
      if (!alertId) return;

      setActiveAlerts((prev) => removeAlert(prev, alertId));
      setResolvedAlerts((prev) => mergeAlerts(markResolved(prev, resolved), resolved));
      setAlerts((prev) => markResolved(prev ?? [], resolved));
      setSelectedAlert((prev) =>
        prev && getAlertId(prev) === alertId ? { ...prev, ...resolved, status: 'Resolved' } : prev,
      );
      setLastRealtimeAlert((prev) => (prev && getAlertId(prev) === alertId ? null : prev));
    });

    connection.onreconnecting(() => {
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(() => {
      setConnectionStatus('connected');
      watchedDeviceIdsRef.current.clear();
      void watchCurrentDevices();
      void loadActiveAlerts();
    });

    connection.onclose(() => {
      if (!cancelled) setConnectionStatus('disconnected');
    });

    async function startConnection() {
      setConnectionStatus('connecting');
      setError(null);
      try {
        await connection.start();
        if (cancelled) {
          await connection.stop();
          return;
        }
        setConnectionStatus('connected');
        watchedDeviceIdsRef.current.clear();
        await watchCurrentDevices(connection);
        await loadActiveAlerts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect SOS realtime';
        setError(message);
        setConnectionStatus('disconnected');
      }
    }

    void startConnection();

    return () => {
      cancelled = true;
      watchedDeviceIdsRef.current.clear();
      if (connectionRef.current === connection) connectionRef.current = null;
      void connection.stop();
    };
  }, [accessToken, isAuthenticated, loadActiveAlerts, watchCurrentDevices]);

  const value = useMemo<SosState>(
    () => ({
      alerts,
      activeAlerts,
      resolvedAlerts,
      selectedAlert,
      lastRealtimeAlert,
      loading,
      resolvingId,
      connectionStatus,
      error,
      loadAlerts,
      loadActiveAlerts,
      loadAlert: async (id) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          const alert = await getSosAlert(accessToken, id);
          setSelectedAlert(alert);
          return alert;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load SOS alert';
          setError(message);
          throw err;
        }
      },
      resolveAlert: async (id) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        setResolvingId(id);
        try {
          const resolved: SosAlert = {
            id,
            sosId: id,
            sosEventId: id,
            status: 'Resolved',
            resolvedAt: new Date().toISOString(),
          };
          await resolveSosAlert(accessToken, id);
          setActiveAlerts((prev) => removeAlert(prev, id));
          setResolvedAlerts((prev) => mergeAlerts(markResolved(prev, resolved), resolved));
          setAlerts((prev) => markResolved(prev ?? [], resolved));
          setSelectedAlert((prev) =>
            prev && getAlertId(prev) === id ? { ...prev, ...resolved } : prev,
          );
          setLastRealtimeAlert((prev) => (prev && getAlertId(prev) === id ? null : prev));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to resolve SOS alert';
          setError(message);
          throw err;
        } finally {
          setResolvingId(null);
        }
      },
      clearSelectedAlert: () => setSelectedAlert(null),
      clearLastRealtimeAlert: () => setLastRealtimeAlert(null),
      clearError: () => setError(null),
    }),
    [
      accessToken,
      activeAlerts,
      alerts,
      connectionStatus,
      error,
      lastRealtimeAlert,
      loadActiveAlerts,
      loadAlerts,
      loading,
      resolvedAlerts,
      resolvingId,
      selectedAlert,
    ],
  );

  return <SosContext.Provider value={value}>{children}</SosContext.Provider>;
}

export function useSos() {
  const context = useContext(SosContext);
  if (!context) {
    throw new Error('useSos must be used within SosProvider.');
  }
  return context;
}
