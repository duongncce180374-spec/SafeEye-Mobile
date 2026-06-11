import { request, withBearerToken } from './client';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  fcmToken: string | null;
  deviceCount: number;
  createdAt: string;
};

export function getCurrentUser(accessToken: string | null) {
  return request<CurrentUser>('/api/users/me', {
    method: 'GET',
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export type UpdateUserPayload = {
  name?: string;
  password?: string;
};

export function updateUser(accessToken: string | null, payload: UpdateUserPayload) {
  return request<CurrentUser>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

export function updateFcmToken(accessToken: string | null, fcmToken: string) {
  return request<{ message: string }>('/api/users/me/fcm-token', {
    method: 'PUT',
    body: JSON.stringify({ fcmToken }),
    headers: {
      ...withBearerToken(accessToken),
    },
  });
}

