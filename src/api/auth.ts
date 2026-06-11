import { request } from './client';
import type { AuthResult } from '../types/auth';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function register(payload: RegisterPayload) {
  return request<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
