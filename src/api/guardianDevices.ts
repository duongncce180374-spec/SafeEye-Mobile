import { request, withBearerToken } from './client';
import type { GuardianDevice, CreateDevicePayload, UpdateDevicePayload } from '../types/guardianDevices';

export function listGuardianDevices(accessToken: string | null) {
  return request<GuardianDevice[]>('/api/guardian-devices', {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function getGuardianDevice(accessToken: string | null, deviceId: string) {
  return request<GuardianDevice>(`/api/guardian-devices/${deviceId}`, {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function createGuardianDevice(accessToken: string | null, payload: CreateDevicePayload) {
  return request<GuardianDevice>('/api/guardian-devices', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function updateGuardianDevice(
  accessToken: string | null,
  deviceId: string,
  payload: UpdateDevicePayload,
) {
  return request<GuardianDevice>(`/api/guardian-devices/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function deleteGuardianDevice(accessToken: string | null, deviceId: string) {
  return request<{ message: string }>(`/api/guardian-devices/${deviceId}`, {
    method: 'DELETE',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}
