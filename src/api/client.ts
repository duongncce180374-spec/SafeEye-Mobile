export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8080').replace(/\/$/, '');

function readErrorMessage(payload: any, status: number) {
  if (!payload) return `Request failed (${status})`;
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const joined = payload.errors
      .map((item: { field?: string; message?: string }) => {
        const field = item.field ? `${item.field}: ` : '';
        return `${field}${item.message ?? 'Unknown error'}`;
      })
      .join('\n');
    return `${payload.error ?? 'Validation failed.'}\n${joined}`;
  }
  return payload.error ?? `Request failed (${status})`;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getApiBaseUrl() {
  return baseUrl;
}

export function withBearerToken(token: string | null | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
