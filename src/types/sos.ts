export type SosStatus = 'Active' | 'Resolved' | 0 | 1;

export type SosConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type SosAlert = {
  id?: string;
  sosId?: string;
  sosEventId?: string;
  status?: SosStatus | number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  deviceId?: string;
  iotDeviceId?: string;
  deviceLabel?: string;
  userId?: string;
  resolvedById?: string;
  message?: string;
  [key: string]: unknown;
};

export type SosAlertEvent = {
  SosEventId?: string;
  sosEventId?: string;
  DeviceId?: string;
  deviceId?: string;
  DeviceLabel?: string;
  deviceLabel?: string;
  Latitude?: number;
  latitude?: number;
  Longitude?: number;
  longitude?: number;
  Timestamp?: string;
  timestamp?: string;
};

export type SosResolvedEvent = {
  SosEventId?: string;
  sosEventId?: string;
  DeviceId?: string;
  deviceId?: string;
  ResolvedById?: string;
  resolvedById?: string;
  Timestamp?: string;
  timestamp?: string;
};
