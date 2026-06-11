import { request, withBearerToken } from './client';
import type { SosAlert, SosStatus } from '../types/sos';

function buildSosPath(status?: SosStatus) {
  return status === undefined ? '/api/sos' : `/api/sos?status=${encodeURIComponent(status)}`;
}

export function listSosAlerts(accessToken: string | null, status?: SosStatus) {
  return request<SosAlert[]>(buildSosPath(status), {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function getSosAlert(accessToken: string | null, id: string) {
  return request<SosAlert>(`/api/sos/${id}`, {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function resolveSosAlert(accessToken: string | null, id: string) {
  return request<void>(`/api/sos/${id}/resolve`, {
    method: 'PUT',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}
