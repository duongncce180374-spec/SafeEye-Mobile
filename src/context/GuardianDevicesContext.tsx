import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  listGuardianDevices,
  getGuardianDevice,
  createGuardianDevice,
  updateGuardianDevice,
  deleteGuardianDevice,
} from '../api/guardianDevices';
import type { GuardianDevice, CreateDevicePayload, UpdateDevicePayload } from '../types/guardianDevices';
import { useAuth } from './AuthContext';

type DevicesState = {
  devices: GuardianDevice[] | null;
  loading: boolean;
  error: string | null;
  loadDevices: () => Promise<void>;
  addDevice: (payload: CreateDevicePayload) => Promise<GuardianDevice>;
  getDevice: (deviceId: string) => Promise<GuardianDevice>;
  editDevice: (deviceId: string, payload: UpdateDevicePayload) => Promise<GuardianDevice>;
  removeDevice: (deviceId: string) => Promise<void>;
  clearError: () => void;
};

const GuardianDevicesContext = createContext<DevicesState | undefined>(undefined);

export function GuardianDevicesProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [devices, setDevices] = useState<GuardianDevice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo<DevicesState>(
    () => ({
      devices,
      loading,
      error,
      loadDevices: async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
          const data = await listGuardianDevices(accessToken);
          setDevices(data);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load devices';
          setError(message);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      addDevice: async (payload) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          const device = await createGuardianDevice(accessToken, payload);
          setDevices((prev) => (prev ? [...prev, device] : [device]));
          return device;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to add device';
          setError(message);
          throw err;
        }
      },
      getDevice: async (deviceId) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          return await getGuardianDevice(accessToken, deviceId);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to get device';
          setError(message);
          throw err;
        }
      },
      editDevice: async (deviceId, payload) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          const updated = await updateGuardianDevice(accessToken, deviceId, payload);
          setDevices((prev) =>
            prev ? prev.map((d) => (d.id === deviceId ? updated : d)) : null,
          );
          return updated;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to update device';
          setError(message);
          throw err;
        }
      },
      removeDevice: async (deviceId) => {
        if (!accessToken) throw new Error('Not authenticated');
        setError(null);
        try {
          await deleteGuardianDevice(accessToken, deviceId);
          setDevices((prev) => (prev ? prev.filter((d) => d.id !== deviceId) : null));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to delete device';
          setError(message);
          throw err;
        }
      },
      clearError: () => setError(null),
    }),
    [accessToken, devices, loading, error],
  );

  return (
    <GuardianDevicesContext.Provider value={value}>
      {children}
    </GuardianDevicesContext.Provider>
  );
}

export function useGuardianDevices() {
  const context = useContext(GuardianDevicesContext);
  if (!context) {
    throw new Error('useGuardianDevices must be used within GuardianDevicesProvider.');
  }
  return context;
}
