/** Thin typed wrapper over the FastAPI backend. Vite proxies /api in dev. */
import type { Settings } from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Away from the house and off the tailnet, the Pi's address can hang rather
 * than fail. Give up after this long and let the app carry on without it.
 */
const TIMEOUT_MS = 4000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(response.status, detail || response.statusText);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export type Api = typeof api;

export const api = {
  getSettings: () => request<Settings>('/settings'),

  saveSettings: (settings: Settings) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(settings) })
};
