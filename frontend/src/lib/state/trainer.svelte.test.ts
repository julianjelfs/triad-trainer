import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Api } from '../api';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS, Trainer, type SettingsStore } from './trainer.svelte';

/** A Pi that can be switched off, holding one copy of the settings. */
function fakePi(initial: Settings = DEFAULT_SETTINGS) {
  const pi = { reachable: true, settings: { ...initial } };
  const api = {
    getSettings: async () => {
      if (!pi.reachable) throw new Error('unreachable');
      return { ...pi.settings };
    },
    saveSettings: async (settings: Settings) => {
      if (!pi.reachable) throw new Error('unreachable');
      pi.settings = { ...settings };
      return { ...settings };
    }
  } as Api;
  return { pi, api };
}

/** The device copy, kept across "reloads" the way localStorage would be. */
function memoryStore(): SettingsStore {
  let stored: ReturnType<SettingsStore['read']> = null;
  return {
    read: () => (stored ? structuredClone(stored) : null),
    write: (value) => void (stored = structuredClone(value))
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Let the debounced save fire and settle. */
async function flush() {
  await vi.advanceTimersByTimeAsync(1000);
}

describe('Trainer offline', () => {
  it('opens on the device copy when the Pi is out of reach', async () => {
    const { pi, api } = fakePi({ ...DEFAULT_SETTINGS, learn_key: 9 });
    const store = memoryStore();

    await new Trainer(api, store).load();
    pi.reachable = false;

    const away = new Trainer(api, store);
    await away.load();
    expect(away.settings?.learn_key).toBe(9);
  });

  it('opens on defaults with nothing stored and no Pi, rather than not at all', async () => {
    const { pi, api } = fakePi();
    pi.reachable = false;

    const trainer = new Trainer(api, memoryStore());
    await trainer.load();
    expect(trainer.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a change made with the Pi unreachable and sends it once the Pi is back', async () => {
    const { pi, api } = fakePi();
    const store = memoryStore();
    pi.reachable = false;

    const away = new Trainer(api, store);
    await away.load();
    away.set({ learn_key: 4 });
    await flush();
    expect(pi.settings.learn_key).toBe(0);

    // Back home, the app reloads: the Pi's older copy must not win.
    pi.reachable = true;
    const home = new Trainer(api, store);
    await home.load();
    await flush();

    expect(home.settings?.learn_key).toBe(4);
    expect(pi.settings.learn_key).toBe(4);
  });
});
