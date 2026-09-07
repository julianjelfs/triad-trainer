/** Thin typed wrapper over the FastAPI backend. Vite proxies /api in dev. */
import type { DrillItem, PracticeStats, Settings, TriadItem } from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(response.status, detail || response.statusText);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  getSettings: () => request<Settings>('/settings'),

  saveSettings: (settings: Settings) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  /** Rejects with ApiError(409) when the settings rule out every drill. */
  nextDrill: () => request<DrillItem>('/practice/next'),

  /** Log a run of shapes in one call, normally a completed lap of a drill. */
  logShapes: (items: TriadItem[]) =>
    request<unknown>('/practice/events', { method: 'POST', body: JSON.stringify(items) }),

  getStats: () => request<PracticeStats>('/practice/stats'),

  clearLog: () => request<void>('/practice/events', { method: 'DELETE' })
};
