import { request, withBearerToken } from './client';
import type { IoTDevice, RegisterIoTPayload, RegisterIoTResponse, SosRequest } from '../types/iot';

export function listIoTDevices(accessToken: string | null) {
  return request<IoTDevice[]>('/api/iot', {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function registerIoTDevice(accessToken: string | null, payload: RegisterIoTPayload) {
  return request<RegisterIoTResponse>('/api/iot/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function triggerSos(accessToken: string | null, payload: SosRequest) {
  return request<{ message: string }>('/api/iot/sos', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}
