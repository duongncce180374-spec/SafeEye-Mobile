import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { listIoTDevices, registerIoTDevice, triggerSos } from '../api/iot';
import type { IoTDevice, RegisterIoTPayload, RegisterIoTResponse, SosRequest } from '../types/iot';
import { useAuth } from './AuthContext';

type IoTState = {
  devices: IoTDevice[] | null;
  loading: boolean;
  error: string | null;
  sosTriggering: boolean;
  loadDevices: () => Promise<void>;
  registerDevice: (payload: RegisterIoTPayload) => Promise<RegisterIoTResponse>;
  triggerSosAlert: (payload: SosRequest) => Promise<void>;
  clearError: () => void;
};

const IoTContext = createContext<IoTState | undefined>(undefined);

export function IoTProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sosTriggering, setSosTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo<IoTState>(
    () => ({
      devices,
      loading,
      error,
      sosTriggering,
      loadDevices: async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
          const data = await listIoTDevices(accessToken);
          setDevices(data);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load IoT devices';
          setError(message);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      registerDevice: async (payload) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          const device = await registerIoTDevice(accessToken, payload);
          const listDevice: IoTDevice = {
            id: device.deviceId,
            deviceKey: device.deviceKey,
            label: device.label,
            firebaseDeviceKey: device.firebaseDeviceKey,
            guardianCount: 0,
          };
          setDevices((prev) => (prev ? [...prev, listDevice] : [listDevice]));
          return device;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to register IoT device';
          setError(message);
          throw err;
        }
      },
      triggerSosAlert: async (payload) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        setSosTriggering(true);
        try {
          await triggerSos(accessToken, payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to trigger SOS';
          setError(message);
          throw err;
        } finally {
          setSosTriggering(false);
        }
      },
      clearError: () => setError(null),
    }),
    [accessToken, devices, loading, error, sosTriggering],
  );

  return <IoTContext.Provider value={value}>{children}</IoTContext.Provider>;
}

export function useIoT() {
  const context = useContext(IoTContext);
  if (!context) {
    throw new Error('useIoT must be used within IoTProvider.');
  }
  return context;
}
